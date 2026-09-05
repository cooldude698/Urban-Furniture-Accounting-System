import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import BudgetListPage from './pages/budget/BudgetListPage';
import BudgetFormPage from './pages/budget/BudgetFormPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import CreateUser from './pages/CreateUser';
import KitchenSink from './pages/KitchenSink';

import ReportsIndexPage from './pages/reports/ReportsIndexPage';
import BalanceSheetPage from './pages/reports/BalanceSheetPage';
import ProfitLossPage from './pages/reports/ProfitLossPage';
import BudgetReportPage from './pages/reports/BudgetReportPage';
import VerifyPage from './pages/reports/VerifyPage';
import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Placeholder — replaced as phases land
const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 32, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
    <p style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{name}</p>
    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--brown-700)' }}>Coming soon</p>
  </div>
);

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

          {/* ── Kitchen sink (no shell — full-page) ── */}
          <Route path="/kitchen-sink" element={<KitchenSink />} />

          {/* ── Main app shell ── */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="sales/*" element={<Placeholder name="Sales" />} />
            <Route path="purchase/*" element={<Placeholder name="Purchase" />} />

            {/* ── Account & Budgets ── */}
            <Route path="account/budgets" element={<BudgetListPage />} />
            <Route path="account/budgets/new" element={<BudgetFormPage />} />
            <Route path="account/budgets/:id" element={<BudgetFormPage />} />
            <Route path="account" element={<Navigate to="/account/budgets" replace />} />
            <Route path="account/*" element={<Placeholder name="Account" />} />

            {/* ── Reports ── */}
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
