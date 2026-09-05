import { CustomerInvoiceDTO } from './invoiceService';
import { PdfService } from './pdfService';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'Urban Furniture <onboarding@resend.dev>';

export interface SendReceiptOptions {
  invoice: CustomerInvoiceDTO;
  paymentAmount: string;
  paymentMethod?: string;
  paymentRef?: string;
  recipientEmail?: string;
}

export interface SendReceiptResult {
  success: boolean;
  emailId?: string;
  recipient: string;
  error?: string;
}

export class EmailService {
  /**
   * Generates invoice/receipt PDF and dispatches it to the customer via Resend
   */
  static async sendPaymentReceiptEmail(options: SendReceiptOptions): Promise<SendReceiptResult> {
    const { invoice, paymentAmount, paymentMethod = 'Razorpay / Bank', paymentRef, recipientEmail } = options;

    const targetEmail = (recipientEmail || invoice.customerEmail || '').trim();
    if (!targetEmail) {
      console.warn(`[EmailService] No recipient email found for invoice #${invoice.id} (${invoice.number}). Skipping email.`);
      return {
        success: false,
        recipient: '',
        error: 'No customer email address on file',
      };
    }

    try {
      console.log(`[EmailService] Generating PDF receipt for invoice ${invoice.number}...`);
      const pdfBuffer = await PdfService.generateInvoicePdf(invoice);
      const pdfBase64 = pdfBuffer.toString('base64');
      const safeNumber = invoice.number.replace(/[^a-zA-Z0-9_-]/g, '_');
      const pdfFilename = `Payment_Receipt_${safeNumber}.pdf`;

      const formattedAmount = Number(paymentAmount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const formattedDue = Number(invoice.amountDue).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${invoice.number}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #4A3A34;
      background-color: #F9F2E4;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #D0AE92;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(74, 58, 52, 0.08);
    }
    .header {
      background: #4A3A34;
      color: #F9F2E4;
      padding: 24px 28px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 13px;
      opacity: 0.85;
    }
    .body-content {
      padding: 28px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #4A3A34;
    }
    .lead-text {
      font-size: 13px;
      color: #77574A;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .receipt-box {
      background: #FAF6EF;
      border: 1px solid #EBD7BE;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px dashed #D0AE92;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #77574A;
      font-weight: 500;
    }
    .val {
      color: #4A3A34;
      font-weight: 700;
      font-family: monospace;
    }
    .amount-highlight {
      font-size: 16px;
      color: #2D6A4F;
    }
    .footer {
      background: #F9F2E4;
      border-top: 1px solid #D0AE92;
      padding: 16px 28px;
      font-size: 11px;
      color: #77574A;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>URBAN FURNITURE</h1>
      <p>Official Payment Receipt &amp; Acknowledgment</p>
    </div>
    <div class="body-content">
      <div class="greeting">Dear ${invoice.customerName || 'Valued Customer'},</div>
      <p class="lead-text">
        We have successfully received and recorded your payment towards Invoice <strong>${invoice.number}</strong>.
        An official double-entry settlement has been posted to our General Ledger. Your full PDF receipt is attached to this email.
      </p>

      <div class="receipt-box">
        <div class="row">
          <span class="label">Invoice Number:</span>
          <span class="val">${invoice.number}</span>
        </div>
        <div class="row">
          <span class="label">Amount Paid:</span>
          <span class="val amount-highlight">₹${formattedAmount}</span>
        </div>
        ${paymentRef ? `
        <div class="row">
          <span class="label">Transaction Reference:</span>
          <span class="val">${paymentRef}</span>
        </div>` : ''}
        <div class="row">
          <span class="label">Payment Method:</span>
          <span class="val" style="text-transform: capitalize;">${paymentMethod}</span>
        </div>
        <div class="row">
          <span class="label">Date Recorded:</span>
          <span class="val">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <div class="row">
          <span class="label">Remaining Due:</span>
          <span class="val">₹${formattedDue}</span>
        </div>
      </div>

      <p style="font-size: 12px; color: #77574A; margin: 0;">
        If you have any questions regarding this payment or your account balance, please reply directly or visit your customer portal.
      </p>
    </div>
    <div class="footer">
      Urban Furniture Accounting Engine · Bangalore, India · Powered by Resend
    </div>
  </div>
</body>
</html>
      `;

      console.log(`[EmailService] Dispatching email via Resend to ${targetEmail}...`);

      const resendPayload = {
        from: SENDER_EMAIL,
        to: [targetEmail],
        subject: `Payment Receipt: ${invoice.number} - Urban Furniture`,
        html: emailHtml,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64,
          },
        ],
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });

      const data: any = await res.json();

      if (!res.ok) {
        const errorDetail = data?.message || data?.error?.message || JSON.stringify(data);
        console.warn(`[EmailService] Resend API error: ${errorDetail}`);
        return {
          success: false,
          recipient: targetEmail,
          error: errorDetail,
        };
      }

      console.log(`[EmailService] Payment receipt email sent successfully! Resend ID: ${data.id}`);
      return {
        success: true,
        emailId: data.id,
        recipient: targetEmail,
      };
    } catch (err: any) {
      console.error('[EmailService] Unexpected error sending receipt email:', err);
      return {
        success: false,
        recipient: targetEmail,
        error: err.message || 'Failed to send receipt email',
      };
    }
  }
}
