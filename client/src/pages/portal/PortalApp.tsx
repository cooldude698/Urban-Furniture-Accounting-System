import React, { useState, useEffect } from 'react';
import { PortalLayout } from './PortalLayout';
import { PortalLogin } from './PortalLogin';
import { PortalInviteAccept } from './PortalInviteAccept';
import { PortalInvoiceList } from './PortalInvoiceList';
import { PortalInvoiceDetail } from './PortalInvoiceDetail';
import { PortalBillList } from './PortalBillList';
import { PortalBillDetail } from './PortalBillDetail';

interface PortalUser {
  id: number;
  login_id: string;
  email: string;
  full_name: string;
}

export const PortalApp: React.FC = () => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills'>('invoices');
  const [view, setView] = useState<'login' | 'invite' | 'main' | 'detail'>('login');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check auth session
  useEffect(() => {
    fetch('/api/portal/me')
      .then(res => res.json())
      .then(json => {
        if (json.data?.user) {
          setUser(json.data.user);
          setView('main');
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
    setSelectedBillId(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-brown-800 font-display text-sm font-semibold">
        Initializing Portal Surface...
      </div>
    );
  }

  return (
    <PortalLayout user={user} onLogout={handleLogout}>
      <div className="mb-4 flex items-center justify-between">
        {user && view === 'main' ? (
          <div className="flex items-center space-x-2 bg-surface p-1 rounded-[10px] border border-brown-300 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('invoices');
                setSelectedInvoiceId(null);
                setSelectedBillId(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-brown-900 text-cream shadow-xs'
                  : 'text-brown-700 hover:text-brown-900'
              }`}
            >
              Customer Invoices
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('bills');
                setSelectedInvoiceId(null);
                setSelectedBillId(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'bills'
                  ? 'bg-brown-900 text-cream shadow-xs'
                  : 'text-brown-700 hover:text-brown-900'
              }`}
            >
              Vendor Bills
            </button>
          </div>
        ) : <div />}

        <a
          href="/sales"
          className="text-xs text-brown-600 hover:text-brown-900 underline font-medium font-body"
        >
          ← Switch to Internal ERP Surface
        </a>
      </div>

      {view === 'login' && (
        <PortalLogin
          onLoginSuccess={loggedInUser => {
            setUser(loggedInUser);
            setView('main');
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

      {view === 'main' && activeTab === 'invoices' && (
        <PortalInvoiceList
          onSelectInvoice={invId => {
            setSelectedInvoiceId(invId);
            setView('detail');
          }}
        />
      )}

      {view === 'main' && activeTab === 'bills' && (
        <PortalBillList
          onSelectBill={billId => {
            setSelectedBillId(billId);
            setView('detail');
          }}
        />
      )}

      {view === 'detail' && activeTab === 'invoices' && selectedInvoiceId && (
        <PortalInvoiceDetail
          invoiceId={selectedInvoiceId}
          onBack={() => {
            setSelectedInvoiceId(null);
            setView('main');
          }}
        />
      )}

      {view === 'detail' && activeTab === 'bills' && selectedBillId && (
        <PortalBillDetail
          billId={selectedBillId}
          onBack={() => {
            setSelectedBillId(null);
            setView('main');
          }}
        />
      )}
    </PortalLayout>
  );
};

export default PortalApp;
