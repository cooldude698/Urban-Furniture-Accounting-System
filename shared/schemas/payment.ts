import { z } from 'zod';

export const paymentAllocationSchema = z.object({
  invoiceId: z.number().int().positive().optional(),
  billId: z.number().int().positive().optional(),
  amount: z.string().or(z.number()).transform((v: string | number) => String(v)),
}).refine(
  (data: { invoiceId?: number; billId?: number; amount: string }) => (data.invoiceId != null && data.billId == null) || (data.billId != null && data.invoiceId == null),
  { message: 'Each allocation must specify either invoiceId or billId, but not both' }
);

export const createPaymentSchema = z.object({
  direction: z.enum(['inbound', 'outbound']),
  partnerId: z.number().int().positive('Partner ID is required'),
  method: z.enum(['cash', 'bank']),
  paymentDate: z.string().optional(),
  amount: z.string().or(z.number()).transform((v: string | number) => String(v)),
  allocations: z.array(paymentAllocationSchema).min(1, 'At least one allocation is required'),
});

export type PaymentAllocationInput = z.infer<typeof paymentAllocationSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
