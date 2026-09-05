import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShoppingBag, FileText, BarChart3, CreditCard, ExternalLink } from 'lucide-react';

const SALES_NAV = [
  { label: 'Sales Orders', to: '/sales/orders', icon: ShoppingBag },
  { label: 'Customer Invoices', to: '/sales/invoices', icon: FileText },
  { label: 'Receivables & Aging', to: '/sales/receivables', icon: BarChart3 },
  { label: 'Register Payment', to: '/sales/payments', icon: CreditCard },
];

export default function SalesIndexPage() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Sub-Navigation Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          paddingBottom: 2,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          {SALES_NAV.map(({ label, to, icon: Icon }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
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

        {/* External Portal Launcher */}
        <a
          href="/portal"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: '#77574A',
            background: 'var(--surface)',
            border: '1px solid var(--brown-300)',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 150ms ease-out',
          }}
          className="hover:bg-brown-100 hover:text-brown-900 shadow-2xs"
        >
          <span>Customer Portal</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* ── Active Sales View ── */}
      <Outlet />
    </div>
  );
}
