import { z } from 'zod';

export const BillLineSchema = z.object({
  id: z.number().int().positive().optional(),
  bill_id: z.number().int().positive().optional(),
  sr_no: z.number().int().positive().default(1),
  product_id: z.number().int().positive('Product is required'),
  product_name: z.string().optional(),
  account_id: z.number().int().positive('Account is required').default(6), // 6 = Purchase Expense
  account_name: z.string().optional(),
  analytic_account_id: z.number().int().positive().nullable().optional(),
  analytic_account_name: z.string().nullable().optional(),
  qty: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid decimal string'),
  tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid decimal string').default('0.00'),
  subtotal: z.string().optional(),
  tax_amount: z.string().optional(),
  total: z.string().optional(),
});
export type BillLine = z.infer<typeof BillLineSchema>;

export const BillStatusEnum = z.enum(['draft', 'confirmed', 'cancelled']);
export type BillStatus = z.infer<typeof BillStatusEnum>;

export const PaymentStatusEnum = z.enum(['paid', 'partial', 'not_paid']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const VendorBillSchema = z.object({
  id: z.number().int().positive().optional(),
  number: z.string().optional(),
  bill_reference: z.string().optional().default(''),
  po_id: z.number().int().positive().nullable().optional(),
  vendor_id: z.number().int().positive('Vendor is required'),
  vendor_name: z.string().optional(),
  bill_date: z.string().min(1, 'Bill date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: BillStatusEnum.default('draft'),
  total_amount: z.string().default('0.00'),
  tax_amount: z.string().default('0.00'),
  grand_total: z.string().default('0.00'),
  total: z.string().optional(),
  amount_paid: z.string().default('0.00'),
  amount_due: z.string().default('0.00'),
  payment_status: PaymentStatusEnum.default('not_paid'),
  paid_via_cash: z.string().default('0.00'),
  paid_via_bank: z.string().default('0.00'),
  journal_entry_id: z.number().int().positive().nullable().optional(),
  lines: z.array(BillLineSchema).min(1, 'At least one line item is required'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type VendorBill = z.infer<typeof VendorBillSchema>;

export const CreateBillInputSchema = z.object({
  bill_reference: z.string().optional().default(''),
  po_id: z.number().int().positive().nullable().optional(),
  vendor_id: z.number().int().positive('Vendor is required'),
  bill_date: z.string().min(1, 'Bill date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  lines: z.array(
    z.object({
      product_id: z.number().int().positive('Product is required'),
      account_id: z.number().int().positive().default(6),
      analytic_account_id: z.number().int().positive().nullable().optional(),
      qty: z.number().positive('Quantity must be greater than 0'),
      unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid decimal string'),
      tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid decimal string').default('0.00'),
    })
  ).min(1, 'At least one line item is required'),
});
export type CreateBillInput = z.infer<typeof CreateBillInputSchema>;

export const UpdateBillInputSchema = CreateBillInputSchema.partial();
export type UpdateBillInput = z.infer<typeof UpdateBillInputSchema>;
