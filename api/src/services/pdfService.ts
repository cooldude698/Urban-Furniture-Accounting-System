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
            margin: 12mm 14mm 12mm 14mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #26211C;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            font-size: 11.5px;
            line-height: 1.4;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #E5DFD7;
            padding-bottom: 16px;
            margin-bottom: 18px;
          }
          .brand-col {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .logo-mark {
            width: 36px;
            height: 36px;
            background: #4A3A34;
            color: #F9F2E4;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            letter-spacing: -0.5px;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: #26211C;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-size: 10px;
            color: #8C827A;
            margin-top: 1px;
          }
          .brand-legal {
            font-size: 9.5px;
            color: #574F45;
            font-family: monospace;
            margin-top: 4px;
            line-height: 1.35;
          }
          .invoice-col {
            text-align: right;
          }
          .invoice-tag {
            display: inline-block;
            background: #4A3A34;
            color: #FFFFFF;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-family: monospace;
          }
          .invoice-number {
            font-size: 17px;
            font-weight: 800;
            font-family: monospace;
            color: #26211C;
            margin-top: 5px;
          }
          .invoice-date {
            font-size: 10.5px;
            color: #8C827A;
            font-family: monospace;
            margin-top: 2px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .meta-card {
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .meta-label {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #8C827A;
            margin-bottom: 4px;
          }
          .customer-name {
            font-size: 13px;
            font-weight: 700;
            color: #26211C;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin-top: 4px;
            color: #574F45;
          }

          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          table.items-table th {
            background: #FAF8F5;
            border-top: 1px solid #E5DFD7;
            border-bottom: 1px solid #E5DFD7;
            padding: 8px 10px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #574F45;
          }

          .summary-split {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .remit-card {
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .totals-card {
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 3px 0;
            color: #574F45;
          }
          .total-highlight {
            border-top: 1px solid #E5DFD7;
            margin-top: 6px;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-highlight-label {
            font-size: 12px;
            font-weight: 800;
            color: #26211C;
            text-transform: uppercase;
          }
          .total-highlight-val {
            font-size: 16px;
            font-weight: 800;
            color: #137333;
            font-family: monospace;
          }

          .footer-section {
            border-top: 1px solid #E5DFD7;
            padding-top: 14px;
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
              <div class="brand-title">URBAN FURNITURE</div>
              <div class="brand-subtitle">Contemporary Contract &amp; Domestic Furnishings</div>
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
            <div class="invoice-date">Due Date: ${invoice.dueDate || 'Immediate'}</div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Billed To</div>
            <div class="customer-name">${invoice.customerName || 'Walk-in Customer'}</div>
            <div class="meta-row">
              <span>Customer ID:</span>
              <span style="font-family: monospace;">#${invoice.customerId}</span>
            </div>
            <div class="meta-row">
              <span>Delivery Place:</span>
              <span>Gandhinagar / Ahmedabad, Gujarat</span>
            </div>
            <div class="meta-row">
              <span>Place of Supply:</span>
              <strong>Gujarat (24) • B2C</strong>
            </div>
          </div>

          <div class="meta-card">
            <div class="meta-label">Invoice Particulars</div>
            <div class="meta-row">
              <span>Supply Type:</span>
              <span>Intra-State Supply (CGST + SGST)</span>
            </div>
            <div class="meta-row">
              <span>HSN Chapter:</span>
              <span style="font-family: monospace;">9403 (Furniture)</span>
            </div>
            <div class="meta-row">
              <span>Reverse Charge (RCM):</span>
              <strong style="color: #137333;">No</strong>
            </div>
            ${invoice.soNumber ? `
            <div class="meta-row">
              <span>Originating SO:</span>
              <span style="font-family: monospace;">${invoice.soNumber}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="text-align: left;">Item &amp; Description</th>
              <th style="width: 50px; text-align: center;">HSN</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 85px; text-align: right;">Unit Price</th>
              <th style="width: 90px; text-align: right;">Taxable</th>
              <th style="width: 100px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <!-- Summary & Remittance -->
        <div class="summary-split">
          <div class="remit-card">
            <div class="meta-label">Payment Remittance Details</div>
            <div style="font-family: monospace; font-size: 10.5px; color: #574F45; line-height: 1.45;">
              Bank: <strong>State Bank of India</strong> (Current)<br>
              A/C Number: <strong>389201004521</strong><br>
              IFSC Code: <strong>SBIN0001234</strong> • Gandhinagar<br>
              UPI VPA: <strong>urbanfurniture@sbi</strong>
            </div>
            <div style="font-size: 9.5px; color: #8C827A; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #E5DFD7;">
              ✓ All items covered under 1-Year Comprehensive Warranty.<br>
              Certified true &amp; correct under Rule 46 of CGST Rules, 2017.
            </div>
          </div>

          <div class="totals-card">
            <div class="total-line">
              <span>Subtotal (Taxable):</span>
              <span style="font-family: monospace;">₹${subtotalNum.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>CGST (9%):</span>
              <span style="font-family: monospace;">₹${cgstHalf.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>SGST (9%):</span>
              <span style="font-family: monospace;">₹${sgstHalf.toFixed(2)}</span>
            </div>
            <div class="total-highlight">
              <span class="total-highlight-label">Total Amount:</span>
              <span class="total-highlight-val">₹${grandTotalNum.toFixed(2)}</span>
            </div>
            <div style="font-size: 9px; color: #8C827A; font-style: italic; text-align: right; margin-top: 4px;">
              ${numberToIndianWords(grandTotalNum)}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-section">
          <div style="font-size: 10px; color: #137333; font-family: monospace; font-weight: 600;">
            ✓ Digitally Verified GST Invoice • Form INV-01
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; font-weight: 700; color: #26211C; text-transform: uppercase;">
              For URBAN FURNITURE PVT. LTD.
            </div>
            <div style="font-size: 9px; color: #8C827A; margin-top: 2px;">
              Authorised Signatory
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
