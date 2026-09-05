import React, { useState } from 'react';
import { SalesOrderList } from './pages/SalesOrderList';
import { SalesOrderForm } from './pages/SalesOrderForm';
import { CustomerInvoiceList } from './pages/CustomerInvoiceList';
import { CustomerInvoiceForm } from './pages/CustomerInvoiceForm';
import { RegisterPaymentForm } from './pages/RegisterPaymentForm';
import { ReceivablesView } from './pages/ReceivablesView';

type SalesSubMenu = 'orders' | 'invoices' | 'receivables' | 'payments';
type NavTab = 'Sales' | 'Purchase' | 'Account' | 'Report';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Sales');
  const [salesSubMenu, setSalesSubMenu] = useState<SalesSubMenu>('orders');

  // Sales order view state
  const [soViewMode, setSoViewMode] = useState<'list' | 'form'>('list');
  const [selectedSoId, setSelectedSoId] = useState<number | null>(null);

  // Customer invoice view state
  const [invViewMode, setInvViewMode] = useState<'list' | 'form'>('list');
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);

  // Payment register view state
  const [selectedPaymentInvoiceId, setSelectedPaymentInvoiceId] = useState<number | null>(null);

  const navItems: NavTab[] = ['Sales', 'Purchase', 'Account', 'Report'];

  return (
    <div className="min-h-screen bg-cream text-brown-900 flex flex-col font-body">
      {/* Top Navbar */}
      <header className="bg-surface border-b border-brown-300 px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-brown-900 rounded-[6px] flex items-center justify-center text-cream font-bold font-display text-sm">
              U
            </div>
            <span className="font-display font-bold text-lg text-brown-900 tracking-tight">
              Urban Furniture
            </span>
          </div>

          <nav className="flex space-x-6">
            {navItems.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSoViewMode('list');
                  setInvViewMode('list');
                }}
                className={`text-sm font-semibold pb-1 transition-all ${
                  activeTab === tab
                    ? 'text-brown-900 border-b-2 border-brown-700 font-bold'
                    : 'text-brown-700 hover:text-brown-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-brown-700">
          <span className="bg-brown-100 px-2.5 py-1 rounded-full text-brown-900 font-semibold">
            Aryan (Sales & Portal)
          </span>
        </div>
      </header>

      {/* Submenu for Sales (Sales Orders / Customer Invoices / Receivables / Register Payment) */}
      {activeTab === 'Sales' && (
        <div className="bg-surface/70 border-b border-brown-300/60 px-8 py-2 flex items-center space-x-4 text-sm font-medium">
          <button
            onClick={() => {
              setSalesSubMenu('orders');
              setSoViewMode('list');
              setSelectedSoId(null);
            }}
            className={`px-3 py-1 rounded-[6px] transition-colors ${
              salesSubMenu === 'orders'
                ? 'bg-brown-900 text-cream font-semibold'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Sales Orders
          </button>

          <button
            onClick={() => {
              setSalesSubMenu('invoices');
              setInvViewMode('list');
              setSelectedInvId(null);
            }}
            className={`px-3 py-1 rounded-[6px] transition-colors ${
              salesSubMenu === 'invoices'
                ? 'bg-brown-900 text-cream font-semibold'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Customer Invoices
          </button>

          <button
            onClick={() => {
              setSalesSubMenu('receivables');
            }}
            className={`px-3 py-1 rounded-[6px] transition-colors ${
              salesSubMenu === 'receivables'
                ? 'bg-brown-900 text-cream font-semibold'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Receivables Ledger
          </button>

          <button
            onClick={() => {
              setSelectedPaymentInvoiceId(null);
              setSalesSubMenu('payments');
            }}
            className={`px-3 py-1 rounded-[6px] transition-colors ${
              salesSubMenu === 'payments'
                ? 'bg-brown-900 text-cream font-semibold'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Register Payment
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'Sales' ? (
          salesSubMenu === 'orders' ? (
            soViewMode === 'list' ? (
              <SalesOrderList
                onSelectOrder={id => {
                  setSelectedSoId(id);
                  setSoViewMode('form');
                }}
                onNewOrder={() => {
                  setSelectedSoId(null);
                  setSoViewMode('form');
                }}
              />
            ) : (
              <SalesOrderForm
                orderId={selectedSoId}
                onBack={() => {
                  setSoViewMode('list');
                  setSelectedSoId(null);
                }}
                onNavigateToInvoice={invId => {
                  setSelectedInvId(invId);
                  setSalesSubMenu('invoices');
                  setInvViewMode('form');
                }}
              />
            )
          ) : salesSubMenu === 'invoices' ? (
            invViewMode === 'list' ? (
              <CustomerInvoiceList
                onSelectInvoice={id => {
                  setSelectedInvId(id);
                  setInvViewMode('form');
                }}
                onNewInvoice={() => {
                  setSelectedInvId(null);
                  setInvViewMode('form');
                }}
              />
            ) : (
              <CustomerInvoiceForm
                invoiceId={selectedInvId}
                onBack={() => {
                  setInvViewMode('list');
                  setSelectedInvId(null);
                }}
                onNavigateToSO={soId => {
                  setSelectedSoId(soId);
                  setSalesSubMenu('orders');
                  setSoViewMode('form');
                }}
                onRegisterPayment={invId => {
                  setSelectedPaymentInvoiceId(invId);
                  setSalesSubMenu('payments');
                }}
              />
            )
          ) : salesSubMenu === 'receivables' ? (
            <ReceivablesView
              onSelectInvoice={invId => {
                setSelectedInvId(invId);
                setSalesSubMenu('invoices');
                setInvViewMode('form');
              }}
              onRegisterPaymentForInvoice={invId => {
                setSelectedPaymentInvoiceId(invId);
                setSalesSubMenu('payments');
              }}
              onRegisterPaymentForCustomer={() => {
                setSelectedPaymentInvoiceId(null);
                setSalesSubMenu('payments');
              }}
            />
          ) : (
            <RegisterPaymentForm
              initialInvoiceId={selectedPaymentInvoiceId}
              onBack={() => {
                if (selectedPaymentInvoiceId) {
                  setSelectedInvId(selectedPaymentInvoiceId);
                  setSalesSubMenu('invoices');
                  setInvViewMode('form');
                } else {
                  setSalesSubMenu('invoices');
                  setInvViewMode('list');
                }
              }}
              onPaymentSuccess={() => {
                if (selectedPaymentInvoiceId) {
                  setSelectedInvId(selectedPaymentInvoiceId);
                  setSalesSubMenu('invoices');
                  setInvViewMode('form');
                } else {
                  setSalesSubMenu('receivables');
                }
              }}
            />
          )
        ) : (
          <div className="max-w-4xl mx-auto py-16 text-center text-brown-700">
            <h2 className="text-xl font-bold font-display text-brown-900 mb-2">{activeTab} Module</h2>
            <p className="text-sm">Owned by teammates (Vedesh / Aman / Swapnil). You are on Aryan's Sales vertical.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
