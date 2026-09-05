import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import AppShell from './components/layout/AppShell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Placeholder pages — replaced as phases land
const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 32, fontFamily: 'var(--font-body)', color: 'var(--brown-700)' }}>
    <p style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{name}</p>
    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--brown-500)' }}>Coming soon</p>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/sales" replace />} />
            <Route path="sales/*"    element={<Placeholder name="Sales" />} />
            <Route path="purchase/*" element={<Placeholder name="Purchase" />} />
            <Route path="account/*"  element={<Placeholder name="Account" />} />
            <Route path="report/*"   element={<Placeholder name="Report" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
