import { z } from 'zod';

export const journalEntryLineInputSchema = z.object({
  account_id: z.number().int().positive('Account is required'),
  partner_id: z.number().int().positive().nullable().optional(),
  analytic_account_id: z.number().int().positive().nullable().optional(),
  debit: z.string().or(z.number()).transform((v) => String(v)),
  credit: z.string().or(z.number()).transform((v) => String(v)),
  description: z.string().nullable().optional(),
});

export const createJournalEntrySchema = z.object({
  journal_id: z.number().int().positive('Journal is required'),
  entry_date: z.string().optional(),
  reference: z.string().nullable().optional(),
  lines: z.array(journalEntryLineInputSchema).min(2, 'Journal entry must have at least 2 lines'),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type JournalEntryLineInput = z.infer<typeof journalEntryLineInputSchema>;
