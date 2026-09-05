import puppeteer from 'puppeteer';
import fs from 'fs';
import crypto from 'crypto';
import { CustomerInvoiceDTO } from './invoiceService';

function numberToIndianWords(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 === 0 ? '' : ' ' + inWords(n % 100000));
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 === 0 ? '' : ' ' + inWords(n % 10000000));
  }

  return 'Indian Rupees ' + inWords(rounded) + ' Only';
}

export class PdfService {
  static generateInvoiceHtml(invoice: CustomerInvoiceDTO): string {
    const subtotalNum = parseFloat(invoice.subtotal) || 0;
    const taxTotalNum = parseFloat(invoice.taxTotal) || 0;
    const grandTotalNum = parseFloat(invoice.total) || 0;
    const amountPaidNum = parseFloat(invoice.amountPaid) || 0;
    const amountDueNum = parseFloat(invoice.amountDue) || (grandTotalNum - amountPaidNum);
    const cgstHalf = (taxTotalNum / 2);
    const sgstHalf = (taxTotalNum / 2);

    const linesHtml = invoice.lines
      .map((line, index) => {
        const lineSubtotal = parseFloat(line.subtotal) || 0;
        const lineTax = parseFloat(line.taxAmount) || 0;
        const lineTotal = parseFloat(line.total) || (lineSubtotal + lineTax);

        return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #F0ECE6; text-align: center; color: #8C827A; font-family: monospace; font-size: 11px;">${index + 1}</td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #F0ECE6;">
            <div style="font-weight: 600; color: #26211C; font-size: 12px;">${line.productName}</div>
            <div style="font-size: 10px; color: #8C827A; font-family: monospace; margin-top: 1px;">SKU: ${line.productSku || 'UF-FURN-01'}</div>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #F0ECE6; text-align: center; font-family: monospace; font-size: 11px; color: #574F45;">9403</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #F0ECE6; text-align: center; font-family: monospace; font-size: 11px; color: #26211C; font-weight: 500;">${line.qty} NOS</td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #F0ECE6; text-align: right; font-family: monospace; font-size: 11px; color: #574F45;">₹${parseFloat(line.unitPrice).toFixed(2)}</td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #F0ECE6; text-align: right; font-family: monospace; font-size: 11px; color: #26211C;">₹${lineSubtotal.toFixed(2)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F0ECE6; text-align: right; font-family: monospace; font-size: 12px; font-weight: 700; color: #26211C;">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${invoice.number}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1c1917;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11.5px;
            line-height: 1.45;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1c1917;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .brand-col {
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }
          .logo-mark {
            width: 42px;
            height: 42px;
            background: #18181b;
            color: #fef3c7;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 15px;
            letter-spacing: -0.5px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #18181b;
          }
          .brand-subtitle {
            font-size: 10.5px;
            color: #71717a;
            font-weight: 500;
            margin-top: 1px;
          }
          .brand-legal {
            font-size: 9.5px;
            color: #52525b;
            font-family: monospace;
            margin-top: 5px;
            line-height: 1.4;
          }
          .invoice-col {
            text-align: right;
          }
          .invoice-tag {
            display: inline-block;
            background: #18181b;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            font-family: monospace;
          }
          .invoice-number {
            font-size: 18px;
            font-weight: 800;
            font-family: monospace;
            color: #18181b;
            margin-top: 6px;
          }
          .invoice-date {
            font-size: 10.5px;
            color: #71717a;
            font-family: monospace;
            margin-top: 2px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 22px;
          }
          .meta-card {
            background: #fafaf9;
            border: 1px solid #e7e5e4;
            border-radius: 10px;
            padding: 14px 16px;
          }
          .meta-label {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #71717a;
            margin-bottom: 6px;
          }
          .customer-name {
            font-size: 14px;
            font-weight: 700;
            color: #18181b;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin-top: 4px;
            color: #52525b;
          }

          table.items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
            border: 1px solid #e7e5e4;
            border-radius: 10px;
            overflow: hidden;
          }
          table.items-table th {
            background: #f4f4f5;
            border-bottom: 1px solid #e4e4e7;
            padding: 10px 12px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #52525b;
          }
          table.items-table td {
            padding: 11px 12px;
            border-bottom: 1px solid #f4f4f5;
          }
          table.items-table tr:last-child td {
            border-bottom: none;
          }

          .summary-split {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 16px;
            margin-bottom: 22px;
          }
          .remit-card {
            background: #fafaf9;
            border: 1px solid #e7e5e4;
            border-radius: 10px;
            padding: 14px 16px;
          }
          .totals-card {
            background: #18181b;
            color: #ffffff;
            border-radius: 10px;
            padding: 16px 18px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 3px 0;
            color: #a1a1aa;
          }
          .total-line strong {
            color: #ffffff;
          }
          .total-highlight {
            border-top: 1px solid #3f3f46;
            margin-top: 8px;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-highlight-label {
            font-size: 12px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .total-highlight-val {
            font-size: 18px;
            font-weight: 800;
            color: #34d399;
            font-family: monospace;
          }

          .footer-section {
            border-top: 1px solid #e7e5e4;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header-row">
          <div class="brand-col">
            <div class="logo-mark">UF</div>
            <div>
              <div class="brand-title">Urban Furniture</div>
              <div class="brand-subtitle">Contract &amp; Commercial High-End Furnishings</div>
              <div class="brand-legal">
                GSTIN: <strong>24AABCU9603R1ZM</strong> • State: Gujarat (Code: 24)<br>
                Plot 42, Sector 25, GIDC Electronics Zone, Gandhinagar - 382024
              </div>
            </div>
          </div>

          <div class="invoice-col">
            <span class="invoice-tag">TAX INVOICE</span>
            <div class="invoice-number">${invoice.number}</div>
            <div class="invoice-date">Date: ${invoice.invoiceDate}</div>
            <div class="invoice-date">Due: ${invoice.dueDate || 'Immediate on Delivery'}</div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Billed To</div>
            <div class="customer-name">${invoice.customerName || 'Walk-in Customer'}</div>
            <div class="meta-row">
              <span>Customer Ref:</span>
              <span style="font-family: monospace;">#${invoice.customerId}</span>
            </div>
            <div class="meta-row">
              <span>Delivery Point:</span>
              <span>Gandhinagar / Ahmedabad Hub</span>
            </div>
            <div class="meta-row">
              <span>Place of Supply:</span>
              <strong>Gujarat (24) • B2C Supply</strong>
            </div>
          </div>

          <div class="meta-card">
            <div class="meta-label">Invoice Particulars</div>
            <div class="meta-row">
              <span>Supply Regime:</span>
              <span>Intra-State GST (CGST 9% + SGST 9%)</span>
            </div>
            <div class="meta-row">
              <span>HSN Tariff:</span>
              <span style="font-family: monospace;">9403 (Furniture &amp; Fixtures)</span>
            </div>
            <div class="meta-row">
              <span>Reverse Charge (RCM):</span>
              <strong style="color: #059669;">Not Applicable</strong>
            </div>
            ${invoice.soNumber ? `
            <div class="meta-row">
              <span>Sales Order:</span>
              <span style="font-family: monospace; font-weight: 600;">${invoice.soNumber}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="text-align: left;">Item &amp; Description</th>
              <th style="width: 60px; text-align: center;">HSN</th>
              <th style="width: 65px; text-align: center;">Qty</th>
              <th style="width: 95px; text-align: right;">Unit Price</th>
              <th style="width: 100px; text-align: right;">Taxable</th>
              <th style="width: 110px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <!-- Summary & Remittance -->
        <div class="summary-split">
          <div class="remit-card">
            <div class="meta-label">Remittance &amp; Payment Details</div>
            <div style="font-family: monospace; font-size: 10.5px; color: #44403c; line-height: 1.5;">
              Bank: <strong>State Bank of India</strong> (Corporate Current)<br>
              A/C Number: <strong>389201004521</strong><br>
              IFSC Code: <strong>SBIN0001234</strong> • Gandhinagar Commercial<br>
              UPI VPA: <strong>urbanfurniture@sbi</strong>
            </div>
            <div style="font-size: 9.5px; color: #71717a; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e7e5e4;">
              ✓ Covered under 1-Year Urban Furniture Warranty.<br>
              Official GST Tax Invoice issued under Rule 46 of CGST Rules, 2017.
            </div>
          </div>

          <div class="totals-card">
            <div class="total-line">
              <span>Subtotal:</span>
              <strong style="font-family: monospace;">₹${subtotalNum.toFixed(2)}</strong>
            </div>
            <div class="total-line">
              <span>CGST (9%):</span>
              <strong style="font-family: monospace;">₹${cgstHalf.toFixed(2)}</strong>
            </div>
            <div class="total-line">
              <span>SGST (9%):</span>
              <strong style="font-family: monospace;">₹${sgstHalf.toFixed(2)}</strong>
            </div>
            <div class="total-highlight">
              <span class="total-highlight-label">Amount Payable:</span>
              <span class="total-highlight-val">₹${grandTotalNum.toFixed(2)}</span>
            </div>
            <div style="font-size: 9.5px; color: #a1a1aa; font-style: italic; text-align: right; margin-top: 6px;">
              ${numberToIndianWords(grandTotalNum)}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-section">
          <div style="font-size: 10px; color: #059669; font-family: monospace; font-weight: 600;">
            ✓ Digitally Verified Showroom Invoice • Urban Furniture System
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; font-weight: 800; color: #18181b; text-transform: uppercase;">
              For Urban Furniture Pvt. Ltd.
            </div>
            <div style="font-size: 9px; color: #71717a; margin-top: 2px;">
              Authorised Showroom Signatory
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generic HTML -> PDF renderer using the same server-side Puppeteer pipeline
   * that backs invoice export. Callers own the HTML (including <style>).
   */
  static async renderHtmlToPdf(html: string): Promise<Buffer> {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  static async generateInvoicePdf(invoice: CustomerInvoiceDTO): Promise<Buffer> {
    const html = this.generateInvoiceHtml(invoice);
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });


    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
