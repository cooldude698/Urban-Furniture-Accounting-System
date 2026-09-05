import { pool } from '../db/pool';
import Decimal from 'decimal.js';

function computeSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const words1 = str1.split(/\s+/).filter(w => w.length > 1);
  const words2 = str2.split(/\s+/).filter(w => w.length > 1);
  const common = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  if (common.length > 0) {
    return (2 * common.length) / (words1.length + words2.length);
  }
  return 0.0;
}

export interface ParsedBillLine {
  productId: number;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: string;
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  confidence: number;
  isMatched: boolean;
}

export interface ParsedBillReceiptResult {
  vendor: {
    id: number | null;
    name: string;
    matchedName: string | null;
    confidence: number;
  } | null;
  billReference: string | null;
  billDate: string;
  dueDate: string;
  lines: ParsedBillLine[];
  totals: {
    subtotal: string;
    taxAmount: string;
    grandTotal: string;
  };
  rawTextPreview: string;
  confidenceScore: number;
}

export class BillScannerService {
  /**
   * Deterministically parses raw receipt text (from OCR, file upload, or paste)
   * into structured vendor bill fields with matching against contacts and products tables.
   */
  static async parseReceiptText(rawText: string): Promise<ParsedBillReceiptResult> {
    if (!rawText || !rawText.trim()) {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        vendor: null,
        billReference: null,
        billDate: today,
        dueDate: nextMonth,
        lines: [],
        totals: { subtotal: '0.00', taxAmount: '0.00', grandTotal: '0.00' },
        rawTextPreview: '',
        confidenceScore: 0,
      };
    }

    const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const lines: string[] = [];
    for (const rl of rawLines) {
      if (rl.includes(',') && !rl.match(/^\d+[\.,]\d+/)) {
        lines.push(...rl.split(/,\s*/));
      } else {
        lines.push(rl);
      }
    }

    // 1. Extract Vendor Name
    const vendorExtract = await this.extractAndMatchVendor(lines, rawText);

    // 2. Extract Bill Reference / Invoice Number
    const billReference = this.extractBillReference(rawText);

    // 3. Extract Dates (Bill Date & Due Date)
    const { billDate, dueDate } = this.extractDates(rawText);

    // 4. Extract Line Items
    const parsedLines = await this.extractAndMatchLineItems(lines);

    // 5. Compute or extract totals
    let subtotalDec = new Decimal(0);
    let taxDec = new Decimal(0);
    let grandTotalDec = new Decimal(0);

    for (const pl of parsedLines) {
      subtotalDec = subtotalDec.plus(new Decimal(pl.subtotal));
      taxDec = taxDec.plus(new Decimal(pl.taxAmount));
      grandTotalDec = grandTotalDec.plus(new Decimal(pl.total));
    }

    // Attempt to extract explicit total from text if lines didn't yield values
    const explicitTotal = this.extractExplicitTotal(rawText);
    if (parsedLines.length === 0 && explicitTotal) {
      grandTotalDec = new Decimal(explicitTotal);
      subtotalDec = grandTotalDec.dividedBy(1.18).toDecimalPlaces(2);
      taxDec = grandTotalDec.minus(subtotalDec);
    }

    const confidenceScore = this.calculateConfidence(vendorExtract, billReference, parsedLines);

    return {
      vendor: vendorExtract,
      billReference,
      billDate,
      dueDate,
      lines: parsedLines,
      totals: {
        subtotal: subtotalDec.toFixed(2),
        taxAmount: taxDec.toFixed(2),
        grandTotal: grandTotalDec.toFixed(2),
      },
      rawTextPreview: rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText,
      confidenceScore,
    };
  }

  /**
   * Parses voice dictation phrase for a vendor bill (Hindi or English).
   * E.g. "Bill from Timber Hub, 5 Teak Dining Tables at 12,000 rupees each, reference TH-901"
   */
  static async parseVoiceVendorBill(voiceText: string): Promise<ParsedBillReceiptResult> {
    return this.parseReceiptText(voiceText);
  }

  private static async extractAndMatchVendor(lines: string[], fullText: string): Promise<{
    id: number | null;
    name: string;
    matchedName: string | null;
    confidence: number;
  } | null> {
    // Check keyword anchors: "Vendor:", "Supplier:", "From:", "Billed By:", "M/s"
    let candidateName = '';
    for (const line of lines) {
      const match = line.match(/(?:Vendor|Supplier|From|Billed By|Sold By|M\/s\.?|Seller)\s*[:\-]?\s*([A-Za-z0-9\s&]+?)(?:,|$|\s+(?:GSTIN|Phone|Tel|Invoice|Date|Bill|Address|at|price|with|qty|for)\b)/i);
      if (match && match[1].trim()) {
        candidateName = match[1].trim();
        break;
      }
    }

    // If no anchor, look at the first 3 lines (typical invoice header)
    if (!candidateName && lines.length > 0) {
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const l = lines[i];
        if (!l.match(/^(?:Invoice|Bill|Tax Invoice|Receipt|Date|Purchase Order)/i) && l.length > 3 && l.length < 50) {
          candidateName = l;
          break;
        }
      }
    }

    // Fetch all active vendors from database
    const dbVendors = await pool.query(
      `SELECT id, name FROM contacts WHERE type IN ('vendor', 'both') AND is_archived = false;`
    );

    if (dbVendors.rows.length === 0) {
      return candidateName ? { id: null, name: candidateName, matchedName: null, confidence: 50 } : null;
    }

    // 1. Try exact or substring match in fullText
    for (const v of dbVendors.rows) {
      const vName = v.name.toLowerCase();
      if (fullText.toLowerCase().includes(vName)) {
        return {
          id: v.id,
          name: v.name,
          matchedName: v.name,
          confidence: 95,
        };
      }
    }

    // 2. Try matching candidateName against database vendors using in-memory token similarity
    if (candidateName) {
      let bestVendor: { id: number; name: string } | null = null;
      let bestScore = 0;

      for (const v of dbVendors.rows) {
        const score = computeSimilarity(candidateName, v.name);
        if (score > bestScore) {
          bestScore = score;
          bestVendor = v;
        }
      }

      if (bestVendor && bestScore > 0.3) {
        return {
          id: bestVendor.id,
          name: candidateName,
          matchedName: bestVendor.name,
          confidence: Math.round(bestScore * 100),
        };
      }

      return {
        id: null,
        name: candidateName,
        matchedName: null,
        confidence: 40,
      };
    }

    return null;
  }

  private static extractBillReference(text: string): string | null {
    // 1. Check line-by-line for explicit reference labels with colon/hyphen: "Bill No: TH-2026-884", "Invoice #: ROF-9021"
    const lines = text.split(/\r?\n/).map(l => l.trim());
    for (const line of lines) {
      const lineMatch = line.match(/(?:Invoice|Bill|Inv|Ref|Reference|Doc)\s*(?:No|Num|Number|#)?\s*[:\-]\s*([A-Za-z0-9\-\/]{3,24})/i);
      if (lineMatch && lineMatch[1]) {
        const val = lineMatch[1].trim();
        if (!val.match(/^(?:Date|Total|Amount|Gst|Due|Vendor|Supplier)$/i)) {
          return val;
        }
      }
    }

    // 2. Check for labeled ref without colon on single line: "Bill No TH-2026-884", "bill ref TH-881"
    for (const line of lines) {
      const lineMatch = line.match(/(?:Invoice|Bill|Inv|Ref|Reference)\s+(?:No|Num|Number|#|ref)?\s*([A-Za-z0-9\-\/]{3,24})/i);
      if (lineMatch && lineMatch[1]) {
        const val = lineMatch[1].trim();
        if (!val.match(/^(?:Date|Total|Amount|Gst|Due|Vendor|Supplier|From|For)$/i)) {
          return val;
        }
      }
    }

    // 3. Fallback: search for standalone invoice-like patterns (e.g. INV-2026-004, TH-2026-884, VB-1002)
    const standaloneMatch = text.match(/\b([A-Z]{2,4}-(?:20\d{2}-)?\d{3,8}(?:-\d{2,4})?)\b/);
    if (standaloneMatch) {
      return standaloneMatch[1];
    }

    return null;
  }

  private static extractDates(text: string): { billDate: string; dueDate: string } {
    const today = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Standardize ISO format YYYY-MM-DD
    const isoMatch = text.match(/(?:Bill\s*Date|Invoice\s*Date|Date)?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i);
    if (isoMatch && isoMatch[1]) {
      const billDate = isoMatch[1];
      const dueDateMatch = text.match(/Due\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i);
      const dueDate = dueDateMatch && dueDateMatch[1] ? dueDateMatch[1] : defaultDueDate;
      return { billDate, dueDate };
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = text.match(/(?:Date)?\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      const billDate = `${year}-${month}-${day}`;
      return { billDate, dueDate: defaultDueDate };
    }

    return { billDate: today, dueDate: defaultDueDate };
  }

  private static async extractAndMatchLineItems(lines: string[]): Promise<ParsedBillLine[]> {
    const parsedLines: ParsedBillLine[] = [];

    // Pre-fetch active products
    const dbProducts = await pool.query(
      `SELECT id, sku, name, cost_price::TEXT as cost_price, tax_rate::TEXT as tax_rate FROM products WHERE is_archived = false;`
    );

    for (const line of lines) {
      // Ignore header/footer summary lines
      if (line.match(/^(?:Subtotal|Total|Grand Total|Tax|GST|CGST|SGST|IGST|Amount Due|Balance|Payment|Invoice|Date|Vendor|Supplier|Bill\s*from)/i)) {
        continue;
      }

      let detectedQty = 1;
      let detectedPrice = '0.00';
      let detectedDescription = '';

      // Pattern A: "5 x Teak Desk @ 4500" or "5 Teak Desk at 5000 each"
      const patA = line.match(/^(\d+)\s*(?:x|\*|-)?\s+([A-Za-z\s—\-]+?)(?:\s+@|\s+at|\s+price|\s+cost|\s+₹|\s+Rs\.?)?\s+([\d,]+(?:\.\d{2})?)(?:\s+each|\s+per|\s+nos)?(?:\s+[\d,]+(?:\.\d{2})?)?$/i);
      if (patA) {
        detectedQty = parseInt(patA[1], 10) || 1;
        detectedDescription = patA[2].trim();
        detectedPrice = patA[3].replace(/,/g, '');
      } else {
        // Pattern B: "Teak Desk qty 5 price 4500" or "Teak Desk, 5, 4500"
        const patB = line.match(/^([A-Za-z\s—\-]+?)(?:,\s*|\s+qty:?\s*|\s+x\s*)(\d+)(?:,\s*|\s+price:?\s*|\s+@\s*|\s+at\s*)([\d,]+(?:\.\d{2})?)/i);
        if (patB) {
          detectedDescription = patB[1].trim();
          detectedQty = parseInt(patB[2], 10) || 1;
          detectedPrice = patB[3].replace(/,/g, '');
        }
      }

      // If we didn't match via pattern, check if line contains product name substring
      if (!detectedDescription) {
        for (const prod of dbProducts.rows) {
          if (line.toLowerCase().includes(prod.name.toLowerCase())) {
            detectedDescription = prod.name;
            // Look for qty and price in the remainder of the line
            const numMatches = line.match(/\b\d+(?:\.\d{2})?\b/g);
            if (numMatches && numMatches.length >= 1) {
              for (const n of numMatches) {
                const num = parseFloat(n);
                if (Number.isInteger(num) && num > 0 && num <= 100 && detectedQty === 1) {
                  detectedQty = num;
                } else if (num > 100) {
                  detectedPrice = num.toFixed(2);
                }
              }
            }
            break;
          }
        }
      }

      if (!detectedDescription || detectedDescription.length < 3) {
        continue;
      }

      // Match with database products
      let matchedProd = dbProducts.rows.find(
        p => p.name.toLowerCase() === detectedDescription.toLowerCase() ||
             p.name.toLowerCase().includes(detectedDescription.toLowerCase()) ||
             detectedDescription.toLowerCase().includes(p.name.toLowerCase())
      );

      let confidence = 90;
      if (!matchedProd) {
        let bestProd: any = null;
        let bestScore = 0;
        for (const p of dbProducts.rows) {
          const score = computeSimilarity(detectedDescription, p.name);
          if (score > bestScore) {
            bestScore = score;
            bestProd = p;
          }
        }
        if (bestProd && bestScore > 0.25) {
          matchedProd = bestProd;
          confidence = Math.round(bestScore * 100);
        }
      }

      if (matchedProd) {
        const unitPriceStr = new Decimal(detectedPrice).greaterThan(0) ? detectedPrice : (matchedProd.cost_price || '0.00');
        const taxRateStr = matchedProd.tax_rate || '18.00';
        const subtotal = new Decimal(detectedQty).times(new Decimal(unitPriceStr)).toFixed(2);
        const taxAmount = new Decimal(subtotal).times(new Decimal(taxRateStr)).dividedBy(100).toFixed(2);
        const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);

        parsedLines.push({
          productId: matchedProd.id,
          productName: matchedProd.name,
          sku: matchedProd.sku,
          qty: detectedQty,
          unitPrice: unitPriceStr,
          taxRate: taxRateStr,
          subtotal,
          taxAmount,
          total,
          confidence,
          isMatched: true,
        });
      }
    }

    // Default fallback: if no lines were recognized, try matching at least 1 product
    if (parsedLines.length === 0 && dbProducts.rows.length > 0) {
      for (const prod of dbProducts.rows) {
        if (lines.some(l => l.toLowerCase().includes(prod.name.toLowerCase()))) {
          const subtotal = prod.cost_price || '0.00';
          const taxRate = prod.tax_rate || '18.00';
          const taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
          const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);
          parsedLines.push({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            qty: 1,
            unitPrice: prod.cost_price,
            taxRate,
            subtotal,
            taxAmount,
            total,
            confidence: 75,
            isMatched: true,
          });
          break;
        }
      }
    }

    return parsedLines;
  }

  private static extractExplicitTotal(text: string): string | null {
    const totalMatch = text.match(/(?:Grand\s*Total|Total\s*Amount|Total|Amount\s*Due)\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch && totalMatch[1]) {
      return totalMatch[1].replace(/,/g, '');
    }
    return null;
  }

  private static calculateConfidence(
    vendor: { confidence: number } | null,
    billRef: string | null,
    lines: ParsedBillLine[]
  ): number {
    let score = 0;
    if (vendor && vendor.confidence > 50) score += 40;
    else if (vendor) score += 20;

    if (billRef) score += 20;

    if (lines.length > 0) {
      score += 40;
    }

    return Math.min(100, score);
  }
}
