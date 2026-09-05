import React, { useState } from 'react';
import { SalesOrderList } from './pages/SalesOrderList';
import { SalesOrderForm } from './pages/SalesOrderForm';

type ViewMode = 'list' | 'form';
type NavTab = 'Sales' | 'Purchase' | 'Account' | 'Report';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Sales');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

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
                  setViewMode('list');
                  setSelectedOrderId(null);
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

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'Sales' ? (
          viewMode === 'list' ? (
            <SalesOrderList
              onSelectOrder={id => {
                setSelectedOrderId(id);
                setViewMode('form');
              }}
              onNewOrder={() => {
                setSelectedOrderId(null);
                setViewMode('form');
              }}
            />
          ) : (
            <SalesOrderForm
              orderId={selectedOrderId}
              onBack={() => {
                setViewMode('list');
                setSelectedOrderId(null);
              }}
              onNavigateToInvoice={invId => {
                alert(`Invoice #${invId} created. Customer invoice module will open this.`);
                setViewMode('list');
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
