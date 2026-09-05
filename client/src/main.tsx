import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import CreateUser from './pages/CreateUser';
import KitchenSink from './pages/KitchenSink';

// Sales Module
import SalesIndexPage from './pages/sales/SalesIndexPage';
import SalesOrderListPage from './pages/sales/SalesOrderListPage';
import SalesOrderFormPage from './pages/sales/SalesOrderFormPage';
import CustomerInvoiceListPage from './pages/sales/CustomerInvoiceListPage';
import CustomerInvoiceFormPage from './pages/sales/CustomerInvoiceFormPage';
import ReceivablesPage from './pages/sales/ReceivablesPage';
import RegisterPaymentPage from './pages/sales/RegisterPaymentPage';

// Purchase Module
import PurchaseIndexPage from './pages/purchase/PurchaseIndexPage';
import {
  POListRoute,
  POFormRoute,
  VendorBillListRoute,
  VendorBillFormRoute,
  VendorStatementRoute,
} from './pages/purchase/PurchaseRoutes';

// Master / Account Module
import AccountIndexPage from './pages/master/AccountIndexPage';
import {
  AccountListRoute,
  AccountFormRoute,
  ContactListRoute,
  ContactFormRoute,
  ProductListRoute,
  ProductKanbanRoute,
  ProductFormRoute,
  JournalListRoute,
  JournalFormRoute,
  AnalyticListRoute,
  AnalyticFormRoute,
} from './pages/master/AccountRoutes';
import BudgetListPage from './pages/budget/BudgetListPage';
import BudgetFormPage from './pages/budget/BudgetFormPage';

// Reports Module
import ReportsIndexPage from './pages/reports/ReportsIndexPage';
import BalanceSheetPage from './pages/reports/BalanceSheetPage';
import ProfitLossPage from './pages/reports/ProfitLossPage';
import BudgetReportPage from './pages/reports/BudgetReportPage';
import VerifyPage from './pages/reports/VerifyPage';
import { App } from './App';

// Customer Portal (Restricted Surface)
import PortalApp from './pages/portal/PortalApp';

import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Auth (no shell) ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-user" element={<CreateUser />} />

            {/* ── Customer Portal (Restricted Surface — no shell) ── */}
            <Route path="/portal/*" element={<PortalApp />} />

            {/* ── Kitchen sink (no shell — full-page design system preview) ── */}
            <Route path="/kitchen-sink" element={<KitchenSink />} />

            {/* ── Standalone complete App (legacy/standalone studio) ── */}
            <Route path="/app/*" element={<App />} />

            {/* ── Main ERP App Shell ── */}
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* ── Sales Module ── */}
              <Route path="sales" element={<SalesIndexPage />}>
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="orders" element={<SalesOrderListPage />} />
                <Route path="orders/new" element={<SalesOrderFormPage />} />
                <Route path="orders/:id" element={<SalesOrderFormPage />} />
                <Route path="invoices" element={<CustomerInvoiceListPage />} />
                <Route path="invoices/new" element={<CustomerInvoiceFormPage />} />
                <Route path="invoices/:id" element={<CustomerInvoiceFormPage />} />
                <Route path="receivables" element={<ReceivablesPage />} />
                <Route path="payments" element={<RegisterPaymentPage />} />
              </Route>

              {/* ── Purchase Module ── */}
              <Route path="purchase" element={<PurchaseIndexPage />}>
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="orders" element={<POListRoute />} />
                <Route path="orders/new" element={<POFormRoute />} />
                <Route path="orders/:id" element={<POFormRoute />} />
                <Route path="bills" element={<VendorBillListRoute />} />
                <Route path="bills/new" element={<VendorBillFormRoute />} />
                <Route path="bills/:id" element={<VendorBillFormRoute />} />
                <Route path="statements" element={<VendorStatementRoute />} />
                <Route path="statements/:id" element={<VendorStatementRoute />} />
              </Route>

              {/* ── Account & Master Data Module ── */}
              <Route path="account" element={<AccountIndexPage />}>
                <Route index element={<Navigate to="coa" replace />} />
                <Route path="coa" element={<AccountListRoute />} />
                <Route path="coa/new" element={<AccountFormRoute />} />
                <Route path="coa/:id" element={<AccountFormRoute />} />
                <Route path="budgets" element={<BudgetListPage />} />
                <Route path="budgets/new" element={<BudgetFormPage />} />
                <Route path="budgets/:id" element={<BudgetFormPage />} />
                <Route path="contacts" element={<ContactListRoute />} />
                <Route path="contacts/new" element={<ContactFormRoute />} />
                <Route path="contacts/:id" element={<ContactFormRoute />} />
                <Route path="products" element={<ProductListRoute />} />
                <Route path="products/new" element={<ProductFormRoute />} />
                <Route path="products/kanban" element={<ProductKanbanRoute />} />
                <Route path="products/:id" element={<ProductFormRoute />} />
                <Route path="journals" element={<JournalListRoute />} />
                <Route path="journals/new" element={<JournalFormRoute />} />
                <Route path="journals/:id" element={<JournalFormRoute />} />
                <Route path="analytics" element={<AnalyticListRoute />} />
                <Route path="analytics/new" element={<AnalyticFormRoute />} />
                <Route path="analytics/:id" element={<AnalyticFormRoute />} />
              </Route>

              {/* ── Reports Module ── */}
              <Route path="report" element={<ReportsIndexPage />}>
                <Route index element={<Navigate to="balance-sheet" replace />} />
                <Route path="balance-sheet" element={<BalanceSheetPage />} />
                <Route path="profit-loss" element={<ProfitLossPage />} />
                <Route path="budget" element={<BudgetReportPage />} />
              </Route>

              {/* ── System Ledger Audit (/verify) ── */}
              <Route path="verify" element={<VerifyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
