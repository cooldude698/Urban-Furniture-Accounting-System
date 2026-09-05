import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export interface PortalUser {
  id: number;
  login_id: string;
  email: string;
  full_name: string;
}

interface PortalAuthContextValue {
  user: PortalUser | null;
  logout: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) {
    throw new Error('usePortalAuth must be used inside PortalAuthGuard');
  }
  return ctx;
}

export const PortalAuthGuard: React.FC = () => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/portal/me')
      .then(res => res.json())
      .then(json => {
        if (json.data?.user) {
          setUser(json.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // best effort
    }
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-brown-800 font-display text-sm font-semibold">
        Initializing Portal Surface...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <PortalAuthContext.Provider value={{ user, logout }}>
      <Outlet />
    </PortalAuthContext.Provider>
  );
};
