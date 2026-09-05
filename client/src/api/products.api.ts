import { apiRequest } from './client';
import { Product, CreateProductInput, UpdateProductInput } from '@shared/schemas/product.schema';

export const ProductsApi = {
  getAll: (includeArchived = false, category?: string, type?: string) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    if (category && category !== 'all') params.set('category', category);
    if (type && type !== 'all') params.set('type', type);
    return apiRequest<Product[]>(`/api/products?${params.toString()}`);
  },

  getById: (id: number) => apiRequest<Product>(`/api/products/${id}`),

  create: (data: CreateProductInput) =>
    apiRequest<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateProductInput) =>
    apiRequest<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archive: (id: number, is_archived: boolean) =>
    apiRequest<Product>(`/api/products/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ is_archived }),
    }),

  generateSku: (category: string, name: string) => {
    const params = new URLSearchParams({ category, name });
    return apiRequest<{ sku: string }>(`/api/products/generate-sku?${params.toString()}`);
  },

  getAlerts: () =>
    apiRequest<{
      lowStock: Product[];
      slowMovers: Product[];
    }>('/api/products/alerts'),
};
