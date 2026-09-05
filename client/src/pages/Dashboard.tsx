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
  AlertCircle,
  Package,
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

  // 2. Stats Query
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

  const chartData = (trendsData || []).map((item) => ({
    label: item.label,
    month: item.month,
    Revenue: Number(item.revenue),
    Expense: Number(item.expense),
    Net: Number(item.net),
  }));

  const customTooltipFormatter = (value: any) => {
    return [formatINR(String(value)), ''];
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1400,
        margin: '0 auto',
        padding: '8px 4px 48px 4px',
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(208, 174, 146, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: '-0.01em',
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Executive Dashboard
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(208, 174, 146, 0.25)',
                color: 'var(--brown-900)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              FY 2026–27
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--brown-700)',
              marginTop: 4,
              margin: 0,
            }}
          >
            Real-time financial summary, operational counts, and ledger activities
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              color: 'var(--brown-700)',
              background: 'rgba(255, 255, 255, 0.6)',
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid rgba(208, 174, 146, 0.25)',
            }}
          >
            <Calendar size={13} style={{ color: 'var(--brown-700)' }} />
            <span>Active Ledger</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'var(--brown-900)',
              background: 'var(--surface)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(74, 58, 52, 0.04)',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brown-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            <RefreshCw size={13} className={isKpiLoading || isStatsLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Operational Alerts Strip (Slim, Rounded & Minimal) ── */}
      {alertsData && (alertsData.overdueInvoices.count > 0 || alertsData.lowStockProducts.count > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 12,
          }}
        >
          {alertsData.overdueInvoices.count > 0 && (
            <div
              style={{
                background: 'rgba(251, 241, 223, 0.8)',
                border: '1px solid rgba(192, 138, 62, 0.3)',
                borderRadius: 14,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  <span style={{ fontWeight: 600 }}>{alertsData.overdueInvoices.count} Overdue Invoices</span>
                  <span style={{ color: 'var(--brown-700)', marginLeft: 6 }}>
                    ({formatINR(alertsData.overdueInvoices.total)})
                  </span>
                </div>
              </div>
              <Link
                to="/sales/receivables"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--warning)',
                  textDecoration: 'none',
                }}
              >
                <span>Aging</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {alertsData.lowStockProducts.count > 0 && (
            <div
              style={{
                background: 'rgba(235, 215, 190, 0.35)',
                border: '1px solid rgba(208, 174, 146, 0.35)',
                borderRadius: 14,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={16} style={{ color: 'var(--brown-700)', flexShrink: 0 }} />
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  <span style={{ fontWeight: 600 }}>{alertsData.lowStockProducts.count} Low Stock Items</span>
                  <span style={{ color: 'var(--brown-700)', marginLeft: 6 }}>below reorder level</span>
                </div>
              </div>
              <Link
                to="/account/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--brown-900)',
                  textDecoration: 'none',
                }}
              >
                <span>Stock</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Refined KPI Strip (Clean, Smaller Figures & Smooth Corners) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {/* KPI 1: Cash in Hand */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)', letterSpacing: '0.02em' }}>
              Cash in Hand
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(235, 215, 190, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brown-900)',
              }}
            >
              <Wallet size={14} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: 'var(--brown-900)',
              }}
            >
              {isKpiLoading ? '...' : <Money value={kpiData?.cash || '0.00'} />}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(119, 87, 74, 0.8)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
              Petty cash register
            </div>
          </div>
        </div>

        {/* KPI 2: Bank Balance */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)', letterSpacing: '0.02em' }}>
              Bank Balance
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(235, 215, 190, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brown-900)',
              }}
            >
              <Landmark size={14} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: 'var(--brown-900)',
              }}
            >
              {isKpiLoading ? '...' : <Money value={kpiData?.bank || '0.00'} />}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(119, 87, 74, 0.8)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
              HDFC & SBI Accounts
            </div>
          </div>
        </div>

        {/* KPI 3: Total Receivable */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)', letterSpacing: '0.02em' }}>
              Receivables
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(237, 241, 232, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--posted)',
              }}
            >
              <ArrowDownLeft size={14} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: 'var(--posted)',
              }}
            >
              {isKpiLoading ? '...' : <Money value={kpiData?.receivable || '0.00'} />}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(119, 87, 74, 0.8)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
              Customer balances due
            </div>
          </div>
        </div>

        {/* KPI 4: Total Payable */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)', letterSpacing: '0.02em' }}>
              Payables
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(248, 234, 230, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
              }}
            >
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: 'var(--danger)',
              }}
            >
              {isKpiLoading ? '...' : <Money value={kpiData?.payable || '0.00'} />}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(119, 87, 74, 0.8)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
              Vendor bills to settle
            </div>
          </div>
        </div>

        {/* KPI 5: Net Profit */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--brown-700)', letterSpacing: '0.02em' }}>
              Net Profit
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(237, 241, 232, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--posted)',
              }}
            >
              <TrendingUp size={14} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: '-0.02em',
                color: 'var(--brown-900)',
              }}
            >
              {isKpiLoading ? '...' : <Money value={kpiData?.netIncomeThisMonth || '0.00'} />}
            </div>
            <div style={{ fontSize: 11, color: 'var(--posted)', fontFamily: 'var(--font-body)', marginTop: 2, fontWeight: 600 }}>
              +18.4% margin (active)
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Cards: Sales, Purchase, Budget (Clean & Rounded) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Card 1: Sales */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Sales Orders
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Customer order book
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
                padding: '5px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'opacity 150ms ease-out',
              }}
            >
              <Plus size={13} />
              <span>New</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.25)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
                transition: 'background 120ms ease-out',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-900)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.all : '200'}
              </div>
            </Link>
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(237, 241, 232, 0.65)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--posted)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.confirmed : '200'}
              </div>
            </Link>
            <Link
              to="/sales/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.25)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-700)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.draft : '0'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/sales/invoices"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              Invoices (300) →
            </Link>
            <Link
              to="/sales/receivables"
              style={{ fontSize: 12, color: 'var(--posted)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Receivables →
            </Link>
          </div>
        </div>

        {/* Card 2: Purchase */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Purchases & POs
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Timber & materials flow
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
                padding: '5px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'opacity 150ms ease-out',
              }}
            >
              <Plus size={13} />
              <span>New</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.25)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-900)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.all : '130'}
              </div>
            </Link>
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(237, 241, 232, 0.65)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--posted)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.confirmed : '130'}
              </div>
            </Link>
            <Link
              to="/purchase/orders"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.25)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-700)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.draft : '0'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/purchase/bills"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              Bills (180) →
            </Link>
            <Link
              to="/purchase/statements"
              style={{ fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Statements →
            </Link>
          </div>
        </div>

        {/* Card 3: Budget */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Budget & Variance
              </h2>
              <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Q2 Showroom & fitout targets
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
                padding: '4px 12px',
                borderRadius: 8,
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
              gap: 10,
              textAlign: 'center',
            }}
          >
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'rgba(237, 241, 232, 0.65)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Achieved</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--posted)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.achieved : '2'}
              </div>
            </Link>
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'rgba(235, 215, 190, 0.25)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budgets</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-900)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.budget : '3'}
              </div>
            </Link>
            <Link
              to="/account/budgets"
              style={{
                textDecoration: 'none',
                background: 'rgba(251, 241, 223, 0.65)',
                padding: '10px 8px',
                borderRadius: 12,
                display: 'block',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Committed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--warning)', marginTop: 2 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.committed : '2'}
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(208, 174, 146, 0.15)' }}>
            <Link
              to="/account/budgets"
              style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
            >
              Budgets (3) →
            </Link>
            <Link
              to="/account/analytics"
              style={{ fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}
            >
              Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Financial Trend & Quick Actions ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        {/* Monthly Trend Chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--brown-900)',
                  margin: 0,
                }}
              >
                Monthly Revenue vs Expense (May – Aug 2026)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--brown-700)', margin: '2px 0 0 0', fontFamily: 'var(--font-body)' }}>
                Computed from posted ledger entries
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
              <span>P&L</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div style={{ height: 230, width: '100%', marginTop: 4 }}>
            {isTrendsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                Loading chart...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(208, 174, 146, 0.2)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--brown-700)" fontSize={11} tickLine={false} />
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
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-body)', paddingTop: 4 }}
                  />
                  <Bar dataKey="Revenue" fill="var(--posted)" radius={[6, 6, 0, 0]} name="Income" />
                  <Bar dataKey="Expense" fill="var(--warning)" radius={[6, 6, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-700)' }}>
                No trend data
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Quick Actions
            </h3>
            <p style={{ fontSize: 12, color: 'var(--brown-700)', margin: '2px 0 0 0', fontFamily: 'var(--font-body)' }}>
              Standard procedures
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              to="/sales/orders/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: 'rgba(235, 215, 190, 0.25)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
                transition: 'background 120ms ease-out',
              }}
            >
              <Receipt size={15} style={{ color: 'var(--brown-700)' }} />
              <span>+ New Sales Order</span>
            </Link>

            <Link
              to="/purchase/bills/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: 'rgba(235, 215, 190, 0.25)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <FileText size={15} style={{ color: 'var(--brown-700)' }} />
              <span>+ Record Vendor Bill</span>
            </Link>

            <Link
              to="/sales/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: 'rgba(235, 215, 190, 0.25)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <CreditCard size={15} style={{ color: 'var(--brown-700)' }} />
              <span>Register Payment</span>
            </Link>

            <Link
              to="/report/balance-sheet"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: 'var(--surface)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Building2 size={15} style={{ color: 'var(--brown-700)' }} />
              <span>Balance Sheet</span>
            </Link>

            <Link
              to="/account/coa"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: 'var(--surface)',
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Landmark size={15} style={{ color: 'var(--brown-700)' }} />
              <span>Chart of Accounts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Ledger Postings Table (Clean & Rounded) ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(208, 174, 146, 0.3)',
          borderRadius: 18,
          boxShadow: '0 2px 10px rgba(74, 58, 52, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} style={{ color: 'var(--brown-700)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Recent Ledger Postings
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
            Latest 10 transactions
          </span>
        </div>

        {isActivityLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
            Loading entries...
          </div>
        ) : activityData && activityData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(235, 215, 190, 0.3)', height: 38, borderBottom: '1px solid rgba(208, 174, 146, 0.3)' }}>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</th>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Document #</th>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Partner</th>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Journal</th>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activityData.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      height: 42,
                      borderBottom: '1px solid rgba(208, 174, 146, 0.15)',
                      background: index % 2 === 1 ? 'rgba(249, 242, 228, 0.3)' : 'transparent',
                      transition: 'background 120ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(235, 215, 190, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 1 ? 'rgba(249, 242, 228, 0.3)' : 'transparent';
                    }}
                  >
                    <td style={{ padding: '0 16px', fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-mono)' }}>
                      {item.number}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                      {item.partner || 'General Ledger Entry'}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                      <span
                        style={{
                          background: 'rgba(208, 174, 146, 0.2)',
                          padding: '2px 7px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {item.journal || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '0 16px', textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
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
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
            No recent activity recorded.
          </div>
        )}
      </div>
    </div>
  );
}
