import { apiRequest } from './client';
import { VendorBill, CreateBillInput, UpdateBillInput } from '@shared/schemas/vendorBill.schema';

export const VendorBillsApi = {
  getAll: () => apiRequest<VendorBill[]>('/api/bills'),

  getById: (id: number) => apiRequest<VendorBill>(`/api/bills/${id}`),

  create: (data: CreateBillInput) =>
    apiRequest<VendorBill>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirm: async (id: number): Promise<{ bill: VendorBill; warning?: string }> => {
    const res = await fetch(`/api/bills/${id}/confirm`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    if (json.error && json.error.severity === 'blocking') {
      throw new Error(json.error.message);
    }
    return {
      bill: json.data,
      warning: json.error && json.error.severity === 'warning' ? json.error.message : undefined,
    };
  },

  cancel: (id: number) =>
    apiRequest<VendorBill>(`/api/bills/${id}/cancel`, {
      method: 'POST',
    }),

  getPayments: (id: number) =>
    apiRequest<any[]>(`/api/bills/${id}/payments`),

  registerPayment: (
    id: number,
    data: { amount: string | number; method: 'cash' | 'bank'; paymentDate?: string }
  ) =>
    apiRequest<any>(`/api/bills/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

