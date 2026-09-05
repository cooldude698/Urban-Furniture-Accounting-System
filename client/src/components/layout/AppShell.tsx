import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LucideIcon,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Package,
  Landmark,
  BookOpen,
  BookText,
  PieChart,
  FileBarChart,
  ShoppingCart,
  Receipt,
  DollarSign,
  CreditCard,
  ShoppingBag,
  FileText,
  FileCheck,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import api from '../../lib/axios';
import { BrandLogo } from '../ui/BrandLogo';

interface SubNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const MODULE_SUBNAV_MAP: Record<string, SubNavItem[]> = {
  account: [
    { label: 'Contacts', to: '/account/contacts', icon: Users },
    { label: 'Products & Services', to: '/account/products', icon: Package },
    { label: 'Chart of Accounts', to: '/account/coa', icon: Landmark },
    { label: 'Journals', to: '/account/journals', icon: BookOpen },
    { label: 'Journal Entries', to: '/account/journal-entries', icon: BookText },
    { label: 'Analyticals', to: '/account/analytics', icon: PieChart },
    { label: 'Analytical Budget', to: '/account/budgets', icon: FileBarChart },
  ],
  sales: [
    { label: 'Sales Orders', to: '/sales/orders', icon: ShoppingCart },
    { label: 'Customer Invoices', to: '/sales/invoices', icon: Receipt },
    { label: 'Receivables', to: '/sales/receivables', icon: DollarSign },
    { label: 'Register Payment', to: '/sales/payments', icon: CreditCard },
  ],
  purchase: [
    { label: 'Purchase Orders', to: '/purchase/orders', icon: ShoppingBag },
    { label: 'Vendor Bills', to: '/purchase/bills', icon: FileText },
    { label: 'Vendor Statements', to: '/purchase/statements', icon: FileCheck },
  ],
  report: [
    { label: 'Balance Sheet', to: '/report/balance-sheet', icon: Scale },
    { label: 'Profit & Loss', to: '/report/profit-loss', icon: TrendingUp },
    { label: 'Budget Performance', to: '/report/budget', icon: FileBarChart },
  ],
};

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Close mega menu on route change
  useEffect(() => {
    setIsMegaMenuOpen(false);
  }, [location.pathname]);

  const isAuthenticated = localStorage.getItem('urban_logged_in') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('urban_logged_in');
      localStorage.removeItem('urban_user');
      navigate('/login', { replace: true });
    }
  };

  let currentUser: { full_name?: string; login_id?: string; role?: string } | null = null;
  try {
    const raw = localStorage.getItem('urban_user');
    if (raw) currentUser = JSON.parse(raw);
  } catch {
    // Ignore JSON error
  }

  const navModules = ['Sales', 'Purchase', 'Account', 'Report'];

  // Determine active module and whether sub-nav should be displayed
  const activeModule = ['sales', 'purchase', 'account', 'report'].find((m) =>
    location.pathname.startsWith(`/${m}`)
  );

  const isFormView =
    location.pathname.endsWith('/new') ||
    /\/\d+$/.test(location.pathname);

  const currentSubNav = activeModule ? MODULE_SUBNAV_MAP[activeModule] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* ── Top Navigation Bar ── */}
      <header
        ref={headerRef}
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
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            position: 'relative',
          }}
        >
          {/* Left: Brand & Navigation Modules */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: '100%' }}>
            <NavLink
              to="/dashboard"
              onClick={() => setIsMegaMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--brown-900)',
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 2,
                whiteSpace: 'nowrap',
              }}
            >
              <BrandLogo size={24} variant="dark" />
            </NavLink>

            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                gap: 4,
              }}
            >
              {navModules.map((menuName) => {
                const isActive = location.pathname.startsWith(`/${menuName.toLowerCase()}`);

                return (
                  <button
                    key={menuName}
                    type="button"
                    onClick={() => setIsMegaMenuOpen((prev) => !prev)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: isActive || isMegaMenuOpen ? 700 : 500,
                      fontSize: 14,
                      color: isActive || isMegaMenuOpen ? 'var(--brown-900)' : 'var(--brown-700)',
                      background: isMegaMenuOpen ? 'rgba(235, 215, 190, 0.3)' : 'transparent',
                      border: 'none',
                      borderBottom: isActive
                        ? '2px solid var(--brown-900)'
                        : '2px solid transparent',
                      padding: '0 14px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 120ms ease-out',
                      outline: 'none',
                      borderRadius: '6px 6px 0 0',
                      whiteSpace: 'nowrap',
                    }}
                    title="Open navigation menu"
                  >
                    <span>{menuName}</span>
                    <ChevronDown
                      size={13}
                      style={{
                        transform: isMegaMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 150ms ease-out',
                        opacity: 0.7,
                      }}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Unified 4-Column Mega Menu matching wireframe */}
          <MegaMenu
            isOpen={isMegaMenuOpen}
            onClose={() => setIsMegaMenuOpen(false)}
          />

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
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

            {currentUser && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'rgba(235, 215, 190, 0.25)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--brown-900)',
                  fontWeight: 600,
                }}
              >
                <User size={13} color="var(--brown-700)" />
                <span>{currentUser.login_id || currentUser.full_name}</span>
              </div>
            )}

            {/* Portal switch link — subtle, top-right, visible to internal staff */}
            <a
              href="/portal/invoices"
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--brown-600)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 0',
                borderBottom: '1px solid transparent',
                transition: 'color 120ms ease, border-color 120ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--brown-900)';
                e.currentTarget.style.borderBottomColor = 'var(--brown-900)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--brown-600)';
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
              title="Open the Customer Portal"
            >
              <span>Customer Portal</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>→</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 11px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--brown-800)',
                background: 'transparent',
                border: '1px solid var(--brown-400)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sub-Navigation Secondary Toolbar (Flush underneath Header) ── */}
      {currentSubNav && !isFormView && (
        <nav
          aria-label="Module Navigation"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid rgba(208, 174, 146, 0.35)',
            boxShadow: '0 1px 2px rgba(74, 58, 52, 0.02)',
            position: 'sticky',
            top: 56,
            zIndex: 90,
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              height: 44,
            }}
          >
            {currentSubNav.map(({ label, to, icon: Icon }) => {
              const isActive =
                location.pathname === to ||
                (to !== `/${activeModule}` && location.pathname.startsWith(`${to}/`));

              return (
                <NavLink
                  key={to}
                  to={to}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
                    background: isActive ? 'rgba(235, 215, 190, 0.45)' : 'transparent',
                    border: isActive ? '1px solid rgba(208, 174, 146, 0.5)' : '1px solid transparent',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 120ms ease',
                  }}
                >
                  <Icon size={14} style={{ opacity: isActive ? 1 : 0.7 }} />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}

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
