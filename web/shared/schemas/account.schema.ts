import { z } from 'zod';

export const AccountTypeEnum = z.enum([
  'asset',
  'liability',
  'bank',
  'capital',
  'cash',
  'income',
  'expense',
  'other_expense',
]);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const AccountGroupMap: Record<AccountType, 'Balancesheet' | 'Profit and Loss'> = {
  asset: 'Balancesheet',
  liability: 'Balancesheet',
  bank: 'Balancesheet',
  capital: 'Balancesheet',
  cash: 'Balancesheet',
  income: 'Profit and Loss',
  expense: 'Profit and Loss',
  other_expense: 'Profit and Loss',
};

export const AccountSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().optional(),
  name: z.string().min(1, 'Account name is required'),
  type: AccountTypeEnum,
  is_archived: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountInputSchema = AccountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;

export const UpdateAccountInputSchema = CreateAccountInputSchema.partial();
export type UpdateAccountInput = z.infer<typeof UpdateAccountInputSchema>;

export const JournalTypeEnum = z.enum(['sales', 'purchase', 'bank', 'cash']);
export type JournalType = z.infer<typeof JournalTypeEnum>;

export const JournalSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Journal name is required'),
  type: JournalTypeEnum,
  default_account_id: z.number().int().positive('Default account is required'),
  default_account_name: z.string().optional(),
  is_archived: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Journal = z.infer<typeof JournalSchema>;

export const CreateJournalInputSchema = JournalSchema.omit({
  id: true,
  default_account_name: true,
  created_at: true,
  updated_at: true,
});
export type CreateJournalInput = z.infer<typeof CreateJournalInputSchema>;

export const UpdateJournalInputSchema = CreateJournalInputSchema.partial();
export type UpdateJournalInput = z.infer<typeof UpdateJournalInputSchema>;
