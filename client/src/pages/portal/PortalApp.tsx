import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { PortalAuthProvider, PortalAuthGuard } from './PortalAuthGuard';
import { PortalLayout } from './PortalLayout';
import { PortalLogin } from './PortalLogin';
import { PortalInviteAccept } from './PortalInviteAccept';
import { PortalInvoiceList } from './PortalInvoiceList';
import { PortalInvoiceDetail } from './PortalInvoiceDetail';
import { PortalBillList } from './PortalBillList';
import { PortalBillDetail } from './PortalBillDetail';
import { PortalPaymentList } from './PortalPaymentList';
import { PortalCataloguePage } from './PortalCataloguePage';
import { PortalProductViewerPage } from './PortalProductViewerPage';

/**
 * Portal route tree.
 *
 * Public Standalone – /portal/login, /portal/accept-invite
 * Portal Surface (wrapped by PortalLayout with sub-header navigation)
 *   - Public browseable: /portal/catalogue, /portal/catalogue/:id
 *   - Authenticated (behind PortalAuthGuard):
 *       /portal/invoices, /portal/invoices/:id,
 *       /portal/payments,
 *       /portal/bills, /portal/bills/:id
 */
export const PortalApp: React.FC = () => {
  return (
    <PortalAuthProvider>
      <Routes>
        {/* ── Public standalone auth routes ── */}
        <Route path="login" element={<PortalLogin />} />
        <Route path="accept-invite" element={<PortalInviteAccept />} />

        {/* ── All portal pages inside PortalLayout (Top Header + Nav Bar + Footer) ── */}
        <Route element={<PortalLayout />}>
          {/* Public catalogue routes */}
          <Route path="catalogue" element={<PortalCataloguePage />} />
          <Route path="catalogue/:id" element={<PortalProductViewerPage />} />

          {/* Authenticated customer & vendor routes */}
          <Route element={<PortalAuthGuard />}>
            <Route index element={<Navigate to="invoices" replace />} />
            <Route path="invoices" element={<PortalInvoiceList />} />
            <Route path="invoices/:id" element={<PortalInvoiceDetail />} />
            <Route path="payments" element={<PortalPaymentList />} />
            <Route path="bills" element={<PortalBillList />} />
            <Route path="bills/:id" element={<PortalBillDetail />} />
          </Route>
        </Route>

        {/* Fallback inside /portal/* */}
        <Route path="*" element={<Navigate to="catalogue" replace />} />
      </Routes>
    </PortalAuthProvider>
  );
};

export default PortalApp;
