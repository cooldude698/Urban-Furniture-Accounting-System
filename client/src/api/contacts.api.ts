import { apiRequest } from './client';
import { Contact, CreateContactInput, UpdateContactInput } from '@shared/schemas/contact.schema';

export const ContactsApi = {
  getAll: (includeArchived = false, type?: string) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    if (type && type !== 'all') params.set('type', type);
    return apiRequest<Contact[]>(`/api/contacts?${params.toString()}`);
  },

  getById: (id: number) => apiRequest<Contact>(`/api/contacts/${id}`),

  create: (data: CreateContactInput) =>
    apiRequest<Contact>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateContactInput) =>
    apiRequest<Contact>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archive: (id: number, is_archived: boolean) =>
    apiRequest<Contact>(`/api/contacts/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ is_archived }),
    }),

  uploadImage: async (id: number, file: File): Promise<Contact> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`/api/contacts/${id}/image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data;
  },

  getCounts: (id: number) =>
    apiRequest<{
      billCount: number;
      poCount: number;
      confirmedBillCount: number;
      totalBilled: string;
      totalPaid: string;
      totalDue: string;
    }>(`/api/contacts/${id}/counts`),

  getStatement: (id: number) =>
    apiRequest<{
      contact: Contact;
      opening_balance: string;
      closing_balance: string;
      total_billed: string;
      total_paid: string;
      lines: Array<{
        id: string;
        date: string;
        doc_number: string;
        reference: string;
        type: 'bill' | 'payment';
        debit: string;
        credit: string;
        running_balance: string;
      }>;
    }>(`/api/contacts/${id}/statement`),

  inviteToPortal: (data: { contactId: number; email: string; fullName: string; loginId: string }) =>
    apiRequest<{
      userId: number;
      contactId: number;
      loginId: string;
      email: string;
      inviteToken: string;
      inviteUrl: string;
      expiresAt: string;
    }>('/api/portal/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
