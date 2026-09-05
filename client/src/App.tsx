import React, { useState } from 'react';
import { ContactListPage } from './pages/master/ContactListPage';
import { ContactFormPage } from './pages/master/ContactFormPage';
import { ProductListPage } from './pages/master/ProductListPage';
import { ProductFormPage } from './pages/master/ProductFormPage';
import { Users, Package, ShoppingCart, FileSpreadsheet, Building } from 'lucide-react';

type NavigationTab = 'Sales' | 'Purchase' | 'Account' | 'Report';
type ActiveView =
  | 'contact-list'
  | 'contact-form'
  | 'product-list'
  | 'product-form';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('Account');
  const [activeView, setActiveView] = useState<ActiveView>('contact-list');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const navTabs: NavigationTab[] = ['Sales', 'Purchase', 'Account', 'Report'];

  return (
    <div className="min-h-screen flex flex-col bg-cream text-brown-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-surface border-b border-brown-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brown-700 text-cream flex items-center justify-center font-heading font-bold text-lg shadow-sm">
              UF
            </div>
            <div>
              <span className="font-heading font-bold text-brown-900 text-base tracking-tight block">
                Urban Furniture
              </span>
              <span className="text-[10px] uppercase tracking-wider text-brown-500 block font-semibold">
                Double-Entry Accounting
              </span>
            </div>
          </div>

          {/* Primary Top Nav Tabs */}
          <nav className="flex items-center space-x-1">
            {navTabs.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'Account') setActiveView('contact-list');
                  }}
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all relative ${
                    isActive
                      ? 'text-brown-900 font-bold bg-brown-100/70 after:content-[""] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-brown-700'
                      : 'text-brown-600 hover:text-brown-900 hover:bg-brown-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>

          {/* User Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-brown-700 bg-brown-100/60 px-2.5 py-1 rounded-full border border-brown-200">
              Aman · Master Data & Purchase
            </span>
          </div>
        </div>

        {/* Submenu for Account tab */}
        {activeTab === 'Account' && (
          <div className="bg-brown-50/70 border-t border-brown-200/60 px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveView('contact-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'contact-list' || activeView === 'contact-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Contacts
              </button>

              <button
                onClick={() => setActiveView('product-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'product-list' || activeView === 'product-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Products & Services
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'Account' ? (
          <>
            {activeView === 'contact-list' && (
              <ContactListPage
                onSelectContact={id => {
                  setSelectedContactId(id);
                  setActiveView('contact-form');
                }}
                onNewContact={() => {
                  setSelectedContactId(null);
                  setActiveView('contact-form');
                }}
              />
            )}

            {activeView === 'contact-form' && (
              <ContactFormPage
                contactId={selectedContactId}
                onBack={() => setActiveView('contact-list')}
                onSaved={id => {
                  setSelectedContactId(id);
                  setActiveView('contact-list');
                }}
                onHome={() => setActiveView('contact-list')}
              />
            )}

            {activeView === 'product-list' && (
              <ProductListPage
                onSelectProduct={id => {
                  setSelectedProductId(id);
                  setActiveView('product-form');
                }}
                onNewProduct={() => {
                  setSelectedProductId(null);
                  setActiveView('product-form');
                }}
              />
            )}

            {activeView === 'product-form' && (
              <ProductFormPage
                productId={selectedProductId}
                onBack={() => setActiveView('product-list')}
                onSaved={id => {
                  setSelectedProductId(id);
                  setActiveView('product-list');
                }}
                onHome={() => setActiveView('product-list')}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div className="max-w-md bg-surface p-8 rounded-2xl border border-brown-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-brown-100 text-brown-700 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                {activeTab[0]}
              </div>
              <h2 className="text-xl font-heading font-bold text-brown-900 mb-2">{activeTab} Module</h2>
              <p className="text-sm text-brown-500 mb-6">
                Master Data (Contacts & Products) is fully operational in the Account menu.
              </p>
              <button
                onClick={() => {
                  setActiveTab('Account');
                  setActiveView('contact-list');
                }}
                className="bg-brown-700 text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-brown-800"
              >
                Go to Master Data
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
