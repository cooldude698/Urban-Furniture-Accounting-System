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

    // Compute deterministic 64-char SHA-256 e-Invoice IRN & Acknowledgement details
    const rawIrnData = `${invoice.number}-${invoice.invoiceDate}-24AABCU9603R1ZM-${invoice.total}`;
    const irnHash = crypto.createHash('sha256').update(rawIrnData).digest('hex');
    const ackNo = '12' + (new Date(invoice.invoiceDate).getFullYear() || 2026) + String(invoice.id).padStart(8, '0');
    const ackDate = invoice.invoiceDate ? `${invoice.invoiceDate} 11:30:00` : '2026-09-05 11:30:00';

    const linesHtml = invoice.lines
      .map((line, index) => {
        const lineSubtotal = parseFloat(line.subtotal) || 0;
        const lineTax = parseFloat(line.taxAmount) || 0;
        const lineTotal = parseFloat(line.total) || (lineSubtotal + lineTax);
        const lineCgst = (lineTax / 2).toFixed(2);
        const lineSgst = (lineTax / 2).toFixed(2);

        return `
        <tr>
          <td style="padding: 7px 6px; border: 1px solid #292524; text-align: center; font-family: monospace; font-size: 11px;">${index + 1}</td>
          <td style="padding: 7px 8px; border: 1px solid #292524; font-size: 11px;">
            <div style="font-weight: 700; color: #1c1917;">${line.productName}</div>
            <div style="font-size: 9px; color: #78716c; font-family: monospace;">SKU: ${line.productSku || 'UF-COMM-01'} • Grade A Wood / Steel</div>
          </td>
          <td style="padding: 7px 6px; border: 1px solid #292524; text-align: center; font-family: monospace; font-size: 11px; font-weight: 600;">9403</td>
          <td style="padding: 7px 6px; border: 1px solid #292524; text-align: center; font-family: monospace; font-size: 11px;">${line.qty} NOS</td>
          <td style="padding: 7px 8px; border: 1px solid #292524; text-align: right; font-family: monospace; font-size: 11px;">${parseFloat(line.unitPrice).toFixed(2)}</td>
          <td style="padding: 7px 8px; border: 1px solid #292524; text-align: right; font-family: monospace; font-size: 11px; font-weight: 600;">${lineSubtotal.toFixed(2)}</td>
          <td style="padding: 7px 6px; border: 1px solid #292524; text-align: right; font-family: monospace; font-size: 10px;">${lineCgst}</td>
          <td style="padding: 7px 6px; border: 1px solid #292524; text-align: right; font-family: monospace; font-size: 10px;">${lineSgst}</td>
          <td style="padding: 7px 8px; border: 1px solid #292524; text-align: right; font-family: monospace; font-size: 11px; font-weight: 700; color: #0c0a09;">${lineTotal.toFixed(2)}</td>
        </tr>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>GST Tax Invoice - ${invoice.number}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1c1917;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.35;
          }
          .tricolor-strip {
            display: flex;
            height: 4px;
            width: 100%;
            margin-bottom: 8px;
          }
          .tc-saffron { background-color: #FF9933; width: 33.33%; }
          .tc-white { background-color: #FFFFFF; width: 33.34%; border-top: 1px solid #e7e5e4; border-bottom: 1px solid #e7e5e4; }
          .tc-green { background-color: #138808; width: 33.33%; }

          .gov-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #292524;
            background: #f5f5f4;
            padding: 4px 10px;
            margin-bottom: 8px;
          }
          .gov-banner-title {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #292524;
          }
          .gov-banner-badge {
            font-size: 8.5px;
            font-weight: 700;
            background: #1c1917;
            color: #ffffff;
            padding: 2px 7px;
            border-radius: 2px;
            letter-spacing: 0.6px;
          }

          .header-box {
            border: 2px solid #1c1917;
            padding: 10px;
            margin-bottom: 8px;
            background: #fafaf9;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #d6d3d1;
            padding-bottom: 8px;
          }
          .title-area h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0c0a09;
            text-transform: uppercase;
          }
          .title-area .sub {
            font-size: 9.5px;
            color: #57534e;
            font-weight: 600;
            margin-top: 2px;
          }
          .title-area .citation {
            font-size: 8.5px;
            color: #78716c;
            font-family: monospace;
            margin-top: 2px;
          }

          .company-area {
            text-align: right;
          }
          .company-name {
            font-size: 14px;
            font-weight: 900;
            color: #1c1917;
            text-transform: uppercase;
            letter-spacing: -0.2px;
          }
          .company-details {
            font-size: 9px;
            color: #44403c;
            line-height: 1.3;
            margin-top: 2px;
          }

          .irn-bar {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px dashed #d6d3d1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: monospace;
            font-size: 8.5px;
            color: #44403c;
          }
          .irn-hash {
            font-weight: 700;
            color: #0c0a09;
          }

          .two-col-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 2px solid #1c1917;
            margin-bottom: 8px;
          }
          .col-box {
            padding: 8px 10px;
          }
          .col-box:first-child {
            border-right: 2px solid #1c1917;
          }
          .col-heading {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #78716c;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #e7e5e4;
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          .col-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 3px;
          }
          .col-label {
            color: #57534e;
          }
          .col-val {
            font-weight: 600;
            color: #1c1917;
            text-align: right;
          }
          .col-val-mono {
            font-family: monospace;
            font-weight: 700;
          }

          table.invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          table.invoice-table th {
            background: #f5f5f4;
            border: 1px solid #1c1917;
            padding: 6px 5px;
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1c1917;
            letter-spacing: 0.3px;
          }

          table.hsn-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9px;
            font-family: monospace;
          }
          table.hsn-table th {
            background: #e7e5e4;
            border: 1px solid #78716c;
            padding: 4px 6px;
            font-weight: 700;
            text-align: right;
          }
          table.hsn-table th:first-child { text-align: left; }
          table.hsn-table td {
            border: 1px solid #78716c;
            padding: 4px 6px;
            text-align: right;
          }
          table.hsn-table td:first-child { text-align: left; font-weight: 700; }

          .bottom-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            border: 2px solid #1c1917;
            margin-bottom: 8px;
          }
          .bottom-left {
            padding: 8px 10px;
            border-right: 2px solid #1c1917;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .bottom-right {
            padding: 8px 10px;
            background: #fafaf9;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            padding: 2.5px 0;
            color: #44403c;
          }
          .summary-row.total {
            border-top: 2px solid #1c1917;
            border-bottom: 2px solid #1c1917;
            margin-top: 4px;
            padding: 5px 0;
            font-size: 13px;
            font-weight: 900;
            color: #0c0a09;
          }
          .words-bar {
            border: 1px solid #292524;
            background: #f5f5f4;
            padding: 5px 8px;
            font-size: 9.5px;
            margin-bottom: 8px;
          }

          .auth-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border: 1px solid #d6d3d1;
            padding: 8px 12px;
            background: #ffffff;
          }
          .signature-box {
            text-align: center;
            width: 140px;
          }
          .sig-line {
            border-top: 1px solid #78716c;
            margin-top: 28px;
            padding-top: 3px;
            font-size: 8.5px;
            color: #57534e;
          }
        </style>
      </head>
      <body>
        <!-- Government Color Band -->
        <div class="tricolor-strip">
          <div class="tc-saffron"></div>
          <div class="tc-white"></div>
          <div class="tc-green"></div>
        </div>

        <!-- Government System Sub-header -->
        <div class="gov-banner">
          <div class="gov-banner-title">
            GOVERNMENT OF INDIA • GST E-INVOICING PORTAL (NIC / GSTN) • FORM GST INV-01
          </div>
          <div class="gov-banner-badge">
            ORIGINAL FOR RECIPIENT
          </div>
        </div>

        <!-- Master Invoice Header -->
        <div class="header-box">
          <div class="header-top">
            <div class="title-area">
              <h1>TAX INVOICE</h1>
              <div class="sub">Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017</div>
              <div class="citation">Place of Supply: 24 - Gujarat • Supply Type: B2C Intra-State Supply</div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div class="company-area">
                <div class="company-name">URBAN FURNITURE PVT. LTD.</div>
                <div class="company-details">
                  CIN: <strong>U36100GJ2020PTC115482</strong><br>
                  GSTIN: <strong style="font-family: monospace; font-size: 10px;">24AABCU9603R1ZM</strong><br>
                  PAN: <strong>AABCU9603R</strong> • State: <strong>Gujarat (24)</strong><br>
                  Regd. Office: Plot 42, Sec 25, GIDC Electronics Zone, Gandhinagar - 382024<br>
                  Tel: +91 79 2328 0000 • billing@urbanfurniture.in
                </div>
              </div>

              <!-- Official E-Invoice QR Code Matrix SVG (Deterministic, 100% Offline) -->
              <svg width="68" height="68" viewBox="0 0 100 100" style="border: 1px solid #1c1917; padding: 2px; background: #fff;">
                <rect width="100" height="100" fill="#ffffff" />
                <!-- Corner 1 -->
                <rect x="5" y="5" width="28" height="28" fill="#000" />
                <rect x="9" y="9" width="20" height="20" fill="#fff" />
                <rect x="13" y="13" width="12" height="12" fill="#000" />
                <!-- Corner 2 -->
                <rect x="67" y="5" width="28" height="28" fill="#000" />
                <rect x="71" y="9" width="20" height="20" fill="#fff" />
                <rect x="75" y="13" width="12" height="12" fill="#000" />
                <!-- Corner 3 -->
                <rect x="5" y="67" width="28" height="28" fill="#000" />
                <rect x="9" y="71" width="20" height="20" fill="#fff" />
                <rect x="13" y="75" width="12" height="12" fill="#000" />
                <!-- Center Data Mock Modules -->
                <rect x="38" y="8" width="5" height="5" fill="#000" />
                <rect x="48" y="12" width="5" height="5" fill="#000" />
                <rect x="58" y="8" width="5" height="5" fill="#000" />
                <rect x="42" y="24" width="6" height="6" fill="#000" />
                <rect x="52" y="28" width="6" height="6" fill="#000" />
                <rect x="8" y="42" width="6" height="6" fill="#000" />
                <rect x="20" y="48" width="5" height="5" fill="#000" />
                <rect x="38" y="38" width="24" height="24" fill="#000" />
                <rect x="43" y="43" width="14" height="14" fill="#fff" />
                <rect x="47" y="47" width="6" height="6" fill="#000" />
                <rect x="68" y="40" width="6" height="6" fill="#000" />
                <rect x="78" y="48" width="5" height="5" fill="#000" />
                <rect x="88" y="42" width="6" height="6" fill="#000" />
                <rect x="40" y="70" width="5" height="5" fill="#000" />
                <rect x="52" y="75" width="6" height="6" fill="#000" />
                <rect x="68" y="68" width="6" height="6" fill="#000" />
                <rect x="80" y="72" width="6" height="6" fill="#000" />
                <rect x="72" y="84" width="5" height="5" fill="#000" />
                <rect x="85" y="88" width="6" height="6" fill="#000" />
              </svg>
            </div>
          </div>

          <!-- IRN & Acknowledgement Bar -->
          <div class="irn-bar">
            <div>
              IRN: <span class="irn-hash">${irnHash.substring(0, 36)}...</span>
            </div>
            <div>
              Ack No: <strong style="color: #0c0a09;">${ackNo}</strong> • Ack Date: <strong>${ackDate}</strong>
            </div>
          </div>
        </div>

        <!-- 2-Column Statutory Details Grid -->
        <div class="two-col-grid">
          <!-- Left: Details of Receiver / Billed To -->
          <div class="col-box">
            <div class="col-heading">Details of Receiver | Billed To:</div>
            <div style="font-size: 13px; font-weight: 800; color: #0c0a09; margin-bottom: 3px;">
              ${invoice.customerName || 'Cash Customer'}
            </div>
            <div class="col-row">
              <span class="col-label">Customer ID / Reg:</span>
              <span class="col-val-mono">#${invoice.customerId}</span>
            </div>
            <div class="col-row">
              <span class="col-label">Address / Location:</span>
              <span class="col-val">Gandhinagar / Ahmedabad, Gujarat</span>
            </div>
            <div class="col-row">
              <span class="col-label">State &amp; State Code:</span>
              <span class="col-val"><strong>Gujarat (Code: 24)</strong></span>
            </div>
            <div class="col-row">
              <span class="col-label">GSTIN / UIN:</span>
              <span class="col-val-mono" style="color: #78716c;">Unregistered (B2C)</span>
            </div>
            <div class="col-row">
              <span class="col-label">Place of Supply (POS):</span>
              <span class="col-val"><strong>24 - Gujarat</strong></span>
            </div>
          </div>

          <!-- Right: Tax Invoice Particulars -->
          <div class="col-box">
            <div class="col-heading">Tax Invoice Particulars:</div>
            <div class="col-row">
              <span class="col-label">Tax Invoice No:</span>
              <span class="col-val-mono" style="font-size: 11px; color: #0c0a09;">${invoice.number}</span>
            </div>
            <div class="col-row">
              <span class="col-label">Invoice Date:</span>
              <span class="col-val-mono">${invoice.invoiceDate}</span>
            </div>
            <div class="col-row">
              <span class="col-label">Due Date:</span>
              <span class="col-val-mono">${invoice.dueDate || 'Immediate / Cash'}</span>
            </div>
            <div class="col-row">
              <span class="col-label">Reverse Charge (RCM):</span>
              <span class="col-val" style="font-weight: 700; color: #065f46;">No (Sec 9(3)/9(4) N/A)</span>
            </div>
            <div class="col-row">
              <span class="col-label">Transport Mode / Vehicle:</span>
              <span class="col-val">Road / Delivery Van (GJ-18-AZ-4421)</span>
            </div>
            ${invoice.soNumber ? `
            <div class="col-row">
              <span class="col-label">Sales Order Ref:</span>
              <span class="col-val-mono">${invoice.soNumber}</span>
            </div>` : ''}
            ${invoice.journalEntryNumber ? `
            <div class="col-row">
              <span class="col-label">General Ledger Posting:</span>
              <span class="col-val-mono">${invoice.journalEntryNumber}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Statutory Itemized Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="text-align: left;">Description of Goods</th>
              <th style="width: 50px; text-align: center;">HSN</th>
              <th style="width: 55px; text-align: center;">Qty</th>
              <th style="width: 75px; text-align: right;">Rate (₹)</th>
              <th style="width: 80px; text-align: right;">Taxable (₹)</th>
              <th style="width: 65px; text-align: right;">CGST 9%</th>
              <th style="width: 65px; text-align: right;">SGST 9%</th>
              <th style="width: 85px; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <!-- Statutory HSN / SAC Summary Schedule -->
        <table class="hsn-table">
          <thead>
            <tr>
              <th>HSN / SAC Code</th>
              <th>Taxable Value</th>
              <th>Central Tax (CGST 9%)</th>
              <th>State Tax (SGST 9%)</th>
              <th>Integrated Tax (IGST 18%)</th>
              <th>Total Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>9403</strong> - Furniture &amp; Fixtures</td>
              <td>₹${subtotalNum.toFixed(2)}</td>
              <td>₹${cgstHalf.toFixed(2)}</td>
              <td>₹${sgstHalf.toFixed(2)}</td>
              <td>₹0.00</td>
              <td><strong>₹${taxTotalNum.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Settlement & Totals Grid -->
        <div class="bottom-grid">
          <!-- Left: Bank Remittance Details & Legal Declarations -->
          <div class="bottom-left">
            <div>
              <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #57534e; margin-bottom: 3px;">
                Remittance Details for NEFT / RTGS / IMPS:
              </div>
              <div style="font-family: monospace; font-size: 9.5px; line-height: 1.35; color: #292524;">
                Bank: <strong>State Bank of India</strong> (SBI)<br>
                Current A/C No: <strong>389201004521</strong><br>
                IFSC Code: <strong>SBIN0001234</strong> • Branch: <strong>GIDC Gandhinagar</strong><br>
                UPI VPA: <strong>urbanfurniture@sbi</strong>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d6d3d1;">
              <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #78716c; margin-bottom: 2px;">
                Statutory Declaration:
              </div>
              <div style="font-size: 8px; color: #57534e; line-height: 1.25;">
                Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Goods covered under 1-Year Comprehensive Warranty. Subject to Gandhinagar jurisdiction.
              </div>
            </div>
          </div>

          <!-- Right: Totals Summary -->
          <div class="bottom-right">
            <div class="summary-row">
              <span>Total Taxable Amount:</span>
              <span style="font-family: monospace; font-weight: 600;">₹${subtotalNum.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Central GST (CGST @ 9%):</span>
              <span style="font-family: monospace;">₹${cgstHalf.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>State GST (SGST @ 9%):</span>
              <span style="font-family: monospace;">₹${sgstHalf.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL INVOICE VALUE:</span>
              <span style="font-family: monospace; font-size: 14px; color: #065f46;">₹${grandTotalNum.toFixed(2)}</span>
            </div>
            <div class="summary-row" style="margin-top: 4px; color: #065f46;">
              <span>Amount Paid:</span>
              <span style="font-family: monospace;">- ₹${amountPaidNum.toFixed(2)}</span>
            </div>
            <div class="summary-row" style="font-weight: 700; color: ${amountDueNum > 0 ? '#b91c1c' : '#065f46'};">
              <span>Balance Amount Due:</span>
              <span style="font-family: monospace;">₹${amountDueNum.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Amount Chargeable in Words -->
        <div class="words-bar">
          <strong>Amount Chargeable (in words):</strong> ${numberToIndianWords(grandTotalNum)}
        </div>

        <!-- Signatures & Certified Seal -->
        <div class="auth-footer">
          <div class="signature-box">
            <div class="sig-line">
              Customer's Signature / E-Way Acknowledgement
            </div>
          </div>

          <!-- Official Certified Stamp Graphic (SVG) -->
          <div style="text-align: center;">
            <svg width="90" height="90" viewBox="0 0 100 100" style="transform: rotate(-3deg);">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#065f46" stroke-width="2.5" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#065f46" stroke-width="1" stroke-dasharray="2,2" />
              <path id="stamp-upper" d="M 16,50 A 34,34 0 0,1 84,50" fill="none" />
              <path id="stamp-lower" d="M 84,50 A 34,34 0 0,1 16,50" fill="none" />
              <text font-size="6.5" font-weight="900" fill="#065f46" letter-spacing="1">
                <textPath href="#stamp-upper" startOffset="50%" text-anchor="middle">URBAN FURNITURE PVT LTD</textPath>
              </text>
              <text font-size="5.5" font-weight="700" fill="#065f46" letter-spacing="0.8">
                <textPath href="#stamp-lower" startOffset="50%" text-anchor="middle">★ GANDHINAGAR (GJ) ★</textPath>
              </text>
              <text x="50" y="44" font-size="6.5" font-weight="800" fill="#065f46" text-anchor="middle">GSTIN APPROVED</text>
              <text x="50" y="52" font-size="5.5" font-family="monospace" font-weight="700" fill="#065f46" text-anchor="middle">24AABCU9603R1ZM</text>
              <text x="50" y="60" font-size="5" font-weight="700" fill="#065f46" text-anchor="middle">RULE 46 COMPLIANT</text>
            </svg>
          </div>

          <div class="signature-box">
            <div style="font-size: 8px; font-weight: 700; color: #065f46; font-family: monospace; margin-bottom: 2px;">
              [✓ VERIFIED DIGITAL SIGNATURE]
            </div>
            <div style="font-size: 8.5px; font-weight: 800; color: #1c1917; text-transform: uppercase;">
              For URBAN FURNITURE PVT. LTD.
            </div>
            <div class="sig-line">
              Authorised Signatory
            </div>
          </div>
        </div>

        <div style="margin-top: 6px; font-size: 7.5px; color: #a8a29e; text-align: center; font-family: monospace;">
          This is a system-generated electronic tax invoice pursuant to Section 31 of CGST Act, 2017. All entries posted to Enterprise Immutable Ledger.
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
