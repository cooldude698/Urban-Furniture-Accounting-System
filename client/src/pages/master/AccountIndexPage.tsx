import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Package, Landmark, BookOpen, PieChart, FileBarChart, BookText } from 'lucide-react';

const ACCOUNT_NAV_ITEMS = [
  { label: 'Contacts', to: '/account/contacts', icon: Users },
  { label: 'Products & Services', to: '/account/products', icon: Package },
  { label: 'Chart of Accounts', to: '/account/coa', icon: Landmark },
  { label: 'Journals', to: '/account/journals', icon: BookOpen },
  { label: 'Journal Entries', to: '/account/journal-entries', icon: BookText },
  { label: 'Analyticals', to: '/account/analytics', icon: PieChart },
  { label: 'Analytical Budget', to: '/account/budgets', icon: FileBarChart },
];

export default function AccountIndexPage() {
  const location = useLocation();

  // Hide the secondary sub-nav when viewing or editing a document form to avoid congestion
  const isFormOrDetailView =
    location.pathname.endsWith('/new') ||
    /\/\d+$/.test(location.pathname);

  return (
    <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-5">
      {/* Secondary Sub-Navigation Bar (Shown on list views) */}
      {!isFormOrDetailView && (
        <nav
          aria-label="Account Sub Navigation"
          className="border-b border-brown-200/60 pb-0 flex items-center gap-2 sm:gap-7 overflow-x-auto no-scrollbar"
        >
          {ACCOUNT_NAV_ITEMS.map(({ label, to, icon: Icon }) => {
            const isActive =
              location.pathname === to ||
              location.pathname.startsWith(`${to}/`);

            return (
              <NavLink
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 px-1 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-brown-900 text-brown-900 font-semibold'
                    : 'border-transparent text-brown-700 hover:text-brown-900 hover:border-brown-400'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-brown-900' : 'text-brown-500'
                  }`}
                />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Active Account View */}
      <Outlet />
    </div>
  );
}
