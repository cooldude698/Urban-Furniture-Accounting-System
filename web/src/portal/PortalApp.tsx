import React, { useState, useEffect } from 'react';
import { PortalLayout } from './PortalLayout';
import { PortalLogin } from './PortalLogin';
import { PortalInviteAccept } from './PortalInviteAccept';
import { PortalInvoiceList } from './PortalInvoiceList';
import { PortalInvoiceDetail } from './PortalInvoiceDetail';

interface PortalUser {
  id: number;
  login_id: string;
  email: string;
  full_name: string;
}

interface PortalAppProps {
  onBackToMainApp?: () => void;
}

export const PortalApp: React.FC<PortalAppProps> = ({ onBackToMainApp }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [view, setView] = useState<'login' | 'invite' | 'invoices' | 'invoice_detail'>('login');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check auth session
  useEffect(() => {
    fetch('/api/portal/me')
      .then(res => res.json())
      .then(json => {
        if (json.data?.user) {
          setUser(json.data.user);
          setView('invoices');
        } else {
          setUser(null);
          setView('login');
        }
      })
      .catch(() => {
        setUser(null);
        setView('login');
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setView('login');
    setSelectedInvoiceId(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-400 font-mono text-sm">
        Initializing Portal Surface...
      </div>
    );
  }

  return (
    <PortalLayout user={user} onLogout={handleLogout}>
      {/* Optional link back to main app for reviewers */}
      {onBackToMainApp && (
        <div className="mb-4 text-right">
          <button
            onClick={onBackToMainApp}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
          >
            ← Switch to Internal ERP Surface
          </button>
        </div>
      )}

      {view === 'login' && (
        <PortalLogin
          onLoginSuccess={loggedInUser => {
            setUser(loggedInUser);
            setView('invoices');
          }}
          onOpenInviteModal={() => setView('invite')}
        />
      )}

      {view === 'invite' && (
        <PortalInviteAccept
          onBackToLogin={() => setView('login')}
          onPasswordSetSuccess={() => setView('login')}
        />
      )}

      {view === 'invoices' && (
        <PortalInvoiceList
          onSelectInvoice={invId => {
            setSelectedInvoiceId(invId);
            setView('invoice_detail');
          }}
        />
      )}

      {view === 'invoice_detail' && selectedInvoiceId && (
        <PortalInvoiceDetail
          invoiceId={selectedInvoiceId}
          onBack={() => {
            setSelectedInvoiceId(null);
            setView('invoices');
          }}
        />
      )}
    </PortalLayout>
  );
};
