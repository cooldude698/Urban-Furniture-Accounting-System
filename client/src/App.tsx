import React, { useState, useEffect } from 'react';
import { ContactListPage } from './pages/master/ContactListPage';
import { ContactFormPage } from './pages/master/ContactFormPage';
import { ProductListPage } from './pages/master/ProductListPage';
import { ProductFormPage } from './pages/master/ProductFormPage';
import { ProductKanbanPage } from './pages/master/ProductKanbanPage';
import { AccountListPage } from './pages/master/AccountListPage';
import { AccountFormPage } from './pages/master/AccountFormPage';
import { JournalListPage } from './pages/master/JournalListPage';
import { JournalFormPage } from './pages/master/JournalFormPage';
import { AnalyticListPage } from './pages/master/AnalyticListPage';
import { AnalyticFormPage } from './pages/master/AnalyticFormPage';
import { VendorStatementPage } from './pages/master/VendorStatementPage';

// Purchase
import { POListPage } from './pages/purchase/POListPage';
import { POFormPage } from './pages/purchase/POFormPage';
import { VendorBillListPage } from './pages/purchase/VendorBillListPage';
import { VendorBillFormPage } from './pages/purchase/VendorBillFormPage';

// Sales
import { SalesOrderListPage } from './pages/sales/SalesOrderListPage';
import { SalesOrderFormPage } from './pages/sales/SalesOrderFormPage';
import { CustomerInvoiceListPage } from './pages/sales/CustomerInvoiceListPage';
import { CustomerInvoiceFormPage } from './pages/sales/CustomerInvoiceFormPage';
import { ReceivablesPage } from './pages/sales/ReceivablesPage';
import { RegisterPaymentPage } from './pages/sales/RegisterPaymentPage';

// Budgets & Reports
import BudgetListPage from './pages/budget/BudgetListPage';
import BalanceSheetPage from './pages/reports/BalanceSheetPage';
import ProfitLossPage from './pages/reports/ProfitLossPage';
import BudgetReportPage from './pages/reports/BudgetReportPage';

import {
  Users,
  Package,
  Landmark,
  BookOpen,
  PieChart,
  ShoppingCart,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Layers,
  Plus,
  ArrowRight,
  Wallet,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export type NavigationTab = 'Dashboard' | 'Sales' | 'Purchase' | 'Account' | 'Report';

export type ActiveView =
  // Dashboard
  | 'dashboard-home'
  // Sales
  | 'so-list'
  | 'so-form'
  | 'inv-list'
  | 'inv-form'
  | 'receivables'
  | 'register-payment'
  // Purchase
  | 'po-list'
  | 'po-form'
  | 'bill-list'
  | 'bill-form'
  | 'vendor-statement'
  // Account & Master
  | 'contact-list'
  | 'contact-form'
  | 'product-list'
  | 'product-kanban'
  | 'product-form'
  | 'account-list'
  | 'account-form'
  | 'journal-list'
  | 'journal-form'
  | 'analytic-list'
  | 'analytic-form'
  | 'budget-list'
  // Reports
  | 'report-balancesheet'
  | 'report-pnl'
  | 'report-budget';

export interface AppProps {
  initialTab?: NavigationTab;
  initialView?: ActiveView;
  hideHeader?: boolean;
}

export function App({ initialTab = 'Dashboard', initialView = 'dashboard-home', hideHeader = false }: AppProps = {}) {
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialTab);
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  // Selected IDs for Form Views
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [selectedAnalyticId, setSelectedAnalyticId] = useState<number | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [selectedSOId, setSelectedSOId] = useState<number | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);

  // Live Dashboard data
  const [stats, setStats] = useState<{
    sales: { all: number; confirmed: number; draft: number };
    purchase: { all: number; confirmed: number; draft: number };
    budget: { achieved: number; budget: number; committed: number };
  }>({
    sales: { all: 200, confirmed: 200, draft: 0 },
    purchase: { all: 130, confirmed: 130, draft: 0 },
    budget: { achieved: 3, budget: 6, committed: 6 },
  });

  const [kpis, setKpis] = useState<{
    cash: string;
    bank: string;
    receivable: string;
    payable: string;
    netIncomeThisMonth: string;
  }>({
    cash: '3605670.03',
    bank: '17664082.19',
    receivable: '13880844.37',
    payable: '18529734.82',
    netIncomeThisMonth: '0.00',
  });

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(json => {
        if (json.data) setStats(json.data);
      })
      .catch(() => {});

    fetch('/api/dashboard/kpi')
      .then(res => res.json())
      .then(json => {
        if (json.data) setKpis(json.data);
      })
      .catch(() => {});

    fetch('/api/dashboard/activity')
      .then(res => res.json())
      .then(json => {
        if (json.data) setActivities(json.data);
      })
      .catch(() => {});
  }, []);

  const navTabs: NavigationTab[] = ['Dashboard', 'Sales', 'Purchase', 'Account', 'Report'];

  const formatFullCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0.00';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2)} L`;
    }
    return formatFullCurrency(val);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-cream text-brown-900 font-sans ${hideHeader ? 'min-h-0' : ''}`}>
      {/* Top Navbar */}
      <header className={`bg-surface border-b border-brown-200 sticky top-0 z-30 shadow-sm ${hideHeader ? 'border-t-0 shadow-none' : ''}`}>
        {!hideHeader && (
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setActiveTab('Dashboard');
                setActiveView('dashboard-home');
              }}
            >
              <div className="w-9 h-9 rounded-lg bg-brown-700 text-cream flex items-center justify-center font-heading font-bold text-lg shadow-sm group-hover:bg-brown-800 transition-colors">
                UF
              </div>
              <div>
                <span className="font-heading font-bold text-brown-900 text-base tracking-tight block group-hover:text-brown-700 transition-colors">
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
                      if (tab === 'Dashboard') setActiveView('dashboard-home');
                      if (tab === 'Sales') setActiveView('so-list');
                      if (tab === 'Purchase') setActiveView('po-list');
                      if (tab === 'Account') setActiveView('contact-list');
                      if (tab === 'Report') setActiveView('report-balancesheet');
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
              <span className="text-xs font-medium text-brown-700 bg-brown-100/60 px-3 py-1 rounded-full border border-brown-200 shadow-2xs">
                Urban Furniture · Executive Suite
              </span>
            </div>
          </div>
        )}

        {/* Submenu for Sales tab */}
        {activeTab === 'Sales' && (
          <div className="bg-brown-50/80 border-t border-brown-200/60 px-6 py-2 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveView('so-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'so-list' || activeView === 'so-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Sales order
              </button>

              <button
                onClick={() => setActiveView('inv-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'inv-list' || activeView === 'inv-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Sale Invoice
              </button>

              <button
                onClick={() => setActiveView('register-payment')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'register-payment'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Receipt
              </button>
            </div>
          </div>
        )}

        {/* Submenu for Purchase tab */}
        {activeTab === 'Purchase' && (
          <div className="bg-brown-50/80 border-t border-brown-200/60 px-6 py-2 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveView('po-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'po-list' || activeView === 'po-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Purchase Order
              </button>

              <button
                onClick={() => setActiveView('bill-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'bill-list' || activeView === 'bill-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Purchase Bill
              </button>

              <button
                onClick={() => setActiveView('vendor-statement')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'vendor-statement'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payment
              </button>
            </div>
          </div>
        )}

        {/* Submenu for Account tab */}
        {activeTab === 'Account' && (
          <div className="bg-brown-50/80 border-t border-brown-200/60 px-6 py-2 shadow-2xs">
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
                Contact
              </button>

              <button
                onClick={() => setActiveView('product-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'product-list' || activeView === 'product-kanban' || activeView === 'product-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Product
              </button>

              <button
                onClick={() => setActiveView('analytic-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'analytic-list' || activeView === 'analytic-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                Analyticals
              </button>

              <button
                onClick={() => setActiveView('budget-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'budget-list'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Analytical Budget
              </button>

              <button
                onClick={() => setActiveView('account-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'account-list' || activeView === 'account-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Chart of Account
              </button>

              <button
                onClick={() => setActiveView('journal-list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'journal-list' || activeView === 'journal-form'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Journals
              </button>

              <button
                onClick={() => setActiveView('journal-list')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors text-brown-700 hover:bg-brown-200/60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Journal Entries
              </button>
            </div>
          </div>
        )}

        {/* Submenu for Report tab */}
        {activeTab === 'Report' && (
          <div className="bg-brown-50/80 border-t border-brown-200/60 px-6 py-2 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveView('report-balancesheet')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'report-balancesheet'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Balancesheet
              </button>

              <button
                onClick={() => setActiveView('report-pnl')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'report-pnl'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Profit and Loss
              </button>

              <button
                onClick={() => setActiveView('report-budget')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeView === 'report-budget'
                    ? 'bg-brown-700 text-cream shadow-xs'
                    : 'text-brown-700 hover:bg-brown-200/60'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                Budget Report
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {/* ═════════════════════════════════════════════════════════ */}
        {/* 1. DASHBOARD VIEW (Exact wireframe reproduction)        */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Dashboard' && (
          <div className="max-w-6xl mx-auto w-full p-6 md:p-8 flex flex-col gap-6">
            {/* Top KPI Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-brown-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-brown-600 mb-1 font-medium">
                  <span>Cash in Hand</span>
                  <Wallet className="w-4 h-4 text-emerald-700" />
                </div>
                <div
                  className="text-xl font-bold font-mono text-brown-900 truncate"
                  title={formatFullCurrency(kpis.cash)}
                >
                  {formatCurrency(kpis.cash)}
                </div>
              </div>

              <div className="bg-surface border border-brown-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-brown-600 mb-1 font-medium">
                  <span>Bank Balance</span>
                  <Building className="w-4 h-4 text-blue-700" />
                </div>
                <div
                  className="text-xl font-bold font-mono text-brown-900 truncate"
                  title={formatFullCurrency(kpis.bank)}
                >
                  {formatCurrency(kpis.bank)}
                </div>
              </div>

              <div className="bg-surface border border-brown-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-brown-600 mb-1 font-medium">
                  <span>Total Receivable</span>
                  <ArrowDownLeft className="w-4 h-4 text-amber-700" />
                </div>
                <div
                  className="text-xl font-bold font-mono text-brown-900 truncate"
                  title={formatFullCurrency(kpis.receivable)}
                >
                  {formatCurrency(kpis.receivable)}
                </div>
              </div>

              <div className="bg-surface border border-brown-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-brown-600 mb-1 font-medium">
                  <span>Total Payable</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-700" />
                </div>
                <div
                  className="text-xl font-bold font-mono text-brown-900 truncate"
                  title={formatFullCurrency(kpis.payable)}
                >
                  {formatCurrency(kpis.payable)}
                </div>
              </div>
            </div>

            {/* Wireframe Hero Cards */}
            <div className="flex flex-col gap-5">
              {/* ── CARD 1: SALES ── */}
              <div className="bg-surface border-2 border-brown-300 rounded-2xl p-6 shadow-sm hover:border-brown-400 transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-heading font-bold text-brown-900 tracking-tight">Sales</h2>
                  <button
                    onClick={() => {
                      setActiveTab('Sales');
                      setSelectedSOId(null);
                      setActiveView('so-form');
                    }}
                    className="bg-sky-400 hover:bg-sky-500 text-sky-950 px-6 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    New
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => {
                      setActiveTab('Sales');
                      setActiveView('so-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-brown-600 font-semibold block mb-1">
                      All
                    </span>
                    <span className="text-2xl font-bold text-brown-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.sales.all}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Sales');
                      setActiveView('so-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
                      Confirmed
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.sales.confirmed}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Sales');
                      setActiveView('so-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold block mb-1">
                      Draft
                    </span>
                    <span className="text-2xl font-bold text-amber-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.sales.draft}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: PURCHASE ── */}
              <div className="bg-surface border-2 border-brown-300 rounded-2xl p-6 shadow-sm hover:border-brown-400 transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-heading font-bold text-brown-900 tracking-tight">Purchase</h2>
                  <button
                    onClick={() => {
                      setActiveTab('Purchase');
                      setSelectedPOId(null);
                      setActiveView('po-form');
                    }}
                    className="bg-sky-400 hover:bg-sky-500 text-sky-950 px-6 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    New
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => {
                      setActiveTab('Purchase');
                      setActiveView('po-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-brown-600 font-semibold block mb-1">
                      All
                    </span>
                    <span className="text-2xl font-bold text-brown-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.purchase.all}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Purchase');
                      setActiveView('po-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
                      Confirmed
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.purchase.confirmed}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Purchase');
                      setActiveView('po-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold block mb-1">
                      Draft
                    </span>
                    <span className="text-2xl font-bold text-amber-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.purchase.draft}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── CARD 3: BUDGET REPORTS ── */}
              <div className="bg-surface border-2 border-brown-300 rounded-2xl p-6 shadow-sm hover:border-brown-400 transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-heading font-bold text-brown-900 tracking-tight">Budget Reports</h2>
                  <button
                    onClick={() => {
                      setActiveTab('Report');
                      setActiveView('report-budget');
                    }}
                    className="bg-sky-400 hover:bg-sky-500 text-sky-950 px-6 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Report
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => {
                      setActiveTab('Report');
                      setActiveView('report-budget');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
                      Achieved
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.budget.achieved}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Account');
                      setActiveView('budget-list');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-brown-600 font-semibold block mb-1">
                      Budget
                    </span>
                    <span className="text-2xl font-bold text-brown-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.budget.budget}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('Report');
                      setActiveView('report-budget');
                    }}
                    className="bg-cream/70 hover:bg-cream border border-brown-300 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold block mb-1">
                      Committed
                    </span>
                    <span className="text-2xl font-bold text-amber-900 group-hover:scale-105 inline-block transition-transform">
                      {stats.budget.committed}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transaction Activity */}
            {activities.length > 0 && (
              <div className="bg-surface border border-brown-200 rounded-2xl p-6 shadow-xs mt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brown-600" />
                    <h3 className="font-heading font-bold text-base text-brown-900">Recent Transactions</h3>
                  </div>
                  <span className="text-xs text-brown-500">Live Double-Entry Feed</span>
                </div>

                <div className="divide-y divide-brown-100 text-xs">
                  {activities.map(act => (
                    <div key={`${act.type}-${act.id}`} className="py-2.5 flex items-center justify-between hover:bg-brown-50/50 px-2 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold font-mono text-brown-900">{act.number}</span>
                        <span className="text-brown-600">· {act.partner || 'General Partner'}</span>
                        <span className="bg-brown-100 text-brown-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {act.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="font-mono font-semibold text-brown-900 truncate max-w-[120px]"
                          title={formatFullCurrency(act.total)}
                        >
                          {formatCurrency(act.total)}
                        </span>
                        <span className="text-brown-500">{act.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* 2. SALES MODULE VIEWS                                   */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Sales' && (
          <div className="p-6 max-w-7xl mx-auto w-full">
            {activeView === 'so-list' && (
              <SalesOrderListPage
                onSelectOrder={id => {
                  setSelectedSOId(id);
                  setActiveView('so-form');
                }}
                onNewOrder={() => {
                  setSelectedSOId(null);
                  setActiveView('so-form');
                }}
              />
            )}

            {activeView === 'so-form' && (
              <SalesOrderFormPage
                orderId={selectedSOId}
                onBack={() => setActiveView('so-list')}
                onSaved={id => {
                  setSelectedSOId(id);
                  setActiveView('so-list');
                }}
              />
            )}

            {activeView === 'inv-list' && (
              <CustomerInvoiceListPage
                onSelectInvoice={id => {
                  setSelectedInvId(id);
                  setActiveView('inv-form');
                }}
                onNewInvoice={() => {
                  setSelectedInvId(null);
                  setActiveView('inv-form');
                }}
              />
            )}

            {activeView === 'inv-form' && (
              <CustomerInvoiceFormPage
                invoiceId={selectedInvId}
                onBack={() => setActiveView('inv-list')}
                onSaved={id => {
                  setSelectedInvId(id);
                  setActiveView('inv-list');
                }}
              />
            )}

            {activeView === 'receivables' && (
              <ReceivablesPage />
            )}

            {activeView === 'register-payment' && (
              <RegisterPaymentPage />
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* 3. PURCHASE MODULE VIEWS                                */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Purchase' && (
          <>
            {/* Purchase Orders */}
            {activeView === 'po-list' && (
              <POListPage
                onSelectPO={id => {
                  setSelectedPOId(id);
                  setActiveView('po-form');
                }}
                onNewPO={() => {
                  setSelectedPOId(null);
                  setActiveView('po-form');
                }}
              />
            )}
            {activeView === 'po-form' && (
              <POFormPage
                poId={selectedPOId}
                onBack={() => setActiveView('po-list')}
                onSaved={id => {
                  setSelectedPOId(id);
                  setActiveView('po-list');
                }}
                onHome={() => setActiveView('po-list')}
                onCreateBillSuccess={billId => {
                  setSelectedBillId(billId);
                  setActiveView('bill-form');
                }}
              />
            )}

            {/* Vendor Bills */}
            {activeView === 'bill-list' && (
              <VendorBillListPage
                onSelectBill={id => {
                  setSelectedBillId(id);
                  setActiveView('bill-form');
                }}
                onNewBill={() => {
                  setSelectedBillId(null);
                  setActiveView('bill-form');
                }}
              />
            )}
            {activeView === 'bill-form' && (
              <VendorBillFormPage
                billId={selectedBillId}
                onBack={() => setActiveView('bill-list')}
                onSaved={id => {
                  setSelectedBillId(id);
                  setActiveView('bill-list');
                }}
                onHome={() => setActiveView('bill-list')}
                onViewPO={poId => {
                  setSelectedPOId(poId);
                  setActiveView('po-form');
                }}
                onViewJournalEntry={jeId => {
                  alert(`Linked to Journal Entry #${jeId}. The journal entry records balanced Debits and Credits for this transaction in the General Ledger.`);
                }}
              />
            )}


            {/* Vendor Statement / Payment */}
            {activeView === 'vendor-statement' && (
              <VendorStatementPage
                contactId={selectedContactId || 1}
                onBack={() => setActiveView('bill-list')}
                onHome={() => setActiveView('bill-list')}
              />
            )}
          </>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* 4. ACCOUNT & MASTER DATA VIEWS                          */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Account' && (
          <>
            {/* Contacts */}
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
                onNew={() => {
                  setSelectedContactId(null);
                  setActiveView('contact-form');
                }}
                onViewBills={vendorId => {
                  setActiveTab('Purchase');
                  setActiveView('bill-list');
                }}
                onViewPOs={vendorId => {
                  setActiveTab('Purchase');
                  setActiveView('po-list');
                }}
                onViewStatement={contactId => {
                  setSelectedContactId(contactId);
                  setActiveView('vendor-statement');
                }}
              />
            )}
            {activeView === 'vendor-statement' && (
              <VendorStatementPage
                contactId={selectedContactId || 1}
                onBack={() => setActiveView('contact-list')}
                onHome={() => setActiveView('contact-list')}
              />
            )}

            {/* Products */}
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
            {activeView === 'product-kanban' && (
              <ProductKanbanPage
                onSelectProduct={id => {
                  setSelectedProductId(id);
                  setActiveView('product-form');
                }}
                onNewProduct={() => {
                  setSelectedProductId(null);
                  setActiveView('product-form');
                }}
                onToggleViewMode={() => setActiveView('product-list')}
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
                onNew={() => {
                  setSelectedProductId(null);
                  setActiveView('product-form');
                }}
              />
            )}

            {/* Chart of Accounts */}
            {activeView === 'account-list' && (
              <AccountListPage
                onSelectAccount={id => {
                  setSelectedAccountId(id);
                  setActiveView('account-form');
                }}
                onNewAccount={() => {
                  setSelectedAccountId(null);
                  setActiveView('account-form');
                }}
              />
            )}
            {activeView === 'account-form' && (
              <AccountFormPage
                accountId={selectedAccountId}
                onBack={() => setActiveView('account-list')}
                onSaved={id => {
                  setSelectedAccountId(id);
                  setActiveView('account-list');
                }}
                onHome={() => setActiveView('account-list')}
                onNew={() => {
                  setSelectedAccountId(null);
                  setActiveView('account-form');
                }}
              />
            )}

            {/* Journals */}
            {activeView === 'journal-list' && (
              <JournalListPage
                onSelectJournal={id => {
                  setSelectedJournalId(id);
                  setActiveView('journal-form');
                }}
                onNewJournal={() => {
                  setSelectedJournalId(null);
                  setActiveView('journal-form');
                }}
              />
            )}
            {activeView === 'journal-form' && (
              <JournalFormPage
                journalId={selectedJournalId}
                onBack={() => setActiveView('journal-list')}
                onSaved={id => {
                  setSelectedJournalId(id);
                  setActiveView('journal-list');
                }}
                onHome={() => setActiveView('journal-list')}
                onNew={() => {
                  setSelectedJournalId(null);
                  setActiveView('journal-form');
                }}
              />
            )}

            {/* Analytic Accounts */}
            {activeView === 'analytic-list' && (
              <AnalyticListPage
                onSelectAnalytic={id => {
                  setSelectedAnalyticId(id);
                  setActiveView('analytic-form');
                }}
                onNewAnalytic={() => {
                  setSelectedAnalyticId(null);
                  setActiveView('analytic-form');
                }}
              />
            )}
            {activeView === 'analytic-form' && (
              <AnalyticFormPage
                analyticId={selectedAnalyticId}
                onBack={() => setActiveView('analytic-list')}
                onSaved={id => {
                  setSelectedAnalyticId(id);
                  setActiveView('analytic-list');
                }}
                onHome={() => setActiveView('analytic-list')}
                onNew={() => {
                  setSelectedAnalyticId(null);
                  setActiveView('analytic-form');
                }}
              />
            )}

            {/* Analytical Budget */}
            {activeView === 'budget-list' && (
              <div className="p-6 max-w-7xl mx-auto w-full">
                <BudgetListPage />
              </div>
            )}
          </>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* 5. REPORT MODULE VIEWS                                  */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === 'Report' && (
          <div className="p-6 max-w-7xl mx-auto w-full">
            {activeView === 'report-balancesheet' && (
              <BalanceSheetPage />
            )}

            {activeView === 'report-pnl' && (
              <ProfitLossPage />
            )}

            {activeView === 'report-budget' && (
              <BudgetReportPage />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
