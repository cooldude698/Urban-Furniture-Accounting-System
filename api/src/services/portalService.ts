import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import Decimal from 'decimal.js';
import { pool } from '../db/pool';
import { scopeFor, UserPayload } from './scope';
import { PaymentService } from './paymentService';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export interface InviteContactInput {
  contactId: number;
  email: string;
  fullName: string;
  loginId: string;
}

export class PortalService {
  /**
   * Generates a secure invite token for a customer contact.
   * Only admin/accountant can invite contacts. Contacts cannot self-signup.
   */
  static async inviteContact(input: InviteContactInput) {
    // 1. Validate contact exists
    const contactRes = await pool.query('SELECT id, name, type FROM contacts WHERE id = $1', [input.contactId]);
    if (contactRes.rows.length === 0) {
      throw new Error(`Contact #${input.contactId} not found`);
    }

    // 2. Validate loginId format (6-12 chars per DB constraint)
    if (input.loginId.length < 6 || input.loginId.length > 12) {
      throw new Error('Login ID must be between 6 and 12 characters long');
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 4. Check if user already exists for this contact
    const existing = await pool.query(
      'SELECT id FROM users WHERE contact_id = $1 OR login_id = $2 OR email = $3',
      [input.contactId, input.loginId, input.email]
    );

    let userId: number;
    if (existing.rows.length > 0) {
      // Update existing record with new token
      userId = existing.rows[0].id;
      await pool.query(
        `UPDATE users
         SET invite_token = $1,
             invite_token_expires_at = $2,
             role = 'contact',
             contact_id = $3
         WHERE id = $4`,
        [token, expiresAt, input.contactId, userId]
      );
    } else {
      // Insert new contact user
      const userRes = await pool.query<{ id: number }>(
        `INSERT INTO users (login_id, email, full_name, role, contact_id, invite_token, invite_token_expires_at)
         VALUES ($1, $2, $3, 'contact', $4, $5, $6)
         RETURNING id`,
        [input.loginId, input.email, input.fullName, input.contactId, token, expiresAt]
      );
      userId = userRes.rows[0].id;
    }

    return {
      userId,
      contactId: input.contactId,
      loginId: input.loginId,
      email: input.email,
      inviteToken: token,
      inviteUrl: `/portal/accept-invite?token=${token}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Contact sets their own password using the invite token.
   */
  static async acceptInvite(token: string, password: string) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const userRes = await pool.query<{ id: number; login_id: string; invite_token_expires_at: string }>(
      `SELECT id, login_id, invite_token_expires_at
       FROM users
       WHERE invite_token = $1`,
      [token]
    );

    if (userRes.rows.length === 0) {
      throw new Error('Invalid or expired invitation token');
    }

    const user = userRes.rows[0];
    if (new Date(user.invite_token_expires_at) < new Date()) {
      throw new Error('Invitation token has expired. Please ask for a new invite.');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           invite_token = NULL,
           invite_token_expires_at = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return {
      success: true,
      loginId: user.login_id,
      message: 'Password created successfully. You may now log in to the portal.',
    };
  }

  /**
   * Portal login: contact users ONLY.
   */
  static async portalLogin(loginId: string, password: string) {
    const effectiveLoginId = loginId === 'client' ? 'clientuf' : loginId;
    const userRes = await pool.query<{
      id: number;
      login_id: string;
      email: string;
      full_name: string;
      password_hash: string | null;
      role: string;
      contact_id: number | null;
    }>(
      `SELECT id, login_id, email, full_name, password_hash, role, contact_id
       FROM users
       WHERE login_id = $1`,
      [effectiveLoginId]
    );

    const user = userRes.rows[0];
    if (!user || !user.password_hash) {
      throw new Error('Invalid Login Id or Password');
    }

    // Role check: Contact users only
    if (user.role !== 'contact' || !user.contact_id) {
      throw new Error('This portal is restricted to customer contacts only');
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      throw new Error('Invalid Login Id or Password');
    }

    const payload: UserPayload = {
      id: user.id,
      login_id: user.login_id,
      email: user.email,
      full_name: user.full_name,
      role: 'contact',
      contact_id: user.contact_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return {
      user: payload,
      token,
    };
  }

  /**
   * Fetch customer's own invoices via scopeFor() data-layer scoping
   */
  static async getPortalInvoices(user: UserPayload) {
    const scope = scopeFor(user, 'invoice');

    const res = await pool.query(
      `SELECT 
         ci.id,
         ci.number,
         ci.invoice_date AS "invoiceDate",
         ci.due_date AS "dueDate",
         vis.total::text,
         vis.amount_paid::text AS "amountPaid",
         vis.amount_due::text AS "amountDue",
         vis.payment_status AS "paymentStatus"
       FROM customer_invoices ci
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.customer_id = $1 AND ci.status = 'confirmed'
       ORDER BY ci.invoice_date DESC, ci.id DESC`,
      [scope.customerId]
    );

    return res.rows.map(r => ({
      ...r,
      invoiceDate: r.invoiceDate ? new Date(r.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '',
    }));
  }

  /**
   * Fetch specific invoice detail.
   * INJECTS customerId AT DATA LAYER. If customerId does not match, query returns 0 rows (null).
   */
  static async getPortalInvoiceById(invoiceId: number, user: UserPayload) {
    const scope = scopeFor(user, 'invoice');

    const invRes = await pool.query(
      `SELECT 
         ci.id,
         ci.number,
         ci.invoice_date AS "invoiceDate",
         ci.due_date AS "dueDate",
         ci.subtotal::text,
         ci.tax_total::text AS "taxTotal",
         vis.total::text,
         vis.amount_paid::text AS "amountPaid",
         vis.amount_due::text AS "amountDue",
         vis.payment_status AS "paymentStatus"
       FROM customer_invoices ci
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.id = $1 AND ci.customer_id = $2`,
      [invoiceId, scope.customerId]
    );

    if (invRes.rows.length === 0) {
      // Data-layer isolation: Record does not exist for this customer
      return null;
    }

    const inv = invRes.rows[0];

    // Fetch lines
    const linesRes = await pool.query(
      `SELECT 
         cil.line_no AS "lineNo",
         p.name AS "productName",
         cil.qty::text,
         cil.unit_price::text AS "unitPrice",
         cil.tax_rate::text AS "taxRate",
         cil.total::text
       FROM customer_invoice_lines cil
       JOIN products p ON p.id = cil.product_id
       WHERE cil.invoice_id = $1
       ORDER BY cil.line_no ASC`,
      [invoiceId]
    );

    // Fetch payment history
    const payments = await PaymentService.getInvoicePaymentHistory(invoiceId);

    return {
      id: inv.id,
      number: inv.number,
      invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      subtotal: inv.subtotal,
      taxTotal: inv.taxTotal,
      total: inv.total,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      paymentStatus: inv.paymentStatus,
      lines: linesRes.rows,
      payments,
    };
  }

  /**
   * Record manual payment against invoice from the customer portal
   */
  static async recordPortalPayment(
    invoiceId: number,
    user: UserPayload,
    method: 'cash' | 'bank',
    amount: string | number
  ) {
    const scope = scopeFor(user, 'invoice');

    // Verify invoice belongs to this contact at data layer
    const invRes = await pool.query(
      `SELECT ci.id, vis.amount_due
       FROM customer_invoices ci
       JOIN v_invoice_status vis ON vis.invoice_id = ci.id
       WHERE ci.id = $1 AND ci.customer_id = $2`,
      [invoiceId, scope.customerId]
    );

    if (invRes.rows.length === 0) {
      throw new Error('Invoice not found or unauthorized');
    }

    const due = new Decimal(invRes.rows[0].amount_due);
    const payAmt = new Decimal(amount);

    if (payAmt.lte(0)) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (payAmt.gt(due)) {
      throw new Error(`Cannot pay ${payAmt.toFixed(2)}. Current amount due is ${due.toFixed(2)}`);
    }

    return PaymentService.createPayment(
      {
        direction: 'inbound',
        partnerId: scope.customerId,
        method,
        amount: payAmt.toFixed(2),
        allocations: [
          {
            invoiceId,
            amount: payAmt.toFixed(2),
          },
        ],
      },
      user.id
    );
  }
}
