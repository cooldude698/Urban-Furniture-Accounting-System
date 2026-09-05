import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TYL9FJAZxMYoFc';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '98JCu3v5NpfezNpgqCOCjFbH';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paisa
  currency: string;
  keyId: string;
  receipt: string;
}

export class RazorpayService {
  static getKeyId(): string {
    return RAZORPAY_KEY_ID;
  }

  /**
   * Create an order via Razorpay REST API
   * @param amountInr Amount in INR (string or number, e.g. "5000.00")
   * @param receipt Receipt identifier
   * @param notes Additional metadata
   */
  static async createOrder(
    amountInr: string | number,
    receipt: string,
    notes?: Record<string, any>
  ): Promise<RazorpayOrderResponse> {
    const amountInPaisa = Math.round(Number(amountInr) * 100);

    if (amountInPaisa <= 0) {
      throw new Error('Order amount must be greater than zero');
    }

    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaisa,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes: notes || {},
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      const errorMsg = data?.error?.description || data?.error?.message || 'Razorpay order creation failed';
      throw new Error(errorMsg);
    }

    return {
      orderId: data.id,
      amount: data.amount,
      currency: data.currency || 'INR',
      keyId: RAZORPAY_KEY_ID,
      receipt: data.receipt,
    };
  }

  /**
   * Verify HMAC-SHA256 signature sent by Razorpay Checkout
   * signature = hmac_sha256(order_id + "|" + payment_id, secret)
   */
  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  }
}
