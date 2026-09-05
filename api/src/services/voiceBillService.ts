import { pool } from '../db/pool';
import { VoiceBillParser, ParsedSlots, SupportedLanguage } from './voiceBillParser';
import { InvoiceService } from './invoiceService';
import Decimal from 'decimal.js';

export interface DraftLineItem {
  id: string;
  productId?: number;
  productName: string;
  matchedName?: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: string;
  isPriceAssumed?: boolean;
  isQtyAssumed?: boolean;
}

export interface VoiceBillSession {
  sessionId: string;
  customerName?: string;
  phone?: string;
  customerId?: number;
  lineItems: DraftLineItem[];
  language: SupportedLanguage;
  status: 'collecting' | 'ready_for_confirm' | 'confirmed';
  notes: string[];
  lastUpdateNote?: string;
  ambiguousCandidates?: { id: number; name: string; salesPrice: string }[];
  invoiceId?: number;
  invoiceNumber?: string;
  pdfUrl?: string;
  grandTotal: string;
  updatedAt: Date;
  isNameInferred?: boolean;
  isPriceAssumed?: boolean;
  isQtyAssumed?: boolean;
  confidenceNotes?: { en: string[]; hi: string[] };
}

export interface ChatMessageResponse {
  reply: string;
  language: SupportedLanguage;
  session: VoiceBillSession;
  readyForConfirm: boolean;
  isConfirmed: boolean;
  options?: string[];
}

// Common Hindi to English furniture transliteration / keywords dictionary
const HINDI_PRODUCT_KEYWORD_MAP: Record<string, string> = {
  'टीक डेस्क': 'Teak Desk',
  'टीक': 'Teak',
  'डेस्क': 'Desk',
  'ओक वुड': 'Oak Wood Planks',
  'ओक': 'Oak',
  'लकड़ी': 'Wood',
  'तख्ता': 'Planks',
  'कुर्सी': 'Chair',
  'टेबल': 'Desk',
  'मेज़': 'Desk',
  'सोफा': 'Sofa',
  'अलमारी': 'Cabinet',
};

export class VoiceBillService {
  // In-memory sessions store (cleaned up after 2 hours)
  private static sessions: Map<string, VoiceBillSession> = new Map();

  static getOrCreateSession(sessionId?: string): VoiceBillSession {
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        sessionId: id,
        lineItems: [],
        language: 'en',
        status: 'collecting',
        notes: [],
        grandTotal: '0.00',
        updatedAt: new Date(),
      });
    }
    return this.sessions.get(id)!;
  }

  static getSession(sessionId: string): VoiceBillSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Fuzzy-match product phrase against database Product Master using pg_trgm similarity & ILIKE
   */
  static async matchProduct(productPhrase: string): Promise<{
    matchedProduct: { id: number; name: string; salesPrice: string; taxRate: string } | null;
    score: number;
    candidates: { id: number; name: string; salesPrice: string }[];
  }> {
    if (!productPhrase || !productPhrase.trim()) {
      return { matchedProduct: null, score: 0, candidates: [] };
    }

    let searchPhrase = productPhrase.trim();

    // Check Hindi product keyword mappings
    for (const [hiKey, enVal] of Object.entries(HINDI_PRODUCT_KEYWORD_MAP)) {
      if (searchPhrase.includes(hiKey)) {
        searchPhrase = enVal;
        break;
      }
    }

    try {
      const res = await pool.query(
        `SELECT id, name, sales_price::TEXT as sales_price, tax_rate::TEXT as tax_rate,
          GREATEST(
            similarity(name, $1),
            CASE WHEN name ILIKE '%' || $1 || '%' THEN 0.85 ELSE 0 END,
            CASE WHEN $1 ILIKE '%' || name || '%' THEN 0.85 ELSE 0 END
          ) as score
         FROM products
         WHERE is_archived = false
         ORDER BY score DESC
         LIMIT 3;`,
        [searchPhrase]
      );

      const rows = res.rows;
      if (rows.length === 0) {
        return { matchedProduct: null, score: 0, candidates: [] };
      }

      const top = rows[0];
      const topScore = parseFloat(top.score || '0');
      const candidates = rows.map(r => ({
        id: r.id,
        name: r.name,
        salesPrice: r.sales_price,
      }));

      // If top score > 0.4, auto-select
      if (topScore >= 0.4) {
        return {
          matchedProduct: {
            id: top.id,
            name: top.name,
            salesPrice: top.sales_price,
            taxRate: top.tax_rate,
          },
          score: topScore,
          candidates,
        };
      }

      return {
        matchedProduct: null,
        score: topScore,
        candidates,
      };
    } catch (err) {
      console.error('Error in matchProduct query:', err);
      // Fallback simple ILIKE query
      const fallback = await pool.query(
        `SELECT id, name, sales_price::TEXT as sales_price, tax_rate::TEXT as tax_rate
         FROM products
         WHERE is_archived = false AND name ILIKE $1
         LIMIT 1;`,
        [`%${searchPhrase}%`]
      );
      if (fallback.rows.length > 0) {
        const top = fallback.rows[0];
        return {
          matchedProduct: {
            id: top.id,
            name: top.name,
            salesPrice: top.sales_price,
            taxRate: top.tax_rate,
          },
          score: 0.85,
          candidates: [{ id: top.id, name: top.name, salesPrice: top.sales_price }],
        };
      }
      return { matchedProduct: null, score: 0, candidates: [] };
    }
  }

  /**
   * Recalculates line item and grand totals with decimal.js accuracy
   */
  private static recalculateTotals(session: VoiceBillSession): void {
    let grand = new Decimal('0.00');

    for (const item of session.lineItems) {
      const qtyDec = new Decimal(item.qty || 1);
      const priceDec = new Decimal(item.unitPrice || 0);
      let lineSubtotal = qtyDec.times(priceDec);

      if (item.discountPercent && item.discountPercent > 0) {
        const discountFactor = new Decimal(1).minus(new Decimal(item.discountPercent).dividedBy(100));
        lineSubtotal = lineSubtotal.times(discountFactor);
      }

      // Add tax if configured
      const taxRateDec = new Decimal(item.taxRate || 0);
      const taxAmt = lineSubtotal.times(taxRateDec.dividedBy(100));
      const lineTotal = lineSubtotal.plus(taxAmt);

      item.lineTotal = lineTotal.toFixed(2);
      grand = grand.plus(lineTotal);
    }

    session.grandTotal = grand.toFixed(2);
  }

  /**
   * Process a conversational incoming message (text or voice-transcribed)
   */
  static async processMessage(text: string, sessionId?: string): Promise<ChatMessageResponse> {
    const session = this.getOrCreateSession(sessionId);
    session.updatedAt = new Date();
    session.lastUpdateNote = undefined;

    // Detect language of incoming message
    const lang = VoiceBillParser.detectLanguage(text);
    session.language = lang;

    // Check for clear / reset command
    const lowerText = text.trim().toLowerCase();
    if (
      lowerText === 'clear' ||
      lowerText === 'reset' ||
      lowerText === 'start over' ||
      lowerText === 'restart' ||
      lowerText === 'नया बिल' ||
      lowerText === 'रीसेट'
    ) {
      session.lineItems = [];
      session.customerName = undefined;
      session.phone = undefined;
      session.customerId = undefined;
      session.status = 'collecting';
      session.grandTotal = '0.00';
      session.ambiguousCandidates = undefined;

      const reply =
        lang === 'hi'
          ? 'बिल रीसेट कर दिया गया है। नया बिल बनाने के लिए ग्राहक का नाम, फ़ोन या उत्पाद बताएं।'
          : 'Bill reset! To create a new bill, please tell me the customer name, phone, or product to add.';

      return {
        reply,
        language: lang,
        session,
        readyForConfirm: false,
        isConfirmed: false,
      };
    }

    // 1. Fetch catalog product names for elimination pass and run Parser
    let knownProductNames: string[] = [];
    try {
      const prodRes = await pool.query(`SELECT name FROM products WHERE is_archived = false;`);
      knownProductNames = prodRes.rows.map((r: any) => r.name);
    } catch (err) {
      console.warn('Failed to query products for parser:', err);
    }

    const parsed: ParsedSlots = VoiceBillParser.parse(text, knownProductNames);

    // 2. Handle slot updates (e.g. "change quantity to 4")
    if (parsed.isUpdate && parsed.updateField) {
      if (parsed.updateField === 'quantity' && parsed.quantity) {
        if (session.lineItems.length > 0) {
          session.lineItems[session.lineItems.length - 1].qty = parsed.quantity;
          session.lineItems[session.lineItems.length - 1].isQtyAssumed = false;
          session.isQtyAssumed = false;
          session.lastUpdateNote = lang === 'hi' ? parsed.updateNote?.hi : parsed.updateNote?.en;
        }
      } else if (parsed.updateField === 'unitPrice' && parsed.unitPrice) {
        if (session.lineItems.length > 0) {
          session.lineItems[session.lineItems.length - 1].unitPrice = parsed.unitPrice;
          session.lineItems[session.lineItems.length - 1].isPriceAssumed = false;
          session.isPriceAssumed = false;
          session.lastUpdateNote = lang === 'hi' ? parsed.updateNote?.hi : parsed.updateNote?.en;
        }
      } else if (parsed.updateField === 'customerName' && parsed.customerName) {
        session.customerName = parsed.customerName;
        session.isNameInferred = false;
        session.lastUpdateNote = lang === 'hi' ? parsed.updateNote?.hi : parsed.updateNote?.en;
      }
      this.recalculateTotals(session);
    }

    // 3. Merge Customer Name
    if (parsed.customerName) {
      session.customerName = parsed.customerName;
      session.isNameInferred = Boolean(parsed.isNameInferred);
    }

    // 4. Merge Phone Number
    if (parsed.phone) {
      session.phone = parsed.phone;
    }

    // Propagate confidence notes
    if (parsed.confidenceNotes) {
      session.confidenceNotes = parsed.confidenceNotes;
    }
    if (parsed.isQtyAssumed) {
      session.isQtyAssumed = true;
    }
    if (parsed.isPriceAssumed) {
      session.isPriceAssumed = true;
    }

    // 5. Handle Product Selection from candidates or parser
    if (parsed.productName) {
      const matchRes = await this.matchProduct(parsed.productName);

      if (matchRes.matchedProduct) {
        // High confidence match: add or update line item
        session.ambiguousCandidates = undefined;

        // Check if existing line item can be populated or if new line
        let currentItem = session.lineItems[session.lineItems.length - 1];
        if (!currentItem || currentItem.productId) {
          // create new line item
          currentItem = {
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            productName: parsed.productName,
            matchedName: matchRes.matchedProduct.name,
            productId: matchRes.matchedProduct.id,
            qty: parsed.quantity || 0,
            unitPrice: parsed.unitPrice || parseFloat(matchRes.matchedProduct.salesPrice) || 0,
            discountPercent: parsed.discountPercent || 0,
            taxRate: parseFloat(matchRes.matchedProduct.taxRate) || 0,
            lineTotal: '0.00',
            isQtyAssumed: parsed.isQtyAssumed,
            isPriceAssumed: parsed.isPriceAssumed,
          };
          session.lineItems.push(currentItem);
        } else {
          // populate existing line item
          currentItem.productName = parsed.productName;
          currentItem.matchedName = matchRes.matchedProduct.name;
          currentItem.productId = matchRes.matchedProduct.id;
          if (parsed.quantity) {
            currentItem.qty = parsed.quantity;
            currentItem.isQtyAssumed = parsed.isQtyAssumed;
          }
          if (parsed.unitPrice) {
            currentItem.unitPrice = parsed.unitPrice;
            currentItem.isPriceAssumed = parsed.isPriceAssumed;
          } else if (!currentItem.unitPrice || currentItem.unitPrice === 0) {
            currentItem.unitPrice = parseFloat(matchRes.matchedProduct.salesPrice) || 0;
          }
          if (parsed.discountPercent !== undefined) currentItem.discountPercent = parsed.discountPercent;
          currentItem.taxRate = parseFloat(matchRes.matchedProduct.taxRate) || 0;
        }
      } else if (matchRes.candidates.length > 0) {
        // Ambiguous match: ask user to clarify from candidates
        session.ambiguousCandidates = matchRes.candidates;
        const candidateNames = matchRes.candidates.map(c => c.name).join(', ');
        const reply =
          lang === 'hi'
            ? `आप कौन सा उत्पाद जोड़ना चाहते हैं — [${candidateNames}]?`
            : `Which product did you mean — [${candidateNames}]?`;

        return {
          reply,
          language: lang,
          session,
          readyForConfirm: false,
          isConfirmed: false,
          options: matchRes.candidates.map(c => c.name),
        };
      } else {
        // No match found in catalog: add as placeholder and prompt
        let currentItem = session.lineItems[session.lineItems.length - 1];
        if (!currentItem || currentItem.productId) {
          currentItem = {
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            productName: parsed.productName,
            qty: parsed.quantity || 0,
            unitPrice: parsed.unitPrice || 0,
            discountPercent: parsed.discountPercent || 0,
            taxRate: 0,
            lineTotal: '0.00',
            isQtyAssumed: parsed.isQtyAssumed,
            isPriceAssumed: parsed.isPriceAssumed,
          };
          session.lineItems.push(currentItem);
        }
      }
    } else {
      // If no product in this message, update existing line item's qty or price if provided
      if (session.lineItems.length > 0) {
        const lastItem = session.lineItems[session.lineItems.length - 1];
        if (parsed.quantity && !parsed.isUpdate) {
          lastItem.qty = parsed.quantity;
          lastItem.isQtyAssumed = parsed.isQtyAssumed;
        }
        if (parsed.unitPrice && !parsed.isUpdate) {
          lastItem.unitPrice = parsed.unitPrice;
          lastItem.isPriceAssumed = parsed.isPriceAssumed;
        }
        if (parsed.discountPercent !== undefined) lastItem.discountPercent = parsed.discountPercent;
      }
    }

    this.recalculateTotals(session);

    // 6. Check for Missing Slots and generate targeted single follow-up question
    const line = session.lineItems[session.lineItems.length - 1];

    if (!line || (!line.productId && !line.productName)) {
      const reply =
        lang === 'hi'
          ? 'कृपया वह उत्पाद बताएं जिसे आप बिल में जोड़ना चाहते हैं।'
          : 'Which product would you like to add to the bill?';
      session.status = 'collecting';
      return { reply, language: lang, session, readyForConfirm: false, isConfirmed: false };
    }

    if (!line.qty || line.qty <= 0) {
      const reply =
        lang === 'hi'
          ? `कृपया ${line.matchedName || line.productName} की मात्रा बताएं।`
          : `Please specify the quantity for ${line.matchedName || line.productName}.`;
      session.status = 'collecting';
      return { reply, language: lang, session, readyForConfirm: false, isConfirmed: false };
    }

    if (!line.unitPrice || line.unitPrice <= 0) {
      const reply =
        lang === 'hi'
          ? `कृपया ${line.matchedName || line.productName} की प्रति यूनिट कीमत (रुपये) बताएं।`
          : `Please specify the unit price for ${line.matchedName || line.productName}.`;
      session.status = 'collecting';
      return { reply, language: lang, session, readyForConfirm: false, isConfirmed: false };
    }

    if (!session.customerName) {
      const reply =
        lang === 'hi'
          ? 'कृपया ग्राहक का नाम बताएं।'
          : 'Please provide the customer name.';
      session.status = 'collecting';
      return { reply, language: lang, session, readyForConfirm: false, isConfirmed: false };
    }

    if (!session.phone) {
      const reply =
        lang === 'hi'
          ? 'कृपया ग्राहक का 10-अंकीय फ़ोन नंबर बताएं।'
          : 'Please provide the customer phone number.';
      session.status = 'collecting';
      return { reply, language: lang, session, readyForConfirm: false, isConfirmed: false };
    }

    // 7. Everything filled -> Transition to ready_for_confirm
    session.status = 'ready_for_confirm';

    let confirmMsg =
      lang === 'hi'
        ? `सभी विवरण प्राप्त हो गए हैं! कुल राशि ₹${session.grandTotal} है। कृपया नीचे दिए गए सारांश की समीक्षा करें और पुष्टि करें, या कोई बदलाव बताएं।`
        : `All details collected! Total amount is ₹${session.grandTotal}. Please review the summary below and confirm, or tell me any changes.`;

    if (session.lastUpdateNote) {
      confirmMsg = `${session.lastUpdateNote}. ${confirmMsg}`;
    }

    if (session.confidenceNotes && session.confidenceNotes[lang] && session.confidenceNotes[lang].length > 0) {
      const notes = session.confidenceNotes[lang].join('; ');
      confirmMsg = `[${notes}]\n\n${confirmMsg}`;
    }

    return {
      reply: confirmMsg,
      language: lang,
      session,
      readyForConfirm: true,
      isConfirmed: false,
    };
  }

  /**
   * Finalize and confirm the bill into an official Customer Invoice
   */
  static async confirmBill(sessionId: string): Promise<{
    invoiceId: number;
    invoiceNumber: string;
    pdfUrl: string;
    customerName: string;
    total: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.lineItems.length === 0) {
      throw new Error('Cannot confirm bill with empty line items');
    }
    if (!session.customerName) {
      throw new Error('Customer name is required before generating bill');
    }

    // 1. Find or create contact in contacts table
    let customerId: number;
    if (session.phone) {
      const contactByPhone = await pool.query(
        `SELECT id FROM contacts WHERE mobile = $1 AND is_archived = false LIMIT 1`,
        [session.phone]
      );
      if (contactByPhone.rows.length > 0) {
        customerId = contactByPhone.rows[0].id;
      } else {
        // Create new contact
        const newContact = await pool.query(
          `INSERT INTO contacts (name, mobile, type)
           VALUES ($1, $2, 'customer')
           RETURNING id;`,
          [session.customerName, session.phone]
        );
        customerId = newContact.rows[0].id;
      }
    } else {
      const contactByName = await pool.query(
        `SELECT id FROM contacts WHERE name ILIKE $1 AND is_archived = false LIMIT 1`,
        [session.customerName]
      );
      if (contactByName.rows.length > 0) {
        customerId = contactByName.rows[0].id;
      } else {
        const newContact = await pool.query(
          `INSERT INTO contacts (name, type)
           VALUES ($1, 'customer')
           RETURNING id;`,
          [session.customerName]
        );
        customerId = newContact.rows[0].id;
      }
    }

    // 2. Prepare invoice line items
    const lines = session.lineItems.map(item => {
      // Compute discounted unit price if discount was specified
      let effPrice = new Decimal(item.unitPrice);
      if (item.discountPercent && item.discountPercent > 0) {
        const factor = new Decimal(1).minus(new Decimal(item.discountPercent).dividedBy(100));
        effPrice = effPrice.times(factor);
      }

      return {
        productId: item.productId || 1, // fallback to product 1 if unmatched
        qty: String(item.qty),
        unitPrice: effPrice.toFixed(2),
        taxRate: String(item.taxRate || '0.00'),
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 3. Create invoice via InvoiceService
    const invoice = await InvoiceService.createInvoice({
      customerId,
      invoiceDate: todayStr,
      dueDate: dueDateStr,
      lines,
    });

    // 4. Confirm invoice via InvoiceService (triggers ledger posting & stock movement in transaction)
    await InvoiceService.confirmInvoice(invoice.id);

    // 5. Update session state
    session.status = 'confirmed';
    session.invoiceId = invoice.id;
    session.invoiceNumber = invoice.number;
    session.pdfUrl = `/api/invoices/${invoice.id}/pdf`;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      pdfUrl: `/api/invoices/${invoice.id}/pdf`,
      customerName: session.customerName,
      total: invoice.total,
    };
  }
}
