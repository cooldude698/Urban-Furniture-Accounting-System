import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { usePortalAuth } from './PortalAuthGuard';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Receipt,
  LogOut,
  LogIn,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { user, logout } = usePortalAuth();
  const navigate = useNavigate();

  /* True when internal staff member has authenticated on the main app */
  const isInternalStaff = localStorage.getItem('urban_logged_in') === 'true';

  const handleLogout = async () => {
    await logout();
    navigate('/login?portal=customer', { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CU';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FBF8F2 0%, #F5EFE6 100%)',
        color: 'var(--brown-900)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── Unified Premium Header Navigation Bar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(208, 174, 146, 0.35)',
          boxShadow: '0 4px 20px rgba(74, 58, 52, 0.05)',
          transition: 'all 200ms ease',
        }}
      >
        <div
          style={{
            maxWidth: '92rem',
            margin: '0 auto',
            padding: '0 28px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {/* Left: Brand Identity */}
          <Link
            to="/portal"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <BrandLogo size={34} variant="dark" badge={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--brown-900)',
                  }}
                >
                  URBAN FURNITURE
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--brown-900)',
                    color: 'var(--cream)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  PORTAL
                </span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--brown-500)',
                  letterSpacing: '0.04em',
                }}
              >
                Showroom &amp; Client Ledger
              </div>
            </div>
          </Link>

          {/* Center: Refined Segmented Pill Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(235, 215, 190, 0.3)',
              padding: '4px',
              borderRadius: 999,
              border: '1px solid rgba(208, 174, 146, 0.4)',
              boxShadow: 'inset 0 1px 3px rgba(74, 58, 52, 0.04)',
            }}
          >
            {/* Dashboard */}
            <NavLink
              to="/portal"
              end
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--brown-900)',
                backgroundColor: isActive ? 'var(--brown-900)' : 'transparent',
                textDecoration: 'none',
                boxShadow: isActive ? '0 2px 8px rgba(74, 58, 52, 0.25)' : 'none',
                transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
              })}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </NavLink>

            {/* Furniture Catalogue */}
            <NavLink
              to="/portal/catalogue"
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--brown-900)',
                backgroundColor: isActive ? 'var(--brown-900)' : 'transparent',
                textDecoration: 'none',
                boxShadow: isActive ? '0 2px 8px rgba(74, 58, 52, 0.25)' : 'none',
                transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
              })}
            >
              <Layers size={14} />
              <span>Furniture Catalogue</span>
            </NavLink>

            {/* 3D Studio Planner */}
            <NavLink
              to="/portal/studio"
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--brown-900)',
                backgroundColor: isActive ? 'var(--brown-900)' : 'transparent',
                textDecoration: 'none',
                boxShadow: isActive ? '0 2px 8px rgba(74, 58, 52, 0.25)' : 'none',
                transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
              })}
            >
              <Sparkles size={14} />
              <span>3D Studio</span>
            </NavLink>

            {/* Invoices (when authenticated) */}
            {user && (
              <NavLink
                to="/portal/invoices"
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--brown-900)',
                  backgroundColor: isActive ? 'var(--brown-900)' : 'transparent',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 2px 8px rgba(74, 58, 52, 0.25)' : 'none',
                  transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
                })}
              >
                <Receipt size={14} />
                <span>My Invoices</span>
              </NavLink>
            )}
          </nav>

          {/* Right: User Profile Capsule & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Back to ERP — for staff */}
            {isInternalStaff && (
              <a
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--brown-700)',
                  backgroundColor: 'rgba(235, 215, 190, 0.4)',
                  border: '1px solid rgba(208, 174, 146, 0.5)',
                  textDecoration: 'none',
                  transition: 'all 140ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--brown-900)';
                  e.currentTarget.style.color = 'var(--cream)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(235, 215, 190, 0.4)';
                  e.currentTarget.style.color = 'var(--brown-700)';
                }}
                title="Switch to Internal Accounting ERP"
              >
                <span>Internal ERP</span>
                <ArrowUpRight size={12} />
              </a>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Profile Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '4px 12px 4px 4px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(208, 174, 146, 0.45)',
                    boxShadow: '0 1px 3px rgba(74, 58, 52, 0.05)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'var(--brown-900)',
                      color: 'var(--cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ lineHeight: 1.1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--brown-900)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {user.full_name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--brown-600)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Verified Client
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  title="Sign out of customer portal"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(208, 174, 146, 0.4)',
                    color: 'var(--brown-700)',
                    cursor: 'pointer',
                    transition: 'all 140ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
                    e.currentTarget.style.color = 'var(--danger)';
                    e.currentTarget.style.borderColor = 'var(--danger)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--brown-700)';
                    e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.4)';
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login?portal=customer')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 999,
                  backgroundColor: 'var(--brown-900)',
                  color: 'var(--cream)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(74, 58, 52, 0.2)',
                  transition: 'all 140ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 58, 52, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(74, 58, 52, 0.2)';
                }}
              >
                <LogIn size={13} />
                <span>Client Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Viewport ── */}
      <main
        style={{
          flex: 1,
          maxWidth: '92rem',
          width: '100%',
          margin: '0 auto',
          padding: '32px 28px 72px',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Outlet />
      </main>

      {/* ── Architectural Studio Footer ── */}
      <footer
        style={{
          padding: '24px 28px',
          borderTop: '1px solid rgba(208, 174, 146, 0.25)',
          backgroundColor: 'rgba(249, 242, 228, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            maxWidth: '92rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12,
            color: 'var(--brown-600)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600, color: 'var(--brown-900)' }}>Urban Furniture Showroom</span>
            <span>&bull;</span>
            <span>Handcrafted Solid Wood &amp; Architectural Interiors</span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--posted)' }}>
              <ShieldCheck size={13} /> Secure Verified Portal Surface
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--brown-500)' }}>
            Double-Entry Ledger &bull; Razorpay Instant Gateway &bull; 2026 Edition
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
