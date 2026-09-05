import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Scale, TrendingUp, FileBarChart, ShieldCheck } from 'lucide-react';

const REPORT_NAV = [
  { label: 'Balance Sheet', to: '/report/balance-sheet', icon: Scale },
  { label: 'Profit & Loss', to: '/report/profit-loss', icon: TrendingUp },
  { label: 'Budget Report', to: '/report/budget', icon: FileBarChart },
  { label: 'Ledger Audit (/verify)', to: '/verify', icon: ShieldCheck },
];

export default function ReportsIndexPage() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Sub-Navigation Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          paddingBottom: 2,
          overflowX: 'auto',
        }}
      >
        {REPORT_NAV.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname === to || (to === '/report/balance-sheet' && location.pathname === '/report');
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
                textDecoration: 'none',
                borderBottom: isActive ? '2px solid var(--brown-900)' : '2px solid transparent',
                background: isActive ? 'rgba(235, 215, 190, 0.3)' : 'transparent',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                transition: 'all 120ms ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--brown-900)' : 'var(--brown-700)' }} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* ── Active Report View ── */}
      <Outlet />
    </div>
  );
}
