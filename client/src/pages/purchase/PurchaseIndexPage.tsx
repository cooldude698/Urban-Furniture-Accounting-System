import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, FileText, CreditCard } from 'lucide-react';

const PURCHASE_NAV = [
  { label: 'Purchase Order', to: '/purchase/orders', icon: ShoppingCart },
  { label: 'Purchase Bill', to: '/purchase/bills', icon: FileText },
  { label: 'Payment', to: '/purchase/statements', icon: CreditCard },
];

export default function PurchaseIndexPage() {
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
        {PURCHASE_NAV.map(({ label, to, icon: Icon }) => {
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

      {/* ── Active Purchase View ── */}
      <Outlet />
    </div>
  );
}
