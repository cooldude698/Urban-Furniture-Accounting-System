import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePortalAuth } from './PortalAuthGuard';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const PortalLayout: React.FC = () => {
  const { user, logout } = usePortalAuth();
  const navigate = useNavigate();

  /* True when an internal staff member has also authenticated on the main app.
     This is a UI-only hint — the portal API remains independently scoped.
     Pure portal contacts never have this flag set. */
  const isInternalStaff = localStorage.getItem('urban_logged_in') === 'true';

  const handleLogout = async () => {
    await logout();
    navigate('/login?portal=customer', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        color: 'var(--brown-900)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── Portal Header — brown-900 bg, cream text ── */}
      <header
        style={{
          backgroundColor: 'var(--brown-900)',
          color: 'var(--cream)',
          borderBottom: '1px solid rgba(74, 58, 52, 0.35)',
          boxShadow: 'var(--shadow-sm)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 56,
        }}
      >
        {/* Brand mark */}
        <BrandLogo
          size={32}
          variant="light"
          badge={true}
          subtitle="Customer Portal Surface"
        />

        {/* Right side: back-to-ERP (staff only) + user info + sign out / in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* ← Back to Internal App — only visible to internal staff */}
          {isInternalStaff && (
            <a
              href="/dashboard"
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--brown-300)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 0',
                borderBottom: '1px solid transparent',
                transition: 'color 120ms ease, border-color 120ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--cream)';
                e.currentTarget.style.borderBottomColor = 'var(--cream)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--brown-300)';
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
              title="Return to the Internal ERP"
            >
              <span style={{ fontSize: 10, opacity: 0.8 }}>←</span>
              <span>Internal App</span>
            </a>
          )}

          {user ? (
            <>
              {/* User name + email */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--cream)',
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {user.full_name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--brown-300)',
                    display: 'block',
                  }}
                >
                  {user.email}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: 'var(--cream)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background 120ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login?portal=customer')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--cream)',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background 120ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Sub-header Navigation Bar ── */}
      <nav
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid rgba(208, 174, 146, 0.35)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          height: 48,
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 56,
          zIndex: 35,
        }}
      >
        {/* Dashboard — public & customer portal landing overview */}
        <NavLink
          to="/portal"
          end
          style={({ isActive }) => ({
            padding: '13px 4px',
            fontSize: 13,
            fontFamily: 'var(--font-display)',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
            textDecoration: 'none',
            borderBottom: isActive ? '2px solid var(--brown-900)' : '2px solid transparent',
            transition: 'all 120ms ease-out',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          })}
        >
          Dashboard
        </NavLink>

        {/* Furniture Catalogue — visible when logged in AND when logged out (public browseable) */}
        <NavLink
          to="/portal/catalogue"
          style={({ isActive }) => ({
            padding: '13px 4px',
            fontSize: 13,
            fontFamily: 'var(--font-display)',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
            textDecoration: 'none',
            borderBottom: isActive ? '2px solid var(--brown-900)' : '2px solid transparent',
            transition: 'all 120ms ease-out',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          })}
        >
          Furniture Catalogue
        </NavLink>

        {/* My Invoices — visible ONLY when logged in */}
        {user && (
          <NavLink
            to="/portal/invoices"
            style={({ isActive }) => ({
              padding: '13px 4px',
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
              textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--brown-900)' : '2px solid transparent',
              transition: 'all 120ms ease-out',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            })}
          >
            My Invoices
          </NavLink>
        )}
      </nav>

      {/* ── Main content — cream background ── */}
      <main
        style={{
          flex: 1,
          maxWidth: '85rem',
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 64px',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: '20px 0',
          textAlign: 'center',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          borderTop: '1px solid rgba(74, 58, 52, 0.18)',
          color: 'var(--brown-500)',
          backgroundColor: 'var(--cream)',
        }}
      >
        Urban Furniture Customer Portal &bull; Secure Restricted Surface &bull; Offline Double-Entry Ledger
      </footer>
    </div>
  );
};

export default PortalLayout;
