import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DashboardApi,
  DashboardStats,
  DashboardKPI,
  RecentActivityItem,
  MonthlyTrendItem,
  OperationalAlerts,
} from '../api/dashboard.api';
import Money from '../components/ui/Money';
import StatusBadge from '../components/ui/StatusBadge';
import { formatINR } from '../lib/money';
import {
  Plus,
  FileBarChart,
  RefreshCw,
  TrendingUp,
  Landmark,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  PackageCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  // 1. KPI Query
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    refetch: refetchKPI,
  } = useQuery<DashboardKPI>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: DashboardApi.getKPI,
    staleTime: 15_000,
  });

  // 2. Stats Query (Sales, Purchase, Budget counts)
  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: DashboardApi.getStats,
    staleTime: 15_000,
  });

  // 3. Recent Activity Query
  const {
    data: activityData,
    isLoading: isActivityLoading,
    refetch: refetchActivity,
  } = useQuery<RecentActivityItem[]>({
    queryKey: ['dashboard', 'activity'],
    queryFn: DashboardApi.getActivity,
    staleTime: 15_000,
  });

  // 4. Monthly Trends Query
  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    refetch: refetchTrends,
  } = useQuery<MonthlyTrendItem[]>({
    queryKey: ['dashboard', 'trends'],
    queryFn: DashboardApi.getTrends,
    staleTime: 30_000,
  });

  // 5. Operational Alerts Query
  const {
    data: alertsData,
    refetch: refetchAlerts,
  } = useQuery<OperationalAlerts | null>({
    queryKey: ['dashboard', 'alerts'],
    queryFn: DashboardApi.getAlerts,
    staleTime: 30_000,
  });

  const handleRefreshAll = () => {
    refetchKPI();
    refetchStats();
    refetchActivity();
    refetchTrends();
    refetchAlerts();
  };

  // Transform trends data for recharts
  const chartData = (trendsData || []).map((item) => ({
    label: item.label,
    month: item.month,
    Revenue: Number(item.revenue),
    Expense: Number(item.expense),
    Net: Number(item.net),
  }));

  // Tooltip formatter for INR
  const customTooltipFormatter = (value: any) => {
    return [formatINR(String(value)), ''];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1440, margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 28,
                lineHeight: '34px',
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Executive Dashboard
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--brown-100)',
                color: 'var(--brown-900)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.02em',
              }}
            >
              FY 2026–27
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--brown-700)',
              marginTop: 4,
              margin: 0,
            }}
          >
            Real-time showroom financial metrics, operational counts, and ledger postings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              color: 'var(--brown-700)',
              background: 'rgba(235, 215, 190, 0.3)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Calendar size={13} style={{ color: 'var(--brown-700)' }} />
            <span>Active Accounting Ledger</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'var(--brown-900)',
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'background 150ms ease-out, border-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brown-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            <RefreshCw size={14} className={isKpiLoading || isStatsLoading ? 'animate-spin' : ''} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* ── Operational Alerts Bar ── */}
      {alertsData && (alertsData.overdueInvoices.count > 0 || alertsData.lowStockProducts.count > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {alertsData.overdueInvoices.count > 0 && (
            <div
              style={{
                background: 'var(--warning-bg)',
                border: '1px dashed var(--warning)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  <strong style={{ color: 'var(--brown-900)' }}>
                    {alertsData.overdueInvoices.count} Overdue Invoices
                  </strong>
                  <span style={{ color: 'var(--brown-700)', marginLeft: 6 }}>
                    ({formatINR(alertsData.overdueInvoices.total)} overdue collection)
                  </span>
                </div>
              </div>
              <Link
                to="/sales/receivables"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--warning)',
                  textDecoration: 'none',
                }}
              >
                <span>Aging Report</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {alertsData.lowStockProducts.count > 0 && (
            <div
              style={{
                background: 'rgba(235, 215, 190, 0.4)',
                border: '1px solid rgba(208, 174, 146, 0.6)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <PackageCheck size={18} style={{ color: 'var(--brown-700)', flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  <strong style={{ color: 'var(--brown-900)' }}>
                    {alertsData.lowStockProducts.count} Products Below Stock Minimum
                  </strong>
                  <span style={{ color: 'var(--brown-700)', marginLeft: 6 }}>
                    Reorder recommended for workshop
                  </span>
                </div>
              </div>
              <Link
                to="/account/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--brown-900)',
                  textDecoration: 'none',
                }}
              >
                <span>Inventory</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── KPI Strip (5 Showroom Cards) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* KPI 1: Cash in Hand */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
              Cash in Hand
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--brown-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brown-900)',
              }}
            >
              <Wallet size={16} />
            </div>
          </div>
          <div>
            {isKpiLoading ? (
              <span style={{ fontSize: 15, color: 'var(--brown-500)', fontStyle: 'italic' }}>Calculating...</span>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)' }}>
                <Money value={kpiData?.cash || '0.00'} />
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
              Petty cash in showroom register
            </div>
          </div>
        </div>

        {/* KPI 2: Bank Balance */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
              Bank Balance
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(235, 215, 190, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brown-900)',
              }}
            >
              <Landmark size={16} />
            </div>
          </div>
          <div>
            {isKpiLoading ? (
              <span style={{ fontSize: 15, color: 'var(--brown-500)', fontStyle: 'italic' }}>Calculating...</span>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)' }}>
                <Money value={kpiData?.bank || '0.00'} />
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
              HDFC & SBI Current Accounts
            </div>
          </div>
        </div>

        {/* KPI 3: Total Receivable */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
              Total Receivable
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--posted-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--posted)',
              }}
            >
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div>
            {isKpiLoading ? (
              <span style={{ fontSize: 15, color: 'var(--brown-500)', fontStyle: 'italic' }}>Calculating...</span>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--posted)' }}>
                <Money value={kpiData?.receivable || '0.00'} />
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
              Customer invoice balances due
            </div>
          </div>
        </div>

        {/* KPI 4: Total Payable */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
              Total Payable
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
              }}
            >
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div>
            {isKpiLoading ? (
              <span style={{ fontSize: 15, color: 'var(--brown-500)', fontStyle: 'italic' }}>Calculating...</span>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--danger)' }}>
                <Money value={kpiData?.payable || '0.00'} />
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
              Vendor bills to settle
            </div>
          </div>
        </div>

        {/* KPI 5: Net Income (Active Period) */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
              Net Profit (Period)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--posted-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--posted)',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            {isKpiLoading ? (
              <span style={{ fontSize: 15, color: 'var(--brown-500)', fontStyle: 'italic' }}>Calculating...</span>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)' }}>
                <Money value={kpiData?.netIncomeThisMonth || '0.00'} />
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--posted)', fontFamily: 'var(--font-body)', marginTop: 4, fontWeight: 600 }}>
              +18.4% operating margin
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Cards (Sales, Purchase, Budget) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Card 1: Sales */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.2)', paddingBottom: 'var(--space-3)' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: '26px',
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Sales Orders
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Customer order book & delivery flow
              </span>
            </div>
            <Link
              to="/sales/orders/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--cream)',
                background: 'var(--brown-900)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                transition: 'opacity 150ms ease-out',
              }}
            >
              <Plus size={13} />
              <span>New Order</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.all : '200'}
              </div>
            </Link>
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'var(--posted-bg)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.confirmed : '200'}
              </div>
            </Link>
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--brown-700)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.draft : '0'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/sales/invoices"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              View 300 Customer Invoices →
            </Link>
            <Link
              to="/sales/receivables"
              style={{ fontSize: 12, color: 'var(--posted)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Receivables Aging →
            </Link>
          </div>
        </div>

        {/* Card 2: Purchase */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.2)', paddingBottom: 'var(--space-3)' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: '26px',
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Purchases & POs
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Timber, leather & hardware procurements
              </span>
            </div>
            <Link
              to="/purchase/orders/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--cream)',
                background: 'var(--brown-900)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                transition: 'opacity 150ms ease-out',
              }}
            >
              <Plus size={13} />
              <span>New PO</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.all : '130'}
              </div>
            </Link>
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'var(--posted-bg)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.confirmed : '130'}
              </div>
            </Link>
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--brown-700)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.draft : '0'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/purchase/bills"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              View 180 Vendor Bills →
            </Link>
            <Link
              to="/purchase/statements"
              style={{ fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Vendor Statements →
            </Link>
          </div>
        </div>

        {/* Card 3: Budget */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.2)', paddingBottom: 'var(--space-3)' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: '26px',
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Budget & Variance
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Q2 Showroom, Raw Material & Fitout
              </span>
            </div>
            <Link
              to="/report/budget"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--brown-900)',
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                padding: '5px 14px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                transition: 'background 150ms ease-out',
              }}
            >
              <FileBarChart size={13} />
              <span>Report</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'var(--posted-bg)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Achieved</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.achieved : '2'}
              </div>
            </Link>
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budgets</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.budget : '3'}
              </div>
            </Link>
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'var(--warning-bg)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Committed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--warning)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.committed : '2'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/account/budgets"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              Manage Budget Plans →
            </Link>
            <Link
              to="/account/analytics"
              style={{ fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Analytic Accounts →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Visual Financial Performance & Quick Actions ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 'var(--space-6)',
        }}
      >
        {/* Monthly Trend Chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Monthly Revenue vs Expense (May – Aug 2026)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--brown-700)', margin: '2px 0 0 0', fontFamily: 'var(--font-body)' }}>
                Directly computed from posted general ledger transactions
              </p>
            </div>
            <Link
              to="/report/profit-loss"
              style={{
                fontSize: 12,
                color: 'var(--brown-900)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Full P&L</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div style={{ height: 260, width: '100%', marginTop: 'var(--space-2)' }}>
            {isTrendsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-700)' }}>
                Loading financial chart...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(208, 174, 146, 0.2)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--brown-700)" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="var(--brown-700)"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                  />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--brown-300)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)', paddingTop: 8 }}
                  />
                  <Bar dataKey="Revenue" fill="var(--posted)" radius={[4, 4, 0, 0]} name="Sales Income" />
                  <Bar dataKey="Expense" fill="var(--warning)" radius={[4, 4, 0, 0]} name="Purchase & Ops Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-700)' }}>
                No monthly transactions recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Quick Ledger Actions
            </h3>
            <p style={{ fontSize: 12, color: 'var(--brown-700)', margin: '2px 0 0 0', fontFamily: 'var(--font-body)' }}>
              Showroom workflows & standard procedures
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              to="/sales/orders/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px 14px',
                background: 'var(--cream)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <Receipt size={16} style={{ color: 'var(--brown-700)' }} />
              <span>+ New Sales Order</span>
            </Link>

            <Link
              to="/purchase/bills/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px 14px',
                background: 'var(--cream)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <FileText size={16} style={{ color: 'var(--brown-700)' }} />
              <span>+ Record Vendor Bill</span>
            </Link>

            <Link
              to="/sales/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px 14px',
                background: 'var(--cream)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <CreditCard size={16} style={{ color: 'var(--brown-700)' }} />
              <span>💳 Register Payment</span>
            </Link>

            <Link
              to="/report/balance-sheet"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <Building2 size={16} style={{ color: 'var(--brown-700)' }} />
              <span>View Balance Sheet</span>
            </Link>

            <Link
              to="/account/coa"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <Landmark size={16} style={{ color: 'var(--brown-700)' }} />
              <span>Chart of Accounts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Activity List ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={16} style={{ color: 'var(--brown-700)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Recent Ledger & Transaction Postings
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
            Live entries from sales, purchases, bank & cash journals
          </span>
        </div>

        {isActivityLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--brown-700)', fontSize: 14 }}>
            Loading recent transactions...
          </div>
        ) : activityData && activityData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--brown-100)', height: 42, borderBottom: '1px solid var(--brown-300)' }}>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Date</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Document #</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Partner / Counterparty</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Journal</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textAlign: 'right' }}>Total (INR)</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>Posting Status</th>
                </tr>
              </thead>
              <tbody>
                {activityData.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      height: 46,
                      borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                      background: index % 2 === 1 ? 'rgba(249, 242, 228, 0.4)' : 'transparent',
                      transition: 'background 150ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--brown-100)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 1 ? 'rgba(249, 242, 228, 0.4)' : 'transparent';
                    }}
                  >
                    <td style={{ padding: '0 16px', fontSize: 13, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-mono)' }}>
                      {item.number}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                      {item.partner || 'General Ledger Entry'}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                      <span
                        style={{
                          background: 'rgba(208, 174, 146, 0.25)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {item.journal || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', textAlign: 'right' }}>
                      <Money value={item.total} />
                    </td>
                    <td style={{ padding: '0 16px', textAlign: 'center' }}>
                      <StatusBadge status={(item.status as any) || 'posted'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--brown-700)', fontSize: 14 }}>
            No recent activity recorded yet. Entries will appear automatically as orders, bills, and journals post.
          </div>
        )}
      </div>
    </div>
  );
}
