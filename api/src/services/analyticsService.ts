/**
 * analyticsService.ts
 *
 * Rule-based analytics engine — NOT AI, NOT ML.
 * Every figure is a deterministic formula over live DB rows.
 * Money in SQL: DECIMAL(14,2). Across the wire: strings.
 */

import { pool } from '../db/pool';

/* ── Types ─────────────────────────────────────────────────────────────── */

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
  month: string;        // 'YYYY-MM'
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
  avgDailySales: string;         // units sold per day (30-day window)
  sevenDayVelocity: string;      // units sold in last 7 days
  reorderPoint: string;          // 2× 7-day velocity (pure formula)
  action: 'reorder' | 'ok' | 'no_movement';
}

/* ── Phase 1: Product performance ──────────────────────────────────────── */

export async function getProductPerformance(params: {
  from?: string;
  to?: string;
}): Promise<ProductPerformanceRow[]> {
  const { from, to } = params;

  const res = await pool.query<{
    product_id: number;
    product_name: string;
    category: string | null;
    units_sold: string;
    revenue: string;
    cogs: string;
    gross_profit: string;
    gross_margin_pct: string;
    invoice_count: number;
  }>(
    `
    SELECT
      p.id                                                                  AS product_id,
      p.name                                                                AS product_name,
      p.category,
      COALESCE(SUM(cil.qty), 0)::numeric(14,2)::text                       AS units_sold,
      COALESCE(SUM(cil.subtotal), 0)::numeric(14,2)::text                  AS revenue,
      COALESCE(SUM(cil.qty * p.cost_price), 0)::numeric(14,2)::text        AS cogs,
      (COALESCE(SUM(cil.subtotal), 0) - COALESCE(SUM(cil.qty * p.cost_price), 0))
        ::numeric(14,2)::text                                               AS gross_profit,
      CASE
        WHEN COALESCE(SUM(cil.subtotal), 0) = 0 THEN '0.00'
        ELSE ROUND(
          (COALESCE(SUM(cil.subtotal), 0) - COALESCE(SUM(cil.qty * p.cost_price), 0))
          / COALESCE(SUM(cil.subtotal), 0) * 100, 2
        )::numeric(6,2)::text
      END                                                                   AS gross_margin_pct,
      COUNT(DISTINCT ci.id)::int                                            AS invoice_count
    FROM products p
    LEFT JOIN customer_invoice_lines cil ON cil.product_id = p.id
    LEFT JOIN customer_invoices ci
      ON ci.id = cil.invoice_id
      AND ci.status = 'confirmed'
      ${from ? "AND ci.invoice_date >= $1::date" : ''}
      ${to ? `AND ci.invoice_date <= $${from ? 2 : 1}::date` : ''}
    WHERE p.is_archived = false
    GROUP BY p.id, p.name, p.category
    ORDER BY COALESCE(SUM(cil.subtotal), 0) DESC
    `,
    [from, to].filter(Boolean)
  );

  return res.rows.map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    category: r.category,
    unitsSold: r.units_sold,
    revenue: r.revenue,
    cogs: r.cogs,
    grossProfit: r.gross_profit,
    grossMarginPct: r.gross_margin_pct,
    invoiceCount: r.invoice_count,
  }));
}

/* ── Phase 2: Revenue trend (month-by-month) ────────────────────────────── */

export async function getRevenueTrend(params: {
  months?: number; // default 6
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

/* ── Phase 3: Expense breakdown (by account, from posted journal lines) ─── */

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
        a.id    AS account_id,
        a.name  AS account_name,
        a.type  AS account_type,
        jel.debit AS amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.entry_id AND je.status = 'posted'
      JOIN accounts a ON a.id = jel.account_id
      WHERE a.type IN ('expense', 'other_expense')
        AND jel.debit > 0
        ${from ? "AND je.entry_date >= $1::date" : ''}
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

/* ── Phase 4: Reorder suggestions ─────────────────────────────────────── */
/*
 * Formula (fully deterministic, no ML):
 *   avg_daily_sales  = units sold in last 30 days / 30
 *   7_day_velocity   = units sold in last 7 days
 *   reorder_point    = 2 × 7_day_velocity   (2-week safety stock at current pace)
 *   action           = 'reorder' if stock_qty <= reorder_point AND 7_day_velocity > 0
 *                      'no_movement' if 7_day_velocity = 0
 *                      'ok' otherwise
 */
export async function getReorderSuggestions(): Promise<ReorderRow[]> {
  const res = await pool.query<{
    product_id: number;
    product_name: string;
    sku: string | null;
    category: string | null;
    stock_qty: string;
    avg_daily_sales: string;
    seven_day_velocity: string;
    reorder_point: string;
    action: string;
  }>(`
    WITH stock AS (
      SELECT product_id, COALESCE(SUM(qty_change), 0) AS stock_qty
      FROM stock_moves
      GROUP BY product_id
    ),
    sold_30 AS (
      SELECT cil.product_id, COALESCE(SUM(cil.qty), 0) AS qty_30
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed'
      WHERE ci.invoice_date >= (CURRENT_DATE - INTERVAL '30 days')
      GROUP BY cil.product_id
    ),
    sold_7 AS (
      SELECT cil.product_id, COALESCE(SUM(cil.qty), 0) AS qty_7
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed'
      WHERE ci.invoice_date >= (CURRENT_DATE - INTERVAL '7 days')
      GROUP BY cil.product_id
    )
    SELECT
      p.id                                                               AS product_id,
      p.name                                                             AS product_name,
      p.sku,
      p.category,
      COALESCE(s.stock_qty, 0)::numeric(12,2)::text                     AS stock_qty,
      ROUND(COALESCE(s30.qty_30, 0) / 30.0, 4)::numeric(12,4)::text    AS avg_daily_sales,
      COALESCE(s7.qty_7, 0)::numeric(12,2)::text                        AS seven_day_velocity,
      (COALESCE(s7.qty_7, 0) * 2)::numeric(12,2)::text                  AS reorder_point,
      CASE
        WHEN COALESCE(s7.qty_7, 0) = 0 THEN 'no_movement'
        WHEN COALESCE(s.stock_qty, 0) <= COALESCE(s7.qty_7, 0) * 2 THEN 'reorder'
        ELSE 'ok'
      END                                                               AS action
    FROM products p
    LEFT JOIN stock s ON s.product_id = p.id
    LEFT JOIN sold_30 s30 ON s30.product_id = p.id
    LEFT JOIN sold_7 s7 ON s7.product_id = p.id
    WHERE p.is_archived = false
      AND p.type = 'goods'
    ORDER BY
      CASE WHEN COALESCE(s7.qty_7, 0) = 0 THEN 2
           WHEN COALESCE(s.stock_qty, 0) <= COALESCE(s7.qty_7, 0) * 2 THEN 0
           ELSE 1
      END ASC,
      COALESCE(s7.qty_7, 0) DESC
  `);

  return res.rows.map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    sku: r.sku,
    category: r.category,
    stockQty: r.stock_qty,
    avgDailySales: r.avg_daily_sales,
    sevenDayVelocity: r.seven_day_velocity,
    reorderPoint: r.reorder_point,
    action: r.action as ReorderRow['action'],
  }));
}
