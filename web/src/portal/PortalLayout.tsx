import React from 'react';

interface PortalLayoutProps {
  user: {
    id: number;
    login_id: string;
    email: string;
    full_name: string;
  } | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-body">
      {/* Top Portal Header */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-amber-500 rounded-[6px] flex items-center justify-center text-slate-950 font-bold font-display text-base shadow-sm">
            U
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight block text-white">
              Urban Furniture
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-semibold block">
              Customer Portal Surface
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-white block">{user.full_name}</span>
              <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-[6px] transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto py-8 px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        Urban Furniture Customer Portal • Secure Restricted Surface • Offline Double-Entry Ledger
      </footer>
    </div>
  );
};
