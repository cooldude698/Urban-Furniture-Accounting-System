import { apiRequest } from './client';
import { CreateJournalEntryInput } from '@shared/schemas/journalEntry';

export interface JournalEntryListItem {
  id: number;
  date: string;
  number: string;
  partner: string | null;
  journal: string;
  total: string;
  status: string;
  source_type: string | null;
}

export interface JournalEntryLineDetail {
  id?: number;
  account_id: number;
  account_name?: string;
  account_type?: string;
  partner_id: number | null;
  partner_name?: string | null;
  analytic_account_id: number | null;
  analytic_account_name?: string | null;
  debit: string;
  credit: string;
  description: string | null;
}

export interface JournalEntryDetail {
  id: number;
  number: string;
  journal_id: number;
  journal_name: string;
  entry_date: string;
  reference: string | null;
  status: 'draft' | 'posted';
  source_type: string | null;
  source_id: number | null;
  reversal_of: number | null;
  total: string;
  lines: JournalEntryLineDetail[];
}

export const JournalEntriesApi = {
  async listEntries(): Promise<JournalEntryListItem[]> {
    return apiRequest<JournalEntryListItem[]>('/api/journal-entries');
  },

  async getEntryById(id: number): Promise<JournalEntryDetail> {
    return apiRequest<JournalEntryDetail>(`/api/journal-entries/${id}`);
  },

  async createEntry(data: CreateJournalEntryInput): Promise<JournalEntryDetail> {
    return apiRequest<JournalEntryDetail>('/api/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async postEntry(id: number): Promise<{ id: number; number: string; status: string }> {
    return apiRequest<{ id: number; number: string; status: string }>(`/api/journal-entries/${id}/post`, {
      method: 'POST',
    });
  },

  async reverseEntry(id: number): Promise<{ id: number; number: string; status: string; reversal_of: number }> {
    return apiRequest<{ id: number; number: string; status: string; reversal_of: number }>(`/api/journal-entries/${id}/reverse`, {
      method: 'POST',
    });
  },

  async deleteEntry(id: number): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/api/journal-entries/${id}`, {
      method: 'DELETE',
    });
  },
};
