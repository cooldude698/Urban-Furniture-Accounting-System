import { apiRequest } from './client';
import { Product, CreateProductInput, UpdateProductInput } from '@shared/schemas/product.schema';

export interface InventoryAnalytics {
  fastMoving: {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    sales_price: string;
    stock_qty: string;
    units_sold: number;
    move_count: number;
    velocity_status: 'high_velocity' | 'steady';
  }[];
  slowMoving: {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    sales_price: string;
    cost_price: string;
    stock_qty: string;
    units_sold: number;
    clearance_recommended: boolean;
    clearance_discount_pct: number;
  }[];
  locationBreakdown: {
    location_name: string;
    code: string;
    total_units: number;
    percentage: number;
  }[];
  summary: {
    totalCatalogItems: number;
    totalStockUnits: number;
    fastMoverCount: number;
    slowMoverCount: number;
  };
}

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

  generateSku: (category: string, name: string, year?: string) => {
    const params = new URLSearchParams({ category, name });
    if (year) params.set('year', year);
    return apiRequest<{ sku: string }>(`/api/products/generate-sku?${params.toString()}`);
  },

  getAlerts: () =>
    apiRequest<{
      lowStock: Product[];
      slowMovers: Product[];
    }>('/api/products/alerts'),

  getInventoryAnalytics: () =>
    apiRequest<InventoryAnalytics>('/api/products/inventory-analytics'),
};
