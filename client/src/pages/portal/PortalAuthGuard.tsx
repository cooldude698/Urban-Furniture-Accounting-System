import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export interface PortalUser {
  id: number;
  login_id: string;
  email: string;
  full_name: string;
}

export interface PortalAuthContextValue {
  user: PortalUser | null;
  logout: () => Promise<void>;
  checking?: boolean;
}

const PortalAuthContext = createContext<PortalAuthContextValue>({
  user: null,
  logout: async () => {},
  checking: false,
});

export function usePortalAuth(): PortalAuthContextValue {
  return useContext(PortalAuthContext);
}

export const PortalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/portal/me')
      .then((res) => res.json())
      .then((json) => {
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

  return (
    <PortalAuthContext.Provider value={{ user, logout, checking }}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const PortalAuthGuard: React.FC = () => {
  const { user, checking } = usePortalAuth();

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

  return <Outlet />;
};
