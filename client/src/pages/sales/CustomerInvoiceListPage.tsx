import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomerInvoiceDTO } from '@shared/schemas/invoice';

export interface CustomerInvoiceListPageProps {
  onSelectInvoice?: (id: number) => void;
  onNewInvoice?: () => void;
}

export const CustomerInvoiceListPage: React.FC<CustomerInvoiceListPageProps> = ({ onSelectInvoice, onNewInvoice }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<CustomerInvoiceDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(json => {
        if (json.data) setInvoices(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus || inv.paymentStatus === filterStatus;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">Customer Invoices</h1>
          <p className="text-sm text-brown-700">Official receivables recognized on the double-entry ledger</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface border border-brown-300 rounded-[6px] px-3 py-1.5 text-sm text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="not_paid">Not Paid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <button
            onClick={() => onNewInvoice ? onNewInvoice() : navigate('/sales/invoices/new')}
            className="bg-brown-900 text-cream px-4 py-2 rounded-[6px] text-sm font-semibold hover:bg-brown-700 transition-colors shadow-sm"
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className="bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                <th className="p-3.5">Invoice Number</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Invoice Date</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right font-mono-num">Amount Due</th>
                <th className="p-3.5 text-right font-mono-num">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brown-500">
                    Loading customer invoices...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brown-500">
                    No invoices found. Click <strong>+ New Invoice</strong> or convert from a Sales Order.
                  </td>
                </tr>
              ) : (
                filtered.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice ? onSelectInvoice(inv.id) : navigate(`/sales/invoices/${inv.id}`)}
                    className="hover:bg-brown-100/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-semibold text-brown-900">
                      {inv.number}
                      {inv.soNumber && (
                        <span className="block text-[10px] text-brown-500 font-normal">From {inv.soNumber}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-brown-700">{inv.customerName || `Customer #${inv.customerId}`}</td>
                    <td className="p-3.5 text-brown-500">{inv.invoiceDate}</td>
                    <td className="p-3.5">
                      <StatusBadge status={((inv.paymentStatus || inv.status) as any) || 'draft'} />
                    </td>
                    <td className="p-3.5 text-right font-mono-num text-danger font-medium">₹{inv.amountDue}</td>
                    <td className="p-3.5 text-right font-mono-num font-bold text-brown-900">₹{inv.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CustomerInvoiceListPage;
