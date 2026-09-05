import { z } from 'zod';

export const AnalyticTypeEnum = z.enum(['income', 'expense']);
export type AnalyticType = z.infer<typeof AnalyticTypeEnum>;

export const AnalyticAccountSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Analytic account name is required'),
  type: AnalyticTypeEnum,
  description: z.string().optional(),
  is_archived: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type AnalyticAccount = z.infer<typeof AnalyticAccountSchema>;

export const CreateAnalyticAccountInputSchema = AnalyticAccountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateAnalyticAccountInput = z.infer<typeof CreateAnalyticAccountInputSchema>;

export const UpdateAnalyticAccountInputSchema = CreateAnalyticAccountInputSchema.partial();
export type UpdateAnalyticAccountInput = z.infer<typeof UpdateAnalyticAccountInputSchema>;
