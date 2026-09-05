/**
 * analytics.api.ts
 *
 * Two concerns in one file:
 *   1. Analytic Account CRUD (used by AnalyticListPage, AnalyticFormPage etc.)
 *   2. Business Analytics Engine (used by AnalyticsPage)
 *
 * The existing pages import `AnalyticsApi.getAll / getById / create / update`
 * so those methods are preserved exactly.
 */

import api from '../lib/axios';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';

/* ── Business Analytics types ────────────────────────────────────────── */

export interface ProductPerformanceRow {
  productId: number;
  productName: string;
  category: string | null;
  unitsSold: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPct: string;
  invoiceCount: number;
}

export interface RevenueTrendMonth {
  month: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  invoiceCount: number;
}

export interface ExpenseBreakdownRow {
  accountId: number;
  accountName: string;
  accountType: string;
  total: string;
  pct: string;
}

export interface ReorderRow {
  productId: number;
  productName: string;
  sku: string | null;
  category: string | null;
  stockQty: string;
  avgDailySales: string;
  sevenDayVelocity: string;
  reorderPoint: string;
  action: 'reorder' | 'ok' | 'no_movement';
}

/* ── Combined API object ─────────────────────────────────────────────── */

export const AnalyticsApi = {
  /* ── Analytic Account CRUD (existing consumers) ── */

  getAll: async (includeArchived = false, type = 'all'): Promise<AnalyticAccount[]> => {
    const res = await api.get<{ data: AnalyticAccount[]; error: unknown }>(
      '/api/analytic-accounts',
      { params: { includeArchived, type } }
    );
    return res.data?.data ?? [];
  },

  getById: async (id: number): Promise<AnalyticAccount> => {
    const res = await api.get<{ data: AnalyticAccount; error: unknown }>(
      `/api/analytic-accounts/${id}`
    );
    if (!res.data?.data) throw new Error('Analytic account not found');
    return res.data.data;
  },

  create: async (payload: Partial<AnalyticAccount>): Promise<AnalyticAccount> => {
    const res = await api.post<{ data: AnalyticAccount; error: unknown }>(
      '/api/analytic-accounts',
      payload
    );
    if (!res.data?.data) throw new Error('Failed to create analytic account');
    return res.data.data;
  },

  update: async (id: number, payload: Partial<AnalyticAccount>): Promise<AnalyticAccount> => {
    const res = await api.put<{ data: AnalyticAccount; error: unknown }>(
      `/api/analytic-accounts/${id}`,
      payload
    );
    if (!res.data?.data) throw new Error('Failed to update analytic account');
    return res.data.data;
  },

  archive: async (id: number, isArchived: boolean): Promise<AnalyticAccount> => {
    const res = await api.patch<{ data: AnalyticAccount; error: unknown }>(
      `/api/analytic-accounts/${id}/archive`,
      { is_archived: isArchived }
    );
    if (!res.data?.data) throw new Error('Failed to archive analytic account');
    return res.data.data;
  },

  /* ── Business Analytics Engine ── */

  getProductPerformance: async (from?: string, to?: string): Promise<ProductPerformanceRow[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: ProductPerformanceRow[]; error: unknown }>(
      '/api/analytics/products',
      { params }
    );
    return res.data?.data ?? [];
  },

  getRevenueTrend: async (months = 6): Promise<RevenueTrendMonth[]> => {
    const res = await api.get<{ data: RevenueTrendMonth[]; error: unknown }>(
      '/api/analytics/revenue-trend',
      { params: { months } }
    );
    return res.data?.data ?? [];
  },

  getExpenseBreakdown: async (from?: string, to?: string): Promise<ExpenseBreakdownRow[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: ExpenseBreakdownRow[]; error: unknown }>(
      '/api/analytics/expenses',
      { params }
    );
    return res.data?.data ?? [];
  },

  getReorderSuggestions: async (): Promise<ReorderRow[]> => {
    const res = await api.get<{ data: ReorderRow[]; error: unknown }>('/api/analytics/reorder');
    return res.data?.data ?? [];
  },
};
