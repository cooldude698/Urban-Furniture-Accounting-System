import { z } from 'zod';

export const POLineSchema = z.object({
  id: z.number().int().positive().optional(),
  po_id: z.number().int().positive().optional(),
  sr_no: z.number().int().positive().default(1),
  product_id: z.number().int().positive('Product is required'),
  product_name: z.string().optional(),
  analytic_account_id: z.number().int().positive().nullable().optional(),
  analytic_account_name: z.string().nullable().optional(),
  qty: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid decimal string'),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total must be a valid decimal string').optional(),
});
export type POLine = z.infer<typeof POLineSchema>;

export const POStatusEnum = z.enum(['draft', 'confirmed', 'cancelled']);
export type POStatus = z.infer<typeof POStatusEnum>;

export const PurchaseOrderSchema = z.object({
  id: z.number().int().positive().optional(),
  number: z.string().optional(),
  vendor_id: z.number().int().positive('Vendor is required'),
  vendor_name: z.string().optional(),
  po_date: z.string().min(1, 'PO date is required'),
  status: POStatusEnum.default('draft'),
  total_amount: z.string().default('0.00'),
  lines: z.array(POLineSchema).min(1, 'At least one line item is required'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const CreatePOInputSchema = z.object({
  vendor_id: z.number().int().positive('Vendor is required'),
  po_date: z.string().min(1, 'PO date is required'),
  lines: z.array(
    z.object({
      product_id: z.number().int().positive('Product is required'),
      analytic_account_id: z.number().int().positive().nullable().optional(),
      qty: z.number().positive('Quantity must be greater than 0'),
      unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid decimal string'),
    })
  ).min(1, 'At least one line item is required'),
});
export type CreatePOInput = z.infer<typeof CreatePOInputSchema>;

export const UpdatePOInputSchema = CreatePOInputSchema.partial();
export type UpdatePOInput = z.infer<typeof UpdatePOInputSchema>;
