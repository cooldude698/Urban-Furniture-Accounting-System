import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Sales',    to: '/sales'    },
  { label: 'Purchase', to: '/purchase' },
  { label: 'Account',  to: '/account'  },
  { label: 'Report',   to: '/report'   },
] as const;

export default function AppShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Top nav ── */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <nav
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 var(--space-8)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            height: 56,
          }}
        >
          {/* Brand */}
          <NavLink
            to="/dashboard"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--brown-900)',
              marginRight: 'var(--space-8)',
              letterSpacing: '-0.01em',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Urban Furniture
          </NavLink>

          {/* Nav items — exactly four */}
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 15,
                color: isActive ? 'var(--brown-700)' : 'var(--brown-500)',
                textDecoration: 'none',
                padding: '0 var(--space-4)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                borderBottom: isActive
                  ? '2px solid var(--brown-700)'
                  : '2px solid transparent',
                transition: 'color 150ms ease-out, border-color 150ms ease-out',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Page content ── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1440,
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-8)',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
