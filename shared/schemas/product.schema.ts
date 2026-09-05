import { z } from 'zod';

export const ProductTypeEnum = z.enum(['goods', 'service', 'combo']);
export type ProductType = z.infer<typeof ProductTypeEnum>;

export const ProductSchema = z.object({
  id: z.number().int().positive().optional(),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  type: ProductTypeEnum.default('goods'),
  category: z.string().min(1, 'Category is required'),
  sales_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Sales price must be a valid decimal string'),
  cost_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Cost price must be a valid decimal string'),
  mrp: z.string().regex(/^\d+(\.\d{1,2})?$/, 'MRP must be a valid decimal string'),
  tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid decimal string').default('0.00'),
  stock_qty: z.number().optional().default(0),
  min_stock_threshold: z.number().int().nonnegative().optional().default(5),
  lead_time_days: z.number().int().nonnegative().optional().default(14),
  safety_stock: z.string().or(z.number()).transform((v) => String(v)).optional().default('0'),
  model_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_archived: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInputSchema = ProductSchema.omit({
  id: true,
  stock_qty: true,
  created_at: true,
  updated_at: true,
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
