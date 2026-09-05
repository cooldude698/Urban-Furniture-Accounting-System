import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard } from 'lucide-react';
import { MegaMenu } from './MegaMenu';

export default function AppShell() {
  const location = useLocation();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Close mega menu on route change
  useEffect(() => {
    setIsMegaMenuOpen(false);
  }, [location.pathname]);

  const navModules = ['Sales', 'Purchase', 'Account', 'Report'];

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
          {/* Brand + Nav Items */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <NavLink
              to="/dashboard"
              onClick={() => setIsMegaMenuOpen(false)}
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

            {/* 4 Main Nav Items: Clicking any item opens the exact 4-column wireframe menu */}
            <nav style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 4 }}>
              {navModules.map(menuName => {
                const isActive = location.pathname.startsWith(`/${menuName.toLowerCase()}`);

                return (
                  <button
                    key={menuName}
                    type="button"
                    onClick={() => setIsMegaMenuOpen(prev => !prev)}
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
                      padding: '0 16px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 120ms ease-out',
                      outline: 'none',
                      borderRadius: '6px 6px 0 0',
                    }}
                    title="Open on click navigation menu"
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
