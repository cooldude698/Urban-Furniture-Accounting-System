import { apiRequest } from './client';
import { AnalyticAccount, CreateAnalyticAccountInput, UpdateAnalyticAccountInput } from '@shared/schemas/analytic.schema';

export const AnalyticsApi = {
  getAll: (includeArchived = false, type?: string) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    if (type && type !== 'all') params.set('type', type);
    return apiRequest<AnalyticAccount[]>(`/api/analytic-accounts?${params.toString()}`);
  },

  getById: (id: number) => apiRequest<AnalyticAccount>(`/api/analytic-accounts/${id}`),

  create: (data: CreateAnalyticAccountInput) =>
    apiRequest<AnalyticAccount>('/api/analytic-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateAnalyticAccountInput) =>
    apiRequest<AnalyticAccount>(`/api/analytic-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archive: (id: number, is_archived: boolean) =>
    apiRequest<AnalyticAccount>(`/api/analytic-accounts/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ is_archived }),
    }),
};
