import { z } from 'zod';

export const InvoiceLineInputSchema = z.object({
  productId: z.number().int().positive('Product is required'),
  accountId: z.number().int().positive('Account is required').optional(),
  analyticAccountId: z.number().int().positive().nullable().optional(),
  qty: z.string().or(z.number()).transform((val: string | number) => String(val)),
  unitPrice: z.string().or(z.number()).transform((val: string | number) => String(val)),
  taxRate: z.string().or(z.number()).default('18.00').transform((val: string | number) => String(val)),
});

export const CreateInvoiceSchema = z.object({
  soId: z.number().int().positive().nullable().optional(),
  customerId: z.number().int().positive('Customer is required'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  journalId: z.number().int().positive().optional(),
  lines: z.array(InvoiceLineInputSchema).min(1, 'At least one line item is required'),
});

export type InvoiceLineInput = z.infer<typeof InvoiceLineInputSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export interface InvoiceLineDTO {
  id: number;
  invoiceId: number;
  productId: number;
  productName?: string;
  accountId: number;
  accountName?: string;
  analyticAccountId?: number | null;
  analyticAccountName?: string | null;
  qty: string;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  subtotal: string;
  total: string;
}

export interface CustomerInvoiceDTO {
  id: number;
  number: string;
  soId?: number | null;
  customerId: number;
  customerName?: string;
  invoiceDate: string;
  dueDate: string;
  journalId?: number;
  journalEntryId?: number | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid?: string;
  amountDue?: string;
  paymentStatus?: 'Draft' | 'Not Paid' | 'Partial' | 'Paid' | 'Cancelled';
  lines: InvoiceLineDTO[];
  createdAt: string;
  updatedAt: string;
}
