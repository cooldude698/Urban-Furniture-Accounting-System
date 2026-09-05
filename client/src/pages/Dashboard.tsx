import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DashboardApi,
  DashboardStats,
  DashboardKPI,
  RecentActivityItem,
} from '../api/dashboard.api';
import Money from '../components/ui/Money';
import StatusBadge from '../components/ui/StatusBadge';
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
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  // 1. KPI Query
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isError: isKpiError,
    refetch: refetchKPI,
  } = useQuery<DashboardKPI>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: DashboardApi.getKPI,
    retry: 1,
  });

  // 2. Stats Query (Sales, Purchase, Budget counts)
  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: DashboardApi.getStats,
    retry: 1,
  });

  // 3. Recent Activity Query
  const {
    data: activityData,
    isLoading: isActivityLoading,
    isError: isActivityError,
    refetch: refetchActivity,
  } = useQuery<RecentActivityItem[]>({
    queryKey: ['dashboard', 'activity'],
    queryFn: DashboardApi.getActivity,
    retry: 1,
  });

  const handleRefreshAll = () => {
    refetchKPI();
    refetchStats();
    refetchActivity();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.4)', paddingBottom: 'var(--space-4)' }}>
        <div>
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
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--brown-700)',
              marginTop: 4,
              margin: 0,
            }}
          >
            Real-time financial summary, operational counts, and recent ledger activities
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '8px 14px',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
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
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Pending Endpoint Notification Banner (if any API returned 404/error) ── */}
      {(isKpiError || isStatsError) && (
        <div
          style={{
            background: 'var(--warning-bg)',
            border: '1px dashed var(--warning)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
            <span style={{ fontWeight: 600 }}>Backend Aggregations Pending: </span>
            Awaiting routes from Vedesh: <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(74,58,52,0.06)', padding: '2px 4px', borderRadius: 4 }}>GET /api/dashboard/stats</code> and <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(74,58,52,0.06)', padding: '2px 4px', borderRadius: 4 }}>GET /api/dashboard/kpi</code>. Loading states are actively maintained per protocol.
          </div>
        </div>
      )}

      {/* ── KPI Strip (5 Items) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* KPI 1: Cash in hand */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brown-700)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Cash in Hand</span>
            <Wallet size={16} style={{ color: 'var(--brown-500)' }} />
          </div>
          <div style={{ marginTop: 2 }}>
            {isKpiLoading ? (
              <span style={{ fontSize: 14, color: 'var(--brown-500)', fontStyle: 'italic' }}>Loading...</span>
            ) : kpiData?.cash ? (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)' }}>
                <Money value={kpiData.cash} />
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--brown-500)' }}>Pending API</span>
            )}
          </div>
        </div>

        {/* KPI 2: Bank */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brown-700)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Bank Balance</span>
            <Landmark size={16} style={{ color: 'var(--brown-500)' }} />
          </div>
          <div style={{ marginTop: 2 }}>
            {isKpiLoading ? (
              <span style={{ fontSize: 14, color: 'var(--brown-500)', fontStyle: 'italic' }}>Loading...</span>
            ) : kpiData?.bank ? (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)' }}>
                <Money value={kpiData.bank} />
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--brown-500)' }}>Pending API</span>
            )}
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
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brown-700)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Total Receivable</span>
            <ArrowDownLeft size={16} style={{ color: 'var(--posted)' }} />
          </div>
          <div style={{ marginTop: 2 }}>
            {isKpiLoading ? (
              <span style={{ fontSize: 14, color: 'var(--brown-500)', fontStyle: 'italic' }}>Loading...</span>
            ) : kpiData?.receivable ? (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)' }}>
                <Money value={kpiData.receivable} />
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--brown-500)' }}>Pending API</span>
            )}
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
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brown-700)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Total Payable</span>
            <ArrowUpRight size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ marginTop: 2 }}>
            {isKpiLoading ? (
              <span style={{ fontSize: 14, color: 'var(--brown-500)', fontStyle: 'italic' }}>Loading...</span>
            ) : kpiData?.payable ? (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)' }}>
                <Money value={kpiData.payable} />
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--brown-500)' }}>Pending API</span>
            )}
          </div>
        </div>

        {/* KPI 5: This month net income */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brown-700)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>This Month Net Income</span>
            <TrendingUp size={16} style={{ color: 'var(--posted)' }} />
          </div>
          <div style={{ marginTop: 2 }}>
            {isKpiLoading ? (
              <span style={{ fontSize: 14, color: 'var(--brown-500)', fontStyle: 'italic' }}>Loading...</span>
            ) : kpiData?.netIncomeThisMonth ? (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)' }}>
                <Money value={kpiData.netIncomeThisMonth} />
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--brown-500)' }}>Pending API</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Three Cards Section: Sales, Purchase, Budget ── */}
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
              Sales
            </h2>
            <Link
              to="/sales"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--cream)',
                background: 'var(--brown-900)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
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
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <div style={{ background: 'rgba(235, 215, 190, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.all : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(237, 241, 232, 0.6)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.confirmed : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(235, 215, 190, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-700)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.sales ? statsData.sales.draft : '-'}
              </div>
            </div>
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
              Purchase
            </h2>
            <Link
              to="/purchase"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--cream)',
                background: 'var(--brown-900)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
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
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <div style={{ background: 'rgba(235, 215, 190, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.all : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(237, 241, 232, 0.6)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.confirmed : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(235, 215, 190, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-700)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.purchase ? statsData.purchase.draft : '-'}
              </div>
            </div>
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
              Budget
            </h2>
            <Link
              to="/report"
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
                padding: '5px 12px',
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
            <div style={{ background: 'rgba(237, 241, 232, 0.6)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Achieved</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--posted)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.achieved : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(235, 215, 190, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.budget : '-'}
              </div>
            </div>
            <div style={{ background: 'rgba(251, 241, 223, 0.6)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Committed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--warning)', marginTop: 4 }}>
                {isStatsLoading ? '...' : statsData?.budget ? statsData.budget.committed : '-'}
              </div>
            </div>
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
              Recent Activity
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--brown-500)', fontFamily: 'var(--font-body)' }}>
            Latest financial and transactional documents
          </span>
        </div>

        {isActivityLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--brown-500)', fontSize: 14 }}>
            Loading recent transactions...
          </div>
        ) : activityData && activityData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--brown-100)', height: 40, borderBottom: '1px solid var(--brown-300)' }}>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Date</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Document #</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Partner / Description</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>Journal</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activityData.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      height: 44,
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
                    <td style={{ padding: '0 16px', fontSize: 13, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>
                      {item.partner || '—'}
                    </td>
                    <td style={{ padding: '0 16px', fontSize: 13, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                      {item.journal || 'General'}
                    </td>
                    <td style={{ padding: '0 16px', textAlign: 'right' }}>
                      <Money value={item.total} />
                    </td>
                    <td style={{ padding: '0 16px', textAlign: 'center' }}>
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--brown-500)', fontSize: 14 }}>
            No recent activity recorded yet. Entries will appear automatically as orders, bills, and journals post.
          </div>
        )}
      </div>
    </div>
  );
}
