import { apiRequest } from './client';
import { Account, CreateAccountInput, UpdateAccountInput, Journal, CreateJournalInput, UpdateJournalInput } from '@shared/schemas/account.schema';

export const AccountsApi = {
  // Accounts
  getAll: (includeArchived = false, type?: string) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    if (type && type !== 'all') params.set('type', type);
    return apiRequest<Account[]>(`/api/accounts?${params.toString()}`);
  },

  getById: (id: number) => apiRequest<Account>(`/api/accounts/${id}`),

  create: (data: CreateAccountInput) =>
    apiRequest<Account>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateAccountInput) =>
    apiRequest<Account>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archive: (id: number, is_archived: boolean) =>
    apiRequest<Account>(`/api/accounts/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ is_archived }),
    }),

  // Journals
  getAllJournals: (includeArchived = false, type?: string) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    if (type && type !== 'all') params.set('type', type);
    return apiRequest<Journal[]>(`/api/journals?${params.toString()}`);
  },

  getJournalById: (id: number) => apiRequest<Journal>(`/api/journals/${id}`),

  createJournal: (data: CreateJournalInput) =>
    apiRequest<Journal>('/api/journals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateJournal: (id: number, data: UpdateJournalInput) =>
    apiRequest<Journal>(`/api/journals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archiveJournal: (id: number, is_archived: boolean) =>
    apiRequest<Journal>(`/api/journals/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ is_archived }),
    }),
};
