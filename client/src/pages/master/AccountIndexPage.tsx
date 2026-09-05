import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Package, Landmark, BookOpen, PieChart, FileBarChart } from 'lucide-react';

const ACCOUNT_NAV_ITEMS = [
  { label: 'Contacts', to: '/account/contacts', icon: Users },
  { label: 'Products & Services', to: '/account/products', icon: Package },
  { label: 'Chart of Accounts', to: '/account/coa', icon: Landmark },
  { label: 'Journals', to: '/account/journals', icon: BookOpen },
  { label: 'Journal Entries', to: '/account/journal-entries', icon: BookOpen },
  { label: 'Analyticals', to: '/account/analytics', icon: PieChart },
  { label: 'Analytical Budget', to: '/account/budgets', icon: FileBarChart },
];

export default function AccountIndexPage() {
  const location = useLocation();

  return (
    <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6">
      {/* Secondary Sub-Navigation Bar */}
      <div className="bg-brown-50/80 border border-brown-200/60 rounded-xl px-4 py-2 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {ACCOUNT_NAV_ITEMS.map(({ label, to, icon: Icon }) => {
            const isActive =
              location.pathname === to ||
              location.pathname.startsWith(`${to}/`);

            return (
              <NavLink
                key={to}
                to={to}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-brown-700 text-cream shadow-xs font-semibold'
                    : 'text-brown-700 hover:bg-brown-200/60 hover:text-brown-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Active Account View */}
      <Outlet />
    </div>
  );
}
