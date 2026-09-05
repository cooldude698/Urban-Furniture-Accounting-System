import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { PortalAuthGuard } from './PortalAuthGuard';
import { PortalLayout } from './PortalLayout';
import { PortalLogin } from './PortalLogin';
import { PortalInviteAccept } from './PortalInviteAccept';
import { PortalInvoiceList } from './PortalInvoiceList';
import { PortalInvoiceDetail } from './PortalInvoiceDetail';
import { PortalBillList } from './PortalBillList';
import { PortalBillDetail } from './PortalBillDetail';
import { PortalCataloguePage } from './PortalCataloguePage';
import { PortalProductViewerPage } from './PortalProductViewerPage';

/**
 * Portal route tree.
 *
 * Public  – /portal/login, /portal/accept-invite, /portal/catalogue, /portal/catalogue/:id
 * Protected (behind PortalAuthGuard) – /portal/invoices, /portal/invoices/:id,
 *                                       /portal/bills, /portal/bills/:id
 *
 * The PortalLayout wraps authenticated pages; it reads the user and logout
 * handler from PortalAuthContext so we don't thread them as props.
 */
export const PortalApp: React.FC = () => {
  return (
    <Routes>
      {/* ── Public portal routes ── */}
      <Route path="login" element={<PortalLogin />} />
      <Route path="accept-invite" element={<PortalInviteAccept />} />
      <Route path="catalogue" element={<PortalCataloguePage />} />
      <Route path="catalogue/:id" element={<PortalProductViewerPage />} />

      {/* ── Authenticated portal routes ── */}
      <Route element={<PortalAuthGuard />}>
        <Route element={<PortalLayout />}>
          {/* Default → invoices list */}
          <Route index element={<Navigate to="invoices" replace />} />

          {/* Invoices */}
          <Route path="invoices" element={<PortalInvoiceList />} />
          <Route path="invoices/:id" element={<PortalInvoiceDetail />} />

          {/* Bills */}
          <Route path="bills" element={<PortalBillList />} />
          <Route path="bills/:id" element={<PortalBillDetail />} />
        </Route>
      </Route>

      {/* Fallback inside /portal/* */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default PortalApp;
