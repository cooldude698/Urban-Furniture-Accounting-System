import puppeteer from 'puppeteer';
import { CustomerInvoiceDTO } from './invoiceService';

export class PdfService {
  static generateInvoiceHtml(invoice: CustomerInvoiceDTO): string {
    const linesHtml = invoice.lines
      .map(
        (line, index) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: center; font-size: 13px;">${index + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; font-size: 13px;">
            <strong>${line.productName}</strong>
            <div style="font-size: 11px; color: #7B7267;">SKU: ${line.productSku || '-'}</div>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; font-size: 12px; color: #574F45;">${line.analyticAccountName || 'General'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">${line.qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">₹${parseFloat(line.unitPrice).toFixed(2)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">${line.taxRate}%</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-weight: 600; font-size: 13px;">₹${parseFloat(line.total).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoice.number}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #26211C;
            background: #FFFFFF;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #26211C;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #26211C;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-confirmed { background: #E6F4EA; color: #137333; }
          .badge-draft { background: #F1F3F4; color: #5F6368; }
          .badge-paid { background: #E6F4EA; color: #137333; }
          .badge-partial { background: #FEF7E0; color: #B06000; }
          .badge-not_paid { background: #FCE8E6; color: #C5221F; }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
          }
          .meta-box {
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 14px 16px;
          }
          .meta-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #7B7267;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #F2ECE4;
            padding: 10px 12px;
            border-bottom: 2px solid #D5CCC0;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4A4237;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
          }
          .totals-box {
            width: 300px;
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 16px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }
          .grand-total {
            border-top: 2px solid #26211C;
            margin-top: 8px;
            padding-top: 8px;
            font-size: 16px;
            font-weight: 800;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #E5DFD7;
            padding-top: 16px;
            font-size: 11px;
            color: #7B7267;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">URBAN FURNITURE</div>
            <div style="color: #7B7267; font-size: 12px; margin-top: 4px;">Accounting System &amp; Enterprise Ledger</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; font-family: monospace;">${invoice.number}</div>
            <div style="margin-top: 6px;">
              <span class="badge badge-${invoice.status}">${invoice.status}</span>
              <span class="badge badge-${invoice.paymentStatus}" style="margin-left: 6px;">${invoice.paymentStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <div class="meta-title">Billed To</div>
            <div style="font-size: 15px; font-weight: 700; color: #26211C;">${invoice.customerName}</div>
            <div style="color: #574F45; font-size: 12px; margin-top: 4px;">Customer ID: #${invoice.customerId}</div>
            ${invoice.soNumber ? `<div style="color: #574F45; font-size: 12px; margin-top: 2px;">Originating SO: <strong>${invoice.soNumber}</strong></div>` : ''}
          </div>

          <div class="meta-box">
            <div class="meta-title">Invoice Details</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #574F45;">Invoice Date:</span>
              <strong style="font-family: monospace;">${invoice.invoiceDate}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #574F45;">Due Date:</span>
              <strong style="font-family: monospace;">${invoice.dueDate || '-'}</strong>
            </div>
            ${invoice.journalEntryNumber ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #574F45;">Journal Entry:</span>
              <strong style="font-family: monospace;">${invoice.journalEntryNumber}</strong>
            </div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Product / Item</th>
              <th style="text-align: left;">Analytics</th>
              <th style="width: 60px; text-align: right;">Qty</th>
              <th style="width: 90px; text-align: right;">Unit Price</th>
              <th style="width: 60px; text-align: right;">Tax</th>
              <th style="width: 100px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax Total:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.taxTotal).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
            <div class="total-row" style="margin-top: 8px; color: #137333;">
              <span>Amount Paid:</span>
              <span style="font-family: monospace;">- ₹${parseFloat(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div class="total-row" style="font-weight: 700; color: ${parseFloat(invoice.amountDue) > 0 ? '#C5221F' : '#137333'};">
              <span>Amount Due:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.amountDue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Generated deterministically by Urban Furniture Accounting Engine · Strictly Offline &amp; Immutable
        </div>
      </body>
      </html>
    `;
  }

  static async generateInvoicePdf(invoice: CustomerInvoiceDTO): Promise<Buffer> {
    const html = this.generateInvoiceHtml(invoice);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
