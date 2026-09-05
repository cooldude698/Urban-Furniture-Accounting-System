import { apiRequest } from './client';
import { PurchaseOrder, CreatePOInput, UpdatePOInput } from '@shared/schemas/purchaseOrder.schema';

export const PurchaseOrdersApi = {
  getAll: () => apiRequest<PurchaseOrder[]>('/api/purchase-orders'),

  getById: (id: number) => apiRequest<PurchaseOrder>(`/api/purchase-orders/${id}`),

  create: (data: CreatePOInput) =>
    apiRequest<PurchaseOrder>('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdatePOInput) =>
    apiRequest<PurchaseOrder>(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  confirm: async (id: number): Promise<{ po: PurchaseOrder; warning?: string }> => {
    const res = await fetch(`/api/purchase-orders/${id}/confirm`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    if (json.error && json.error.severity === 'blocking') {
      throw new Error(json.error.message);
    }
    return {
      po: json.data,
      warning: json.error && json.error.severity === 'warning' ? json.error.message : undefined,
    };
  },

  cancel: (id: number) =>
    apiRequest<PurchaseOrder>(`/api/purchase-orders/${id}/cancel`, {
      method: 'POST',
    }),

  createBill: (id: number) =>
    apiRequest<any>(`/api/purchase-orders/${id}/create-bill`, {
      method: 'POST',
    }),
};
