/**
 * analytics.api.ts
 *
 * Two concerns in one file:
 *   1. Analytic Account CRUD (used by AnalyticListPage, AnalyticFormPage etc.)
 *   2. Rule-Based Business Analytics Engine (used by AnalyticsPage)
 *
 * The existing pages import `AnalyticsApi.getAll / getById / create / update / archive`
 * so those methods are preserved exactly.
 */

import api from '../lib/axios';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';
import Decimal from 'decimal.js';

/* ── Phase 1 Types: Product Profitability ──────────────────────────────── */

export interface ProductProfitabilityRow {
  productId: number;
  productName: string;
  sku: string | null;
  category: string | null;
  costPrice: string;
  unitsSold: string;
  revenue: string;
  cogs: string;
  grossMargin: string;
  marginPct: string;
  avgSalePrice: string;
  flag: 'loss' | 'thin' | 'healthy';
  invoiceCount: number;
}

export interface ProductInvoiceDrilldownRow {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  customerName: string;
  qty: string;
  unitPrice: string;
  subtotal: string;
  costPrice: string;
  cogs: string;
  grossMargin: string;
  marginPct: string;
}

/* ── Phase 2 Types: Inventory, ABC, Velocity, Dead Stock, GMROI ────────── */

export interface AbcSummary {
  countA: number;
  countB: number;
  countC: number;
  totalProducts: number;
  revenueA: string;
  revenueB: string;
  revenueC: string;
  totalRevenue: string;
}

export interface InventoryItemAnalytics {
  productId: number;
  productName: string;
  sku: string | null;
  category: string | null;
  costPrice: string;
  stockQty: string;
  unitsSold: string;
  revenue: string;
  cogs: string;
  grossMargin: string;
  cumRevenue: string;
  cumRevenuePct: string;
  abcClass: 'A' | 'B' | 'C';
  unitsPerMonth: string;
  daysSinceLastSale: number | null;
  isDeadStock: boolean;
  tiedUpCapital: string;
  avgInventoryCost: string;
  gmroi: string | null;
  gmroiFlag: 'poor_return' | 'acceptable' | 'no_stock';
  linearTrend: 'rising' | 'flat' | 'declining';
  trendSlope: string;
}

export interface InventoryAnalyticsResponse {
  summary: AbcSummary;
  items: InventoryItemAnalytics[];
  deadStock: InventoryItemAnalytics[];
  gmroiItems: InventoryItemAnalytics[];
  periodMonths: number;
}

/* ── Phase 3 Types: Customer & Receivables Analytics ───────────────────── */

export interface CustomerAnalyticsRow {
  customerId: number;
  customerName: string;
  email: string | null;
  phone: string | null;
  invoiceCount: number;
  totalInvoiced: string;
  totalPaid: string;
  outstanding: string;
  avgDaysToPay: string;
  oldestUnpaidDays: number | null;
  paymentReliability: 'reliable' | 'slow' | 'risk';
  revenueShare: string;
}

export interface CustomerAnalyticsPortfolio {
  totalRevenue: string;
  totalReceivables: string;
  daysInPeriod: number;
  dso: string;
  top3Revenue: string;
  top3SharePct: string;
  hasConcentrationRisk: boolean;
  reliabilityCounts: {
    reliable: number;
    slow: number;
    risk: number;
  };
}

export interface CustomerAnalyticsResponse {
  portfolio: CustomerAnalyticsPortfolio;
  customers: CustomerAnalyticsRow[];
}

export interface CustomerInvoiceDrilldownRow {
  invoiceId: number;
  number: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: 'paid' | 'partial' | 'not_paid';
  daysOverdue: number;
}

/* ── Phase 4 Types: Reorder Suggestions ────────────────────────────────── */

export interface ReorderSuggestionRow {
  productId: number;
  productName: string;
  sku: string | null;
  category: string | null;
  stockQty: string;
  costPrice: string;
  unitsSold: string;
  unitsPerDay: string;
  leadTimeDays: number;
  safetyStock: string;
  reorderPoint: string;
  suggestedQty: string;
  isReorderNeeded: boolean;
  lastVendorId: number | null;
  lastVendorName: string | null;
}

export interface CreatedPOResult {
  poId: number;
  poNumber: string;
  vendorName: string;
  total: string;
}

/* ── Legacy Types (Preserved for compatibility) ────────────────────────── */

export type ProductPerformanceRow = ProductProfitabilityRow;

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

/* ── Combined API Object ───────────────────────────────────────────────── */

export const AnalyticsApi = {
  /* ── 1. Analytic Account CRUD (existing consumers) ── */

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

  /* ── 2. Business Analytics Engine (Deterministic / Rule-Based) ── */

  // Phase 1: Products
  getProducts: async (from?: string, to?: string): Promise<ProductProfitabilityRow[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: ProductProfitabilityRow[]; error: unknown }>(
      '/api/analytics/products',
      { params }
    );
    return res.data?.data ?? [];
  },

  getProductInvoices: async (
    productId: number,
    from?: string,
    to?: string
  ): Promise<ProductInvoiceDrilldownRow[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: ProductInvoiceDrilldownRow[]; error: unknown }>(
      `/api/analytics/products/${productId}/invoices`,
      { params }
    );
    return res.data?.data ?? [];
  },

  // Phase 2: Inventory
  getInventory: async (from?: string, to?: string): Promise<InventoryAnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: InventoryAnalyticsResponse; error: unknown }>(
      '/api/analytics/inventory',
      { params }
    );
    return (
      res.data?.data ?? {
        summary: {
          countA: 0,
          countB: 0,
          countC: 0,
          totalProducts: 0,
          revenueA: '0.00',
          revenueB: '0.00',
          revenueC: '0.00',
          totalRevenue: '0.00',
        },
        items: [],
        deadStock: [],
        gmroiItems: [],
        periodMonths: 4,
      }
    );
  },

  // Phase 3: Customers
  getCustomers: async (from?: string, to?: string): Promise<CustomerAnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get<{ data: CustomerAnalyticsResponse; error: unknown }>(
      '/api/analytics/customers',
      { params }
    );
    return (
      res.data?.data ?? {
        portfolio: {
          totalRevenue: '0.00',
          totalReceivables: '0.00',
          daysInPeriod: 120,
          dso: '0.0',
          top3Revenue: '0.00',
          top3SharePct: '0.00',
          hasConcentrationRisk: false,
          reliabilityCounts: { reliable: 0, slow: 0, risk: 0 },
        },
        customers: [],
      }
    );
  },

  getCustomerInvoices: async (customerId: number): Promise<CustomerInvoiceDrilldownRow[]> => {
    const res = await api.get<{ data: CustomerInvoiceDrilldownRow[]; error: unknown }>(
      `/api/analytics/customers/${customerId}/invoices`
    );
    return res.data?.data ?? [];
  },

  // Phase 4: Reorder
  getReorder: async (): Promise<ReorderSuggestionRow[]> => {
    const res = await api.get<{ data: ReorderSuggestionRow[]; error: unknown }>(
      '/api/analytics/reorder'
    );
    return res.data?.data ?? [];
  },

  createReorderPO: async (productId: number, qty?: number): Promise<CreatedPOResult> => {
    const res = await api.post<{ data: CreatedPOResult; error: unknown }>(
      '/api/analytics/reorder/create-po',
      { productId, qty }
    );
    if (!res.data?.data) throw new Error('Failed to create purchase order');
    return res.data.data;
  },

  // Compatibility aliases
  getProductPerformance: async (from?: string, to?: string): Promise<ProductProfitabilityRow[]> => {
    return AnalyticsApi.getProducts(from, to);
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
    const suggestions = await AnalyticsApi.getReorder();
    return suggestions.map((s) => ({
      productId: s.productId,
      productName: s.productName,
      sku: s.sku,
      category: s.category,
      stockQty: s.stockQty,
      avgDailySales: s.unitsPerDay,
      sevenDayVelocity: new Decimal(s.unitsPerDay).times(7).toFixed(2),
      reorderPoint: s.reorderPoint,
      action: s.isReorderNeeded ? 'reorder' : 'ok',
    }));
  },
};
