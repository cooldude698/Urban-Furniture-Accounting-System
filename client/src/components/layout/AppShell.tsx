import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ShoppingBag,
  Receipt,
  CreditCard,
  Clock,
  Truck,
  FileText,
  Building,
  Users,
  Package,
  PieChart,
  FileBarChart,
  Landmark,
  BookOpen,
  CheckCircle2,
  Scale,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';

interface SubMenuItem {
  label: string;
  to: string;
  description: string;
  icon: React.ElementType;
}

const MENU_DATA: Record<string, { to: string; items: SubMenuItem[] }> = {
  Sales: {
    to: '/sales',
    items: [
      { label: 'Sales Orders', to: '/sales/orders', description: 'Commercial orders & confirmations', icon: ShoppingBag },
      { label: 'Sale Invoices', to: '/sales/invoices', description: 'Tax invoices & billing entries', icon: Receipt },
      { label: 'Receipts & Payments', to: '/sales/payments', description: 'Customer receipt registrations', icon: CreditCard },
      { label: 'Receivables Aging', to: '/sales/receivables', description: 'Outstanding customer balances', icon: Clock },
    ],
  },
  Purchase: {
    to: '/purchase',
    items: [
      { label: 'Purchase Orders', to: '/purchase/orders', description: 'Timber & material procurements', icon: Truck },
      { label: 'Purchase Bills', to: '/purchase/bills', description: 'Vendor bills & input tax tracking', icon: FileText },
      { label: 'Vendor Statements', to: '/purchase/statements', description: 'Payable ledger & payment matching', icon: Building },
    ],
  },
  Account: {
    to: '/account',
    items: [
      { label: 'Contacts', to: '/account/contacts', description: 'Customers, vendors & contractors', icon: Users },
      { label: 'Products & Inventory', to: '/account/products', description: 'Goods, services & stock ledger', icon: Package },
      { label: 'Analytic Accounts', to: '/account/analytics', description: 'Cost centers & channel tags', icon: PieChart },
      { label: 'Analytical Budgets', to: '/account/budgets', description: 'Budget targets & revisions', icon: FileBarChart },
      { label: 'Chart of Accounts', to: '/account/coa', description: 'General ledger account structure', icon: Landmark },
      { label: 'Journals', to: '/account/journals', description: 'Sales, purchase, bank & cash books', icon: BookOpen },
      { label: 'Journal Verification', to: '/verify', description: 'Ledger integrity & trial balancing', icon: CheckCircle2 },
    ],
  },
  Report: {
    to: '/report',
    items: [
      { label: 'Balance Sheet', to: '/report/balance-sheet', description: 'Assets, liabilities & capital position', icon: Scale },
      { label: 'Profit and Loss', to: '/report/profit-loss', description: 'Income statement & gross margin', icon: TrendingUp },
      { label: 'Budget Report', to: '/report/budget', description: 'Variance & achievement analysis', icon: FileBarChart },
    ],
  },
};

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on route change
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMouseEnter = (menuName: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setOpenMenu(menuName);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* ── Top Navigation Bar ── */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid rgba(208, 174, 146, 0.35)',
          boxShadow: '0 1px 4px rgba(74, 58, 52, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          ref={navContainerRef}
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          {/* Brand + Nav Items */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <NavLink
              to="/dashboard"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--brown-900)',
                marginRight: 32,
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Urban Furniture</span>
            </NavLink>

            {/* 4 Main Nav Items with Mega-Menu Flyout */}
            <nav style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 4 }}>
              {Object.entries(MENU_DATA).map(([menuName, { to, items }]) => {
                const isActive = location.pathname.startsWith(to);
                const isOpen = openMenu === menuName;

                return (
                  <div
                    key={menuName}
                    style={{ position: 'relative', height: '100%' }}
                    onMouseEnter={() => handleMouseEnter(menuName)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          setOpenMenu(null);
                        } else {
                          setOpenMenu(menuName);
                        }
                      }}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 14,
                        color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
                        background: isOpen ? 'rgba(235, 215, 190, 0.3)' : 'transparent',
                        border: 'none',
                        borderBottom: isActive
                          ? '2px solid var(--brown-900)'
                          : '2px solid transparent',
                        padding: '0 16px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer',
                        transition: 'all 120ms ease-out',
                        outline: 'none',
                      }}
                    >
                      <span>{menuName}</span>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 150ms ease-out',
                          opacity: 0.7,
                        }}
                      />
                    </button>

                    {/* Flyout Dropdown Menu */}
                    {isOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          minWidth: menuName === 'Account' ? 360 : 300,
                          background: 'var(--surface)',
                          border: '1px solid rgba(208, 174, 146, 0.4)',
                          borderRadius: '0 0 14px 14px',
                          boxShadow: '0 12px 32px rgba(74, 58, 52, 0.12)',
                          padding: 10,
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          animation: 'fadeInDown 150ms ease-out',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--brown-700)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                            marginBottom: 4,
                          }}
                        >
                          {menuName} Module
                        </div>

                        {items.map((item) => {
                          const isSubActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                          const Icon = item.icon;

                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={() => setOpenMenu(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '8px 12px',
                                borderRadius: 8,
                                textDecoration: 'none',
                                background: isSubActive ? 'rgba(235, 215, 190, 0.35)' : 'transparent',
                                transition: 'background 120ms ease-out',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) e.currentTarget.style.background = 'rgba(235, 215, 190, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: isSubActive ? 'var(--brown-900)' : 'rgba(235, 215, 190, 0.4)',
                                  color: isSubActive ? 'var(--cream)' : 'var(--brown-900)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Icon size={14} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>
                                  {item.label}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                                  {item.description}
                                </span>
                              </div>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NavLink
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: location.pathname === '/dashboard' ? 'var(--brown-900)' : 'var(--brown-700)',
                background: location.pathname === '/dashboard' ? 'rgba(235, 215, 190, 0.35)' : 'transparent',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 48px 24px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
