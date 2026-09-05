/**
 * analyticsService.ts
 *
 * Deterministic, rule-based analytics engine over posted ledger entries and document lines.
 * Strictly NOT AI, NOT ML. No models, no forecasts, no intelligence.
 * All figures computed from live database rows.
 * Money: DECIMAL(14,2) in SQL, decimal.js in JS, strings across the wire.
 */

import { pool } from '../db/pool';
import { PurchaseOrderService } from './purchaseOrderService';
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

/* ── Phase 3 Types: Customer & Receivables Intelligence ────────────────── */

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

/* ── Legacy Trend & Expense Types (Preserved for compatibility) ────────── */

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

/* ═════════════════════════════════════════════════════════════════════════
   PHASE 1: Product Profitability (The Loss-Finder)
   ═════════════════════════════════════════════════════════════════════════ */

export async function getProductProfitability(params: {
  from?: string;
  to?: string;
}): Promise<ProductProfitabilityRow[]> {
  const { from, to } = params;

  const res = await pool.query<{
    product_id: number;
    product_name: string;
    sku: string | null;
    category: string | null;
    cost_price: string;
    units_sold: string;
    revenue: string;
    cogs: string;
    gross_margin: string;
    margin_pct: string;
    avg_sale_price: string;
    invoice_count: number;
  }>(
    `
    SELECT
      p.id                                                                  AS product_id,
      p.name                                                                AS product_name,
      p.sku,
      p.category,
      p.cost_price::numeric(14,2)::text                                     AS cost_price,
      COALESCE(SUM(cil.qty), 0)::numeric(14,2)::text                       AS units_sold,
      COALESCE(SUM(cil.subtotal), 0)::numeric(14,2)::text                  AS revenue,
      COALESCE(SUM(cil.qty * p.cost_price), 0)::numeric(14,2)::text        AS cogs,
      (COALESCE(SUM(cil.subtotal), 0) - COALESCE(SUM(cil.qty * p.cost_price), 0))
        ::numeric(14,2)::text                                               AS gross_margin,
      CASE
        WHEN COALESCE(SUM(cil.subtotal), 0) = 0 THEN '0.00'
        ELSE ROUND(
          (COALESCE(SUM(cil.subtotal), 0) - COALESCE(SUM(cil.qty * p.cost_price), 0))
          / NULLIF(COALESCE(SUM(cil.subtotal), 0), 0) * 100, 2
        )::numeric(6,2)::text
      END                                                                   AS margin_pct,
      CASE
        WHEN COALESCE(SUM(cil.qty), 0) = 0 THEN '0.00'
        ELSE ROUND(
          COALESCE(SUM(cil.subtotal), 0) / NULLIF(COALESCE(SUM(cil.qty), 0), 0), 2
        )::numeric(14,2)::text
      END                                                                   AS avg_sale_price,
      COUNT(DISTINCT ci.id)::int                                            AS invoice_count
    FROM products p
    JOIN customer_invoice_lines cil ON cil.product_id = p.id
    JOIN customer_invoices ci
      ON ci.id = cil.invoice_id
      AND ci.status = 'confirmed'
      ${from ? 'AND ci.invoice_date >= $1::date' : ''}
      ${to ? `AND ci.invoice_date <= $${from ? 2 : 1}::date` : ''}
    WHERE p.is_archived = false
    GROUP BY p.id, p.name, p.sku, p.category, p.cost_price
    ORDER BY
      CASE
        WHEN COALESCE(SUM(cil.subtotal), 0) = 0 THEN 0
        ELSE (COALESCE(SUM(cil.subtotal), 0) - COALESCE(SUM(cil.qty * p.cost_price), 0))
             / NULLIF(COALESCE(SUM(cil.subtotal), 0), 0) * 100
      END ASC
    `,
    [from, to].filter(Boolean)
  );

  return res.rows.map((r) => {
    const margin = new Decimal(r.margin_pct || '0');
    let flag: 'loss' | 'thin' | 'healthy';
    if (margin.lt(0)) {
      flag = 'loss';
    } else if (margin.lte(15)) {
      flag = 'thin';
    } else {
      flag = 'healthy';
    }

    return {
      productId: r.product_id,
      productName: r.product_name,
      sku: r.sku,
      category: r.category,
      costPrice: r.cost_price,
      unitsSold: r.units_sold,
      revenue: r.revenue,
      cogs: r.cogs,
      grossMargin: r.gross_margin,
      marginPct: r.margin_pct,
      avgSalePrice: r.avg_sale_price,
      flag,
      invoiceCount: r.invoice_count,
    };
  });
}

/**
 * Product invoice drilldown: invoices behind product profitability.
 */
export async function getProductInvoices(
  productId: number,
  params: { from?: string; to?: string }
): Promise<ProductInvoiceDrilldownRow[]> {
  const { from, to } = params;

  const res = await pool.query<{
    invoice_id: number;
    invoice_number: string;
    invoice_date: string;
    customer_id: number;
    customer_name: string;
    qty: string;
    unit_price: string;
    subtotal: string;
    cost_price: string;
    cogs: string;
    gross_margin: string;
    margin_pct: string;
  }>(
    `
    SELECT
      ci.id                                                            AS invoice_id,
      ci.number                                                        AS invoice_number,
      ci.invoice_date::text                                            AS invoice_date,
      ci.customer_id,
      c.name                                                           AS customer_name,
      cil.qty::numeric(14,2)::text                                     AS qty,
      cil.unit_price::numeric(14,2)::text                              AS unit_price,
      cil.subtotal::numeric(14,2)::text                                AS subtotal,
      p.cost_price::numeric(14,2)::text                                AS cost_price,
      (cil.qty * p.cost_price)::numeric(14,2)::text                    AS cogs,
      (cil.subtotal - (cil.qty * p.cost_price))::numeric(14,2)::text   AS gross_margin,
      CASE
        WHEN cil.subtotal = 0 THEN '0.00'
        ELSE ROUND(
          (cil.subtotal - (cil.qty * p.cost_price)) / NULLIF(cil.subtotal, 0) * 100, 2
        )::numeric(6,2)::text
      END                                                              AS margin_pct
    FROM customer_invoice_lines cil
    JOIN customer_invoices ci ON ci.id = cil.invoice_id
    JOIN products p ON p.id = cil.product_id
    JOIN contacts c ON c.id = ci.customer_id
    WHERE cil.product_id = $1
      AND ci.status = 'confirmed'
      ${from ? 'AND ci.invoice_date >= $2::date' : ''}
      ${to ? `AND ci.invoice_date <= $${from ? 3 : 2}::date` : ''}
    ORDER BY ci.invoice_date DESC, ci.id DESC
    `,
    [productId, from, to].filter(Boolean)
  );

  return res.rows.map((r) => ({
    invoiceId: r.invoice_id,
    invoiceNumber: r.invoice_number,
    invoiceDate: r.invoice_date,
    customerId: r.customer_id,
    customerName: r.customer_name,
    qty: r.qty,
    unitPrice: r.unit_price,
    subtotal: r.subtotal,
    costPrice: r.cost_price,
    cogs: r.cogs,
    grossMargin: r.gross_margin,
    marginPct: r.margin_pct,
  }));
}

/* ═════════════════════════════════════════════════════════════════════════
   PHASE 2: ABC, Velocity, Dead Stock, GMROI, Linear Trend
   ═════════════════════════════════════════════════════════════════════════ */

export async function getInventoryAnalytics(params: {
  from?: string;
  to?: string;
}): Promise<InventoryAnalyticsResponse> {
  const { from, to } = params;

  // 1. Fetch products with sales and stock
  const query = `
    WITH sales AS (
      SELECT
        cil.product_id,
        COALESCE(SUM(cil.qty), 0)                                     AS units_sold,
        COALESCE(SUM(cil.subtotal), 0)                                AS revenue,
        COALESCE(SUM(cil.qty * p.cost_price), 0)                      AS cogs,
        MAX(ci.invoice_date)                                          AS last_sale_date,
        MIN(ci.invoice_date)                                          AS first_sale_date
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed'
      JOIN products p ON p.id = cil.product_id
      WHERE 1=1
        ${from ? 'AND ci.invoice_date >= $1::date' : ''}
        ${to ? `AND ci.invoice_date <= $${from ? 2 : 1}::date` : ''}
      GROUP BY cil.product_id
    ),
    stock AS (
      SELECT product_id, COALESCE(SUM(qty_change), 0) AS stock_qty
      FROM stock_moves
      GROUP BY product_id
    ),
    date_span AS (
      SELECT
        COALESCE(
          (MAX(invoice_date) - MIN(invoice_date))::numeric / 30.0,
          4.0
        ) AS months_count
      FROM customer_invoices
      WHERE status = 'confirmed'
        ${from ? 'AND invoice_date >= $1::date' : ''}
        ${to ? `AND invoice_date <= $${from ? 2 : 1}::date` : ''}
    )
    SELECT
      p.id                                                            AS product_id,
      p.name                                                          AS product_name,
      p.sku,
      p.category,
      p.cost_price::numeric(14,2)::text                               AS cost_price,
      COALESCE(s.stock_qty, 0)::numeric(14,2)::text                   AS stock_qty,
      COALESCE(sl.units_sold, 0)::numeric(14,2)::text                 AS units_sold,
      COALESCE(sl.revenue, 0)::numeric(14,2)::text                    AS revenue,
      COALESCE(sl.cogs, 0)::numeric(14,2)::text                       AS cogs,
      (COALESCE(sl.revenue, 0) - COALESCE(sl.cogs, 0))::numeric(14,2)::text AS gross_margin,
      sl.last_sale_date::text                                         AS last_sale_date,
      CASE
        WHEN sl.last_sale_date IS NULL THEN NULL
        ELSE (CURRENT_DATE - sl.last_sale_date)::int
      END                                                             AS days_since_last_sale,
      GREATEST(1.0, ROUND((SELECT months_count FROM date_span), 2))::numeric(6,2)::text AS period_months
    FROM products p
    LEFT JOIN sales sl ON sl.product_id = p.id
    LEFT JOIN stock s ON s.product_id = p.id
    WHERE p.is_archived = false
      AND p.type = 'goods'
    ORDER BY COALESCE(sl.revenue, 0) DESC, p.id ASC
  `;

  const res = await pool.query<{
    product_id: number;
    product_name: string;
    sku: string | null;
    category: string | null;
    cost_price: string;
    stock_qty: string;
    units_sold: string;
    revenue: string;
    cogs: string;
    gross_margin: string;
    last_sale_date: string | null;
    days_since_last_sale: number | null;
    period_months: string;
  }>(query, [from, to].filter(Boolean));

  // 2. Fetch monthly revenue per product for linear slope (last 4 months)
  const monthlyRes = await pool.query<{
    product_id: number;
    month_index: number;
    month_revenue: string;
  }>(`
    WITH month_series AS (
      SELECT
        s.n AS month_index,
        to_char(date_trunc('month', CURRENT_DATE) - ((3 - s.n) || ' month')::interval, 'YYYY-MM') AS month_str
      FROM generate_series(0, 3) AS s(n)
    )
    SELECT
      cil.product_id,
      ms.month_index,
      COALESCE(SUM(cil.subtotal), 0)::numeric(14,2)::text AS month_revenue
    FROM month_series ms
    JOIN customer_invoices ci
      ON to_char(ci.invoice_date, 'YYYY-MM') = ms.month_str
      AND ci.status = 'confirmed'
    JOIN customer_invoice_lines cil ON cil.invoice_id = ci.id
    GROUP BY cil.product_id, ms.month_index
  `);

  const monthlyMap: Record<number, Record<number, Decimal>> = {};
  for (const row of monthlyRes.rows) {
    if (!monthlyMap[row.product_id]) monthlyMap[row.product_id] = {};
    monthlyMap[row.product_id][row.month_index] = new Decimal(row.month_revenue);
  }

  // 3. Compute ABC Classification (Pareto) & metrics
  let totalRevenue = new Decimal(0);
  for (const r of res.rows) {
    totalRevenue = totalRevenue.plus(new Decimal(r.revenue || '0'));
  }

  let runningRevenue = new Decimal(0);
  let countA = 0;
  let countB = 0;
  let countC = 0;
  let revenueA = new Decimal(0);
  let revenueB = new Decimal(0);
  let revenueC = new Decimal(0);

  const periodMonths = res.rows.length > 0 ? parseFloat(res.rows[0].period_months) || 4 : 4;

  const items: InventoryItemAnalytics[] = res.rows.map((r) => {
    const rev = new Decimal(r.revenue || '0');
    const costPrice = new Decimal(r.cost_price || '0');
    const stockQty = new Decimal(r.stock_qty || '0');
    const grossMargin = new Decimal(r.gross_margin || '0');
    const unitsSold = new Decimal(r.units_sold || '0');

    // Running cumulative
    const prevRunning = runningRevenue;
    runningRevenue = runningRevenue.plus(rev);
    const cumRevenueStr = runningRevenue.toFixed(2);
    const cumPct = totalRevenue.gt(0)
      ? runningRevenue.div(totalRevenue).times(100)
      : new Decimal(100);

    // Pareto A (0-80%), B (80-95%), C (95-100%)
    const priorPct = totalRevenue.gt(0)
      ? prevRunning.div(totalRevenue).times(100)
      : new Decimal(0);

    let abcClass: 'A' | 'B' | 'C';
    if (priorPct.lt(80)) {
      abcClass = 'A';
      countA++;
      revenueA = revenueA.plus(rev);
    } else if (priorPct.lt(95)) {
      abcClass = 'B';
      countB++;
      revenueB = revenueB.plus(rev);
    } else {
      abcClass = 'C';
      countC++;
      revenueC = revenueC.plus(rev);
    }

    // Velocity
    const unitsPerMonth = unitsSold.div(new Decimal(periodMonths)).toFixed(2);
    const daysSince = r.days_since_last_sale;

    // Dead Stock: zero sales in period OR days_since_last_sale > 60
    const isDeadStock = unitsSold.eq(0) || (daysSince !== null && daysSince > 60);
    const tiedUpCapital = stockQty.gt(0) ? stockQty.times(costPrice).toFixed(2) : '0.00';

    // GMROI = gross_margin / NULLIF(avg_inventory_cost, 0)
    const avgInventoryCost = stockQty.gt(0) ? stockQty.times(costPrice) : new Decimal(0);
    let gmroiStr: string | null = null;
    let gmroiFlag: 'poor_return' | 'acceptable' | 'no_stock' = 'no_stock';

    if (avgInventoryCost.gt(0)) {
      const gmroiVal = grossMargin.div(avgInventoryCost);
      gmroiStr = gmroiVal.toFixed(2);
      if (gmroiVal.lt(1.0)) {
        gmroiFlag = 'poor_return';
      } else {
        gmroiFlag = 'acceptable';
      }
    } else {
      gmroiFlag = 'no_stock';
    }

    // Linear trend (least-squares slope over 4 months: x = 0, 1, 2, 3)
    const pMonths = monthlyMap[r.product_id] || {};
    const y0 = pMonths[0] ? pMonths[0].toNumber() : 0;
    const y1 = pMonths[1] ? pMonths[1].toNumber() : 0;
    const y2 = pMonths[2] ? pMonths[2].toNumber() : 0;
    const y3 = pMonths[3] ? pMonths[3].toNumber() : 0;

    // x = [0, 1, 2, 3], N=4, sum(x)=6, sum(x^2)=14, denom = 4*14 - 6*6 = 20
    const sumY = y0 + y1 + y2 + y3;
    const sumXY = 0 * y0 + 1 * y1 + 2 * y2 + 3 * y3;
    const slope = (4 * sumXY - 6 * sumY) / 20;

    let linearTrend: 'rising' | 'flat' | 'declining';
    if (slope > 500) {
      linearTrend = 'rising';
    } else if (slope < -500) {
      linearTrend = 'declining';
    } else {
      linearTrend = 'flat';
    }

    return {
      productId: r.product_id,
      productName: r.product_name,
      sku: r.sku,
      category: r.category,
      costPrice: r.cost_price,
      stockQty: r.stock_qty,
      unitsSold: r.units_sold,
      revenue: r.revenue,
      cogs: r.cogs,
      grossMargin: r.gross_margin,
      cumRevenue: cumRevenueStr,
      cumRevenuePct: cumPct.toFixed(2),
      abcClass,
      unitsPerMonth,
      daysSinceLastSale: daysSince,
      isDeadStock,
      tiedUpCapital,
      avgInventoryCost: avgInventoryCost.toFixed(2),
      gmroi: gmroiStr,
      gmroiFlag,
      linearTrend,
      trendSlope: slope.toFixed(2),
    };
  });

  const deadStock = items
    .filter((i) => i.isDeadStock && new Decimal(i.tiedUpCapital).gt(0))
    .sort((a, b) => new Decimal(b.tiedUpCapital).minus(new Decimal(a.tiedUpCapital)).toNumber());

  const gmroiItems = items
    .filter((i) => i.gmroi !== null)
    .sort((a, b) => new Decimal(a.gmroi || '0').minus(new Decimal(b.gmroi || '0')).toNumber());

  return {
    summary: {
      countA,
      countB,
      countC,
      totalProducts: items.length,
      revenueA: revenueA.toFixed(2),
      revenueB: revenueB.toFixed(2),
      revenueC: revenueC.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
    },
    items,
    deadStock,
    gmroiItems,
    periodMonths,
  };
}

/* ═════════════════════════════════════════════════════════════════════════
   PHASE 3: Customer & Receivables Intelligence
   ═════════════════════════════════════════════════════════════════════════ */

export async function getCustomerAnalytics(params: {
  from?: string;
  to?: string;
}): Promise<CustomerAnalyticsResponse> {
  const { from, to } = params;

  // 1. Per-customer metrics
  const custQuery = `
    WITH cust_invoices AS (
      SELECT
        ci.customer_id,
        c.name                                                              AS customer_name,
        c.email,
        c.mobile                                                            AS phone,
        COUNT(ci.id)::int                                                   AS invoice_count,
        COALESCE(SUM(ci.total), 0)::numeric(14,2)                           AS total_invoiced,
        COALESCE(
          MIN(
            CASE
              WHEN vis.payment_status != 'paid' THEN (CURRENT_DATE - ci.invoice_date)
              ELSE NULL
            END
          ), 0
        )::int                                                              AS oldest_unpaid_days
      FROM customer_invoices ci
      JOIN contacts c ON c.id = ci.customer_id
      JOIN v_invoice_status vis ON vis.invoice_id = ci.id
      WHERE ci.status = 'confirmed'
        ${from ? 'AND ci.invoice_date >= $1::date' : ''}
        ${to ? `AND ci.invoice_date <= $${from ? 2 : 1}::date` : ''}
      GROUP BY ci.customer_id, c.name, c.email, c.mobile
    ),
    cust_payments AS (
      SELECT
        ci.customer_id,
        COALESCE(SUM(pa.amount), 0)::numeric(14,2)                          AS total_paid,
        COALESCE(AVG(p.payment_date - ci.invoice_date), 0)::numeric(6,1)    AS avg_days_to_pay
      FROM payment_allocations pa
      JOIN payments p ON p.id = pa.payment_id
      JOIN customer_invoices ci ON ci.id = pa.invoice_id AND ci.status = 'confirmed'
      WHERE 1=1
        ${from ? 'AND ci.invoice_date >= $1::date' : ''}
        ${to ? `AND ci.invoice_date <= $${from ? 2 : 1}::date` : ''}
      GROUP BY ci.customer_id
    )
    SELECT
      ci.customer_id,
      ci.customer_name,
      ci.email,
      ci.phone,
      ci.invoice_count,
      ci.total_invoiced::numeric(14,2)::text                               AS total_invoiced,
      COALESCE(cp.total_paid, 0)::numeric(14,2)::text                      AS total_paid,
      (ci.total_invoiced - COALESCE(cp.total_paid, 0))::numeric(14,2)::text AS outstanding,
      COALESCE(cp.avg_days_to_pay, 0)::numeric(6,1)::text                  AS avg_days_to_pay,
      ci.oldest_unpaid_days
    FROM cust_invoices ci
    LEFT JOIN cust_payments cp ON cp.customer_id = ci.customer_id
    ORDER BY (ci.total_invoiced - COALESCE(cp.total_paid, 0)) DESC, ci.total_invoiced DESC
  `;

  const res = await pool.query<{
    customer_id: number;
    customer_name: string;
    email: string | null;
    phone: string | null;
    invoice_count: number;
    total_invoiced: string;
    total_paid: string;
    outstanding: string;
    avg_days_to_pay: string;
    oldest_unpaid_days: number;
  }>(custQuery, [from, to].filter(Boolean));

  // 2. Portfolio-level calculations
  let portfolioRevenue = new Decimal(0);
  let portfolioReceivables = new Decimal(0);

  for (const r of res.rows) {
    portfolioRevenue = portfolioRevenue.plus(new Decimal(r.total_invoiced));
    portfolioReceivables = portfolioReceivables.plus(new Decimal(r.outstanding));
  }

  // Calculate days in period
  const spanRes = await pool.query<{ days_count: number }>(`
    SELECT COALESCE(
      (MAX(invoice_date) - MIN(invoice_date) + 1)::int,
      120
    ) AS days_count
    FROM customer_invoices
    WHERE status = 'confirmed'
      ${from ? 'AND invoice_date >= $1::date' : ''}
      ${to ? `AND invoice_date <= $${from ? 2 : 1}::date` : ''}
  `, [from, to].filter(Boolean));

  const daysInPeriod = spanRes.rows[0]?.days_count || 120;

  // DSO = (total_receivables / total_revenue) * days_in_period
  const dso = portfolioRevenue.gt(0)
    ? portfolioReceivables.div(portfolioRevenue).times(daysInPeriod).toFixed(1)
    : '0.0';

  // Top 3 customer concentration
  const sortedByRevenue = [...res.rows].sort(
    (a, b) => new Decimal(b.total_invoiced).minus(new Decimal(a.total_invoiced)).toNumber()
  );
  let top3Revenue = new Decimal(0);
  for (let i = 0; i < Math.min(3, sortedByRevenue.length); i++) {
    top3Revenue = top3Revenue.plus(new Decimal(sortedByRevenue[i].total_invoiced));
  }

  const top3SharePct = portfolioRevenue.gt(0)
    ? top3Revenue.div(portfolioRevenue).times(100).toFixed(2)
    : '0.00';
  const hasConcentrationRisk = new Decimal(top3SharePct).gt(40);

  let countReliable = 0;
  let countSlow = 0;
  let countRisk = 0;

  const customers: CustomerAnalyticsRow[] = res.rows.map((r) => {
    const avgDays = parseFloat(r.avg_days_to_pay) || 0;
    const oldestUnpaid = r.oldest_unpaid_days;

    let paymentReliability: 'reliable' | 'slow' | 'risk';
    if (avgDays > 60 || oldestUnpaid >= 90) {
      paymentReliability = 'risk';
      countRisk++;
    } else if (avgDays > 30) {
      paymentReliability = 'slow';
      countSlow++;
    } else {
      paymentReliability = 'reliable';
      countReliable++;
    }

    const share = portfolioRevenue.gt(0)
      ? new Decimal(r.total_invoiced).div(portfolioRevenue).times(100).toFixed(2)
      : '0.00';

    return {
      customerId: r.customer_id,
      customerName: r.customer_name,
      email: r.email,
      phone: r.phone,
      invoiceCount: r.invoice_count,
      totalInvoiced: r.total_invoiced,
      totalPaid: r.total_paid,
      outstanding: r.outstanding,
      avgDaysToPay: r.avg_days_to_pay,
      oldestUnpaidDays: oldestUnpaid > 0 ? oldestUnpaid : null,
      paymentReliability,
      revenueShare: share,
    };
  });

  return {
    portfolio: {
      totalRevenue: portfolioRevenue.toFixed(2),
      totalReceivables: portfolioReceivables.toFixed(2),
      daysInPeriod,
      dso,
      top3Revenue: top3Revenue.toFixed(2),
      top3SharePct,
      hasConcentrationRisk,
      reliabilityCounts: {
        reliable: countReliable,
        slow: countSlow,
        risk: countRisk,
      },
    },
    customers,
  };
}

/**
 * Customer invoice drilldown: customer's invoices.
 */
export async function getCustomerInvoices(customerId: number): Promise<CustomerInvoiceDrilldownRow[]> {
  const res = await pool.query<{
    invoice_id: number;
    number: string;
    invoice_date: string;
    due_date: string | null;
    status: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    payment_status: 'paid' | 'partial' | 'not_paid';
    days_overdue: number;
  }>(`
    SELECT
      ci.id                                                             AS invoice_id,
      ci.number,
      ci.invoice_date::text                                             AS invoice_date,
      ci.due_date::text                                                 AS due_date,
      ci.status,
      ci.total::numeric(14,2)::text                                     AS total,
      vis.amount_paid::numeric(14,2)::text                              AS amount_paid,
      vis.amount_due::numeric(14,2)::text                               AS amount_due,
      vis.payment_status,
      CASE
        WHEN vis.payment_status = 'paid' THEN 0
        WHEN ci.due_date IS NOT NULL AND CURRENT_DATE > ci.due_date THEN (CURRENT_DATE - ci.due_date)::int
        ELSE GREATEST(0, (CURRENT_DATE - ci.invoice_date - 30))::int
      END                                                               AS days_overdue
    FROM customer_invoices ci
    JOIN v_invoice_status vis ON vis.invoice_id = ci.id
    WHERE ci.customer_id = $1
      AND ci.status = 'confirmed'
    ORDER BY ci.invoice_date DESC, ci.id DESC
  `, [customerId]);

  return res.rows.map((r) => ({
    invoiceId: r.invoice_id,
    number: r.number,
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    status: r.status,
    total: r.total,
    amountPaid: r.amount_paid,
    amountDue: r.amount_due,
    paymentStatus: r.payment_status,
    daysOverdue: r.days_overdue,
  }));
}

/* ═════════════════════════════════════════════════════════════════════════
   PHASE 4: Reorder Suggestions & Purchase Order Creation
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Reorder suggestions.
 * Stated assumptions (option b, rule-based, no schema mutation):
 *   - lead_time_days = 14 days (standard supplier procurement turnaround)
 *   - safety_stock = units_per_day * 7 (1-week safety buffer)
 *   - reorder_point = (units_per_day * lead_time_days) + safety_stock
 *   - suggested_qty = (units_per_day * lead_time_days * 2) - stock_qty
 */
export async function getReorderSuggestions(): Promise<ReorderSuggestionRow[]> {
  const res = await pool.query<{
    product_id: number;
    product_name: string;
    sku: string | null;
    category: string | null;
    cost_price: string;
    lead_time_days: number;
    safety_stock: string;
    stock_qty: string;
    units_sold: string;
    days_in_history: number;
    last_vendor_id: number | null;
    last_vendor_name: string | null;
  }>(`
    WITH stock AS (
      SELECT product_id, COALESCE(SUM(qty_change), 0) AS stock_qty
      FROM stock_moves
      GROUP BY product_id
    ),
    sold_history AS (
      SELECT
        cil.product_id,
        COALESCE(SUM(cil.qty), 0)                                      AS units_sold,
        GREATEST(
          1,
          COALESCE((MAX(ci.invoice_date) - MIN(ci.invoice_date) + 1)::int, 30)
        )                                                              AS days_span
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed'
      GROUP BY cil.product_id
    ),
    last_vendors AS (
      SELECT DISTINCT ON (pol.product_id)
        pol.product_id,
        po.vendor_id,
        c.name AS vendor_name
      FROM purchase_order_lines pol
      JOIN purchase_orders po ON po.id = pol.po_id
      JOIN contacts c ON c.id = po.vendor_id
      ORDER BY pol.product_id, po.order_date DESC, po.id DESC
    )
    SELECT
      p.id                                                             AS product_id,
      p.name                                                           AS product_name,
      p.sku,
      p.category,
      p.cost_price::numeric(14,2)::text                                AS cost_price,
      p.lead_time_days,
      p.safety_stock::numeric(14,2)::text                              AS safety_stock,
      COALESCE(s.stock_qty, 0)::numeric(14,2)::text                    AS stock_qty,
      COALESCE(sh.units_sold, 0)::numeric(14,2)::text                  AS units_sold,
      COALESCE(sh.days_span, 30)                                       AS days_in_history,
      lv.vendor_id                                                     AS last_vendor_id,
      lv.vendor_name                                                   AS last_vendor_name
    FROM products p
    LEFT JOIN stock s ON s.product_id = p.id
    LEFT JOIN sold_history sh ON sh.product_id = p.id
    LEFT JOIN last_vendors lv ON lv.product_id = p.id
    WHERE p.is_archived = false
      AND p.type = 'goods'
    ORDER BY COALESCE(s.stock_qty, 0) ASC, p.id ASC
  `);

  return res.rows.map((r) => {
    const stockQty = new Decimal(r.stock_qty || '0');
    const unitsSold = new Decimal(r.units_sold || '0');
    const daysSpan = Math.max(1, r.days_in_history || 30);
    const unitsPerDay = unitsSold.div(daysSpan);

    const leadTimeDays = r.lead_time_days || 14;
    const safetyStock = new Decimal(r.safety_stock || '0');
    // reorder_point = (units_per_day * lead_time_days) + safety_stock
    const reorderPoint = unitsPerDay.times(leadTimeDays).plus(safetyStock);

    const isReorderNeeded = stockQty.lt(reorderPoint) && unitsSold.gt(0);

    // suggested_qty = (units_per_day * lead_time_days * 2) - stock_qty
    let suggested = unitsPerDay.times(leadTimeDays * 2).minus(stockQty);
    if (suggested.lt(1)) suggested = new Decimal(1);

    return {
      productId: r.product_id,
      productName: r.product_name,
      sku: r.sku,
      category: r.category,
      stockQty: r.stock_qty,
      costPrice: r.cost_price,
      unitsSold: r.units_sold,
      unitsPerDay: unitsPerDay.toFixed(2),
      leadTimeDays: leadTimeDays,
      safetyStock: safetyStock.toFixed(2),
      reorderPoint: reorderPoint.toFixed(2),
      suggestedQty: suggested.ceil().toFixed(0),
      isReorderNeeded,
      lastVendorId: r.last_vendor_id,
      lastVendorName: r.last_vendor_name,
    };
  });
}

/**
 * Creates a real draft Purchase Order from reorder recommendation.
 * Pre-fills: last vendor, suggested qty, cost price.
 * Confirming a PO creates NO journal entry (per Rule 4).
 */
export async function createPurchaseOrderFromReorder(params: {
  productId: number;
  qty?: number | string;
}): Promise<{ poNumber: string; poId: number; vendorName: string; total: string }> {
  const { productId } = params;

  // 1. Get product details
  const prodRes = await pool.query<{
    id: number;
    name: string;
    cost_price: string;
  }>(`SELECT id, name, cost_price FROM products WHERE id = $1`, [productId]);

  if (prodRes.rows.length === 0) {
    throw new Error(`Product ${productId} not found`);
  }
  const product = prodRes.rows[0];

  // 2. Get last vendor from purchase history, or fallback to first vendor
  const vendorRes = await pool.query<{ vendor_id: number; vendor_name: string }>(`
    SELECT po.vendor_id, c.name AS vendor_name
    FROM purchase_order_lines pol
    JOIN purchase_orders po ON po.id = pol.po_id
    JOIN contacts c ON c.id = po.vendor_id
    WHERE pol.product_id = $1
    ORDER BY po.order_date DESC, po.id DESC
    LIMIT 1
  `, [productId]);

  let vendorId: number;
  let vendorName: string;

  if (vendorRes.rows.length > 0) {
    vendorId = vendorRes.rows[0].vendor_id;
    vendorName = vendorRes.rows[0].vendor_name;
  } else {
    // Fallback to first available vendor contact
    const fallbackVendor = await pool.query<{ id: number; name: string }>(`
      SELECT id, name FROM contacts WHERE type = 'vendor' AND is_archived = false ORDER BY id ASC LIMIT 1
    `);
    if (fallbackVendor.rows.length === 0) {
      throw new Error('No vendor contact found in system');
    }
    vendorId = fallbackVendor.rows[0].id;
    vendorName = fallbackVendor.rows[0].name;
  }

  // 3. Determine quantity
  let orderQty = params.qty ? new Decimal(params.qty) : new Decimal(10);
  if (orderQty.lte(0)) orderQty = new Decimal(10);

  // 4. Create draft PO
  const createdPO = await PurchaseOrderService.create({
    vendorId,
    lines: [
      {
        productId,
        qty: orderQty.toNumber(),
        unitPrice: new Decimal(product.cost_price).toNumber(),
      },
    ],
  });

  return {
    poId: createdPO.id,
    poNumber: createdPO.number,
    vendorName,
    total: createdPO.total,
  };
}

/* ═════════════════════════════════════════════════════════════════════════
   LEGACY / COMPATIBILITY EXPORTS
   ═════════════════════════════════════════════════════════════════════════ */

export async function getProductPerformance(params: {
  from?: string;
  to?: string;
}) {
  return getProductProfitability(params);
}

export async function getRevenueTrend(params: {
  months?: number;
}): Promise<RevenueTrendMonth[]> {
  const months = Math.max(1, Math.min(24, params.months ?? 6));

  const res = await pool.query<{
    month: string;
    revenue: string;
    cogs: string;
    gross_profit: string;
    invoice_count: number;
  }>(
    `
    WITH months AS (
      SELECT to_char(
        date_trunc('month', now()) - (s.n || ' month')::interval,
        'YYYY-MM'
      ) AS month
      FROM generate_series(0, $1 - 1) AS s(n)
    ),
    actuals AS (
      SELECT
        to_char(ci.invoice_date, 'YYYY-MM')                                AS month,
        COALESCE(SUM(cil.subtotal), 0)::numeric(14,2)                     AS revenue,
        COALESCE(SUM(cil.qty * p.cost_price), 0)::numeric(14,2)           AS cogs,
        COUNT(DISTINCT ci.id)::int                                         AS invoice_count
      FROM customer_invoices ci
      JOIN customer_invoice_lines cil ON cil.invoice_id = ci.id
      JOIN products p ON p.id = cil.product_id
      WHERE ci.status = 'confirmed'
        AND ci.invoice_date >= (date_trunc('month', now()) - ($1 || ' month')::interval)
      GROUP BY to_char(ci.invoice_date, 'YYYY-MM')
    )
    SELECT
      m.month,
      COALESCE(a.revenue, 0)::numeric(14,2)::text                         AS revenue,
      COALESCE(a.cogs, 0)::numeric(14,2)::text                            AS cogs,
      (COALESCE(a.revenue, 0) - COALESCE(a.cogs, 0))::numeric(14,2)::text AS gross_profit,
      COALESCE(a.invoice_count, 0)                                        AS invoice_count
    FROM months m
    LEFT JOIN actuals a ON a.month = m.month
    ORDER BY m.month ASC
    `,
    [months]
  );

  return res.rows.map((r) => ({
    month: r.month,
    revenue: r.revenue,
    cogs: r.cogs,
    grossProfit: r.gross_profit,
    invoiceCount: r.invoice_count,
  }));
}

export async function getExpenseBreakdown(params: {
  from?: string;
  to?: string;
}): Promise<ExpenseBreakdownRow[]> {
  const { from, to } = params;

  const res = await pool.query<{
    account_id: number;
    account_name: string;
    account_type: string;
    total: string;
    pct: string;
  }>(
    `
    WITH expense_lines AS (
      SELECT
        a.id      AS account_id,
        a.name    AS account_name,
        a.type    AS account_type,
        jel.debit AS amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.entry_id AND je.status = 'posted'
      JOIN accounts a ON a.id = jel.account_id
      WHERE a.type IN ('expense', 'other_expense')
        AND jel.debit > 0
        ${from ? 'AND je.entry_date >= $1::date' : ''}
        ${to ? `AND je.entry_date <= $${from ? 2 : 1}::date` : ''}
    ),
    totals AS (
      SELECT COALESCE(SUM(amount), 0) AS grand_total FROM expense_lines
    )
    SELECT
      e.account_id,
      e.account_name,
      e.account_type,
      COALESCE(SUM(e.amount), 0)::numeric(14,2)::text                             AS total,
      CASE WHEN t.grand_total = 0 THEN '0.00'
           ELSE ROUND(COALESCE(SUM(e.amount), 0) / t.grand_total * 100, 2)::numeric(6,2)::text
      END                                                                         AS pct
    FROM expense_lines e, totals t
    GROUP BY e.account_id, e.account_name, e.account_type, t.grand_total
    ORDER BY COALESCE(SUM(e.amount), 0) DESC
    `,
    [from, to].filter(Boolean)
  );

  return res.rows.map((r) => ({
    accountId: r.account_id,
    accountName: r.account_name,
    accountType: r.account_type,
    total: r.total,
    pct: r.pct,
  }));
}
