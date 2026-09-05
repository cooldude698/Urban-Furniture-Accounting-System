/**
 * AnalyticsPage — /analytics
 *
 * Rule-based business analytics engine. Four panels:
 *   1. Revenue Trend (bar chart — month × month)
 *   2. Product Performance table (revenue, COGS, margin %)
 *   3. Expense Breakdown (horizontal bar + table)
 *   4. Reorder Suggestions (traffic-light table)
 *
 * Design: warm cream/walnut theme per Design.md.
 * Money: decimal.js, right-aligned IBM Plex Mono.
 * No hardcoded numbers. Every figure from live DB queries.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { TrendingUp, Package, CreditCard, RefreshCcw, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import {
  AnalyticsApi,
  ProductPerformanceRow,
  RevenueTrendMonth,
  ExpenseBreakdownRow,
  ReorderRow,
} from '../../api/analytics.api';

/* ── Helpers ─────────────────────────────────────────────────────────── */

function fmt(val: string | number): string {
  const d = new Decimal(String(val) || '0');
  return '₹' + d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtShort(val: string): string {
  const d = new Decimal(val || '0');
  if (d.gte(10000000)) return '₹' + d.div(10000000).toFixed(2) + 'Cr';
  if (d.gte(100000)) return '₹' + d.div(100000).toFixed(2) + 'L';
  if (d.gte(1000)) return '₹' + d.div(1000).toFixed(1) + 'K';
  return '₹' + d.toFixed(0);
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid rgba(208,174,146,0.4)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
  padding: '24px 28px',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 600,
  color: 'var(--brown-900)',
  margin: 0,
};

const label: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--brown-700)',
};

/* ── KPI card component ─────────────────────────────────────────────── */

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(208,174,146,0.4)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        minWidth: 0,
      }}
    >
      <div style={label}>{title}</div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 26,
          fontWeight: 500,
          color: 'var(--brown-900)',
          marginTop: 6,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--brown-700)', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Revenue Trend panel ─────────────────────────────────────────────── */

function RevenueTrendPanel({ months, setMonths }: { months: number; setMonths: (n: number) => void }) {
  const { data, isLoading } = useQuery<RevenueTrendMonth[]>({
    queryKey: ['analytics-revenue-trend', months],
    queryFn: () => AnalyticsApi.getRevenueTrend(months),
  });

  const chartData = (data ?? []).map((r) => ({
    month: r.month.slice(5), // MM
    label: r.month,
    revenue: parseFloat(r.revenue),
    cogs: parseFloat(r.cogs),
    grossProfit: parseFloat(r.grossProfit),
  }));

  const totalRevenue = (data ?? []).reduce((a, r) => a.plus(r.revenue), new Decimal('0'));
  const totalGP = (data ?? []).reduce((a, r) => a.plus(r.grossProfit), new Decimal('0'));
  const totalInvoices = (data ?? []).reduce((a, r) => a + r.invoiceCount, 0);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="var(--brown-700)" />
          <h2 style={sectionTitle}>Revenue Trend</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                background: months === m ? 'var(--brown-900)' : 'var(--surface)',
                color: months === m ? 'var(--cream)' : 'var(--brown-700)',
                border: `1px solid ${months === m ? 'var(--brown-900)' : 'var(--brown-300)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard title="Total Revenue" value={fmtShort(totalRevenue.toFixed(2))} sub={`${totalInvoices} invoices`} />
        <KpiCard title="Gross Profit" value={fmtShort(totalGP.toFixed(2))} />
        <KpiCard
          title="Avg. Gross Margin"
          value={
            totalRevenue.isZero()
              ? '—'
              : totalGP.div(totalRevenue).mul(100).toFixed(1) + '%'
          }
        />
      </div>

      {isLoading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
          Loading…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(208,174,146,0.3)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--brown-700)' }} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--brown-700)' }} width={70} />
            <Tooltip
              formatter={(val: number, name: string) => [fmt(String(val)), name]}
              contentStyle={{ fontFamily: 'var(--font-body)', fontSize: 12, borderColor: 'var(--brown-300)', borderRadius: 8 }}
            />
            <Bar dataKey="revenue" name="Revenue" fill="var(--brown-700)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cogs" name="COGS" fill="var(--brown-300)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="grossProfit" name="Gross Profit" fill="var(--posted)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Product Performance table ──────────────────────────────────────── */

function ProductPerformancePanel({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery<ProductPerformanceRow[]>({
    queryKey: ['analytics-products', from, to],
    queryFn: () => AnalyticsApi.getProductPerformance(from || undefined, to || undefined),
  });

  const rows = data ?? [];
  const totalRev = rows.reduce((a, r) => a.plus(r.revenue), new Decimal('0'));

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Package size={20} color="var(--brown-700)" />
        <h2 style={sectionTitle}>Product Performance</h2>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brown-700)' }}>
          {rows.length} products
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-700)', fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-300)', fontSize: 13 }}>No invoiced sales found in this period.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--brown-300)' }}>
                {['Product', 'Category', 'Units', 'Revenue', 'COGS', 'Gross Profit', 'Margin %', 'Invoices'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      textAlign: h === 'Product' || h === 'Category' ? 'left' : 'right',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--brown-700)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = new Decimal(r.grossMarginPct);
                const marginColor = pct.gte(30)
                  ? 'var(--posted)'
                  : pct.gte(10)
                  ? 'var(--warning)'
                  : 'var(--danger)';

                return (
                  <tr
                    key={r.productId}
                    style={{
                      background: i % 2 === 1 ? 'var(--cream)' : 'var(--surface)',
                      borderBottom: '1px solid rgba(208,174,146,0.3)',
                    }}
                  >
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--brown-900)' }}>
                      {r.productName}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brown-700)' }}>
                      {r.category ?? '—'}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)' }}>
                      {new Decimal(r.unitsSold).toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)' }}>
                      {fmtShort(r.revenue)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-700)' }}>
                      {fmtShort(r.cogs)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)' }}>
                      {fmtShort(r.grossProfit)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', fontWeight: 600, color: marginColor }}>
                      {pct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-700)' }}>
                      {r.invoiceCount}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr style={{ borderTop: '2px solid var(--brown-300)', background: 'var(--brown-50)' }}>
                <td colSpan={3} style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--brown-900)' }}>
                  Total
                </td>
                <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--brown-900)' }}>
                  {fmtShort(totalRev.toFixed(2))}
                </td>
                <td colSpan={4} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Expense Breakdown panel ─────────────────────────────────────────── */

function ExpenseBreakdownPanel({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery<ExpenseBreakdownRow[]>({
    queryKey: ['analytics-expenses', from, to],
    queryFn: () => AnalyticsApi.getExpenseBreakdown(from || undefined, to || undefined),
  });

  const rows = data ?? [];
  const totalExp = rows.reduce((a, r) => a.plus(r.total), new Decimal('0'));

  // Top-8 for the bar chart
  const chartData = rows.slice(0, 8).map((r) => ({
    name: r.accountName.length > 22 ? r.accountName.slice(0, 20) + '…' : r.accountName,
    amount: parseFloat(r.total),
  }));

  const BAR_COLORS = [
    'var(--brown-900)', 'var(--brown-700)', 'var(--brown-500)', 'var(--brown-400)',
    'var(--warning)', 'var(--danger)', 'var(--posted)', 'var(--brown-300)',
  ];

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <CreditCard size={20} color="var(--brown-700)" />
        <h2 style={sectionTitle}>Expense Breakdown</h2>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
          {fmtShort(totalExp.toFixed(2))} total
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-700)', fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-300)', fontSize: 13 }}>No expense entries in this period.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(208,174,146,0.3)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--brown-700)' }} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--brown-900)' }} />
              <Tooltip
                formatter={(val: number) => [fmt(String(val))]}
                contentStyle={{ fontFamily: 'var(--font-body)', fontSize: 12, borderColor: 'var(--brown-300)', borderRadius: 8 }}
              />
              <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Account', 'Amount', '%'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Account' ? 'left' : 'right', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brown-700)', borderBottom: '2px solid var(--brown-300)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.accountId} style={{ background: i % 2 === 1 ? 'var(--cream)' : 'transparent', borderBottom: '1px solid rgba(208,174,146,0.3)' }}>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brown-900)' }}>
                      {r.accountName}
                    </td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)' }}>
                      {fmtShort(r.total)}
                    </td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right', color: 'var(--brown-700)' }}>
                      {new Decimal(r.pct).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reorder suggestions panel ──────────────────────────────────────── */

const ACTION_META = {
  reorder: { color: 'var(--danger)', bg: 'var(--danger-bg)', Icon: AlertTriangle, label: 'REORDER' },
  ok: { color: 'var(--posted)', bg: 'var(--posted-bg)', Icon: CheckCircle2, label: 'OK' },
  no_movement: { color: 'var(--draft)', bg: 'var(--brown-100)', Icon: MinusCircle, label: 'NO MOVEMENT' },
} as const;

function ReorderPanel() {
  const { data, isLoading } = useQuery<ReorderRow[]>({
    queryKey: ['analytics-reorder'],
    queryFn: AnalyticsApi.getReorderSuggestions,
  });

  const rows = data ?? [];
  const reorderCount = rows.filter((r) => r.action === 'reorder').length;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <AlertTriangle size={20} color={reorderCount > 0 ? 'var(--warning)' : 'var(--brown-700)'} />
        <h2 style={sectionTitle}>Reorder Suggestions</h2>
        {reorderCount > 0 && (
          <span style={{
            marginLeft: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 999,
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--danger)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {reorderCount} need reorder
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--brown-700)' }}>
          Formula: stock ≤ 2× last-7-day velocity → REORDER
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-700)', fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--brown-300)', fontSize: 13 }}>No goods-type products found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--brown-300)' }}>
                {['Product', 'SKU', 'Category', 'Stock', '7-day Sold', 'Reorder Point', 'Avg/Day', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: ['Product', 'SKU', 'Category'].includes(h) ? 'left' : 'right', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brown-700)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const meta = ACTION_META[r.action];
                const { Icon } = meta;
                return (
                  <tr key={r.productId} style={{ background: i % 2 === 1 ? 'var(--cream)' : 'var(--surface)', borderBottom: '1px solid rgba(208,174,146,0.3)' }}>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--brown-900)' }}>
                      {r.productName}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brown-700)' }}>
                      {r.sku ?? '—'}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brown-700)' }}>
                      {r.category ?? '—'}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)', fontWeight: r.action === 'reorder' ? 700 : 400 }}>
                      {new Decimal(r.stockQty).toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-900)' }}>
                      {new Decimal(r.sevenDayVelocity).toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', color: 'var(--brown-700)' }}>
                      {new Decimal(r.reorderPoint).toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right', color: 'var(--brown-700)' }}>
                      {new Decimal(r.avgDailySales).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: meta.bg,
                        border: `1px solid ${meta.color}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: meta.color,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>
                        <Icon size={13} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Date range bar ─────────────────────────────────────────────────── */

function DateBar({ from, to, setFrom, setTo }: { from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ ...label, color: 'var(--brown-700)' }}>Filter period:</span>
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--brown-300)',
          background: 'var(--surface)',
          color: 'var(--brown-900)',
          outline: 'none',
        }}
      />
      <span style={{ color: 'var(--brown-500)', fontSize: 13 }}>→</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--brown-300)',
          background: 'var(--surface)',
          color: 'var(--brown-900)',
          outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={() => { setFrom(''); setTo(''); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          background: 'var(--surface)',
          color: 'var(--brown-700)',
          border: '1px solid var(--brown-300)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
      >
        <RefreshCcw size={13} />
        All time
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 64px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--posted-bg)',
            border: '1px solid var(--posted)',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--posted)',
            marginBottom: 10,
          }}>
            <TrendingUp size={14} />
            Rule-Based Analytics Engine
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: '40px', color: 'var(--brown-900)', margin: 0 }}>
            Business Analytics
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--brown-700)', marginTop: 6, marginBottom: 0 }}>
            Every figure is a deterministic formula over live journal entries and invoices.
          </p>
        </div>
        <DateBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
      </div>

      {/* Panels */}
      <RevenueTrendPanel months={months} setMonths={setMonths} />
      <ProductPerformancePanel from={from} to={to} />
      <ExpenseBreakdownPanel from={from} to={to} />
      <ReorderPanel />
    </div>
  );
}
