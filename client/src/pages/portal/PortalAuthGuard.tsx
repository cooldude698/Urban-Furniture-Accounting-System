import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../lib/axios';

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
  const [user, setUser] = useState<PortalUser | null>(() => {
    try {
      const saved = localStorage.getItem('urban_portal_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/api/portal/me')
      .then((res) => {
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          localStorage.setItem('urban_portal_user', JSON.stringify(res.data.data.user));
        } else {
          setUser(null);
          localStorage.removeItem('urban_portal_user');
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('urban_portal_user');
      })
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // best effort
    }
    localStorage.removeItem('urban_portal_user');
    localStorage.removeItem('urban_portal_token');
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
