import { apiRequest } from './client';
import { CustomerInvoiceDTO, CreateInvoiceInput } from '@shared/schemas/invoice';

export const CustomerInvoicesApi = {
  getAll: (status?: string) =>
    apiRequest<CustomerInvoiceDTO[]>(`/api/invoices${status ? `?status=${status}` : ''}`),

  getById: (id: number) =>
    apiRequest<CustomerInvoiceDTO>(`/api/invoices/${id}`),

  create: (data: CreateInvoiceInput) =>
    apiRequest<CustomerInvoiceDTO>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirm: (id: number) =>
    apiRequest<CustomerInvoiceDTO>(`/api/invoices/${id}/confirm`, {
      method: 'POST',
    }),

  getPayments: (id: number) =>
    apiRequest<any[]>(`/api/invoices/${id}/payments`),

  registerPayment: (
    id: number,
    data: { amount: string | number; method: 'cash' | 'bank'; paymentDate?: string }
  ) =>
    apiRequest<any>(`/api/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
