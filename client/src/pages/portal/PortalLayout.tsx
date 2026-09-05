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
    <div className="min-h-screen bg-cream text-brown-900 flex flex-col font-body">
      {/* Top Portal Header */}
      <header className="bg-surface text-brown-900 px-8 py-3.5 flex items-center justify-between shadow-xs border-b border-brown-300/40 sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 bg-brown-900 rounded-[6px] flex items-center justify-center text-cream font-bold font-display text-sm shadow-xs">
            UF
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight block text-brown-900 leading-tight">
              Urban Furniture
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-brown-600 font-semibold block">
              Customer Portal Surface
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-5">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-brown-900 block">{user.full_name}</span>
              <span className="text-[11px] text-brown-600 font-mono">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 text-xs font-semibold bg-transparent hover:bg-brown-100 text-brown-800 border border-brown-400 rounded-[8px] transition-colors font-body cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto py-8 px-6 font-body">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-brown-300/30 text-center text-xs text-brown-600 font-medium font-body bg-cream">
        Urban Furniture Customer Portal • Secure Restricted Surface • Offline Double-Entry Ledger
      </footer>
    </div>
  );
};

