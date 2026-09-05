import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';

export interface CustomerReceivableItem {
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  invoiceCount: number;
}

export interface CustomerInvoiceItem {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  status: string;
}

interface ReceivablesViewProps {
  onSelectInvoice?: (invoiceId: number) => void;
  onRegisterPaymentForInvoice?: (invoiceId: number) => void;
  onRegisterPaymentForCustomer?: (customerId: number) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  onSelectInvoice,
  onRegisterPaymentForInvoice,
  onRegisterPaymentForCustomer,
}) => {
  const [receivables, setReceivables] = useState<CustomerReceivableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);

  // Load receivables summary
  useEffect(() => {
    setLoading(true);
    fetch('/api/receivables')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setReceivables(json.data);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When a customer is expanded, fetch their invoices
  const handleToggleCustomer = async (customerId: number) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerInvoices([]);
      return;
    }

    setExpandedCustomerId(customerId);
    setInvoicesLoading(true);
    try {
      const res = await fetch(`/api/invoices?customerId=${customerId}`);
      const json = await res.json();
      if (json.data) {
        setCustomerInvoices(json.data);
      }
    } catch (err: any) {
      console.error('Failed to load customer invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Aggregated totals across all customers
  const overallInvoiced = receivables.reduce((sum, r) => sum + Number(r.totalInvoiced || 0), 0);
  const overallPaid = receivables.reduce((sum, r) => sum + Number(r.totalPaid || 0), 0);
  const overallOutstanding = receivables.reduce((sum, r) => sum + Number(r.totalOutstanding || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-brown-300 gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900 tracking-tight">
            Accounts Receivable Ledger
          </h1>
          <p className="text-sm text-brown-600 mt-1">
            Customer-wise exposure, settled revenue, and outstanding credit balances
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider block mb-1">
            Total Invoiced Revenue
          </span>
          <span className="text-2xl font-bold font-mono text-brown-900">
            ₹{overallInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-posted uppercase tracking-wider block mb-1">
            Total Collected Receipts
          </span>
          <span className="text-2xl font-bold font-mono text-posted">
            ₹{overallPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Total Outstanding Receivables
          </span>
          <span className="text-2xl font-bold font-mono text-amber-800">
            ₹{overallOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-surface border border-brown-300 rounded-[10px] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-brown-200 bg-brown-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold font-display text-brown-900 uppercase tracking-wider">
            Customer Aging & Credit Summary
          </h2>
          <span className="text-xs text-brown-500">
            Click any row to view customer invoices & statuses
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-brown-500 text-sm">
            Loading receivables ledger...
          </div>
        ) : receivables.length === 0 ? (
          <div className="py-12 text-center text-brown-500 text-sm">
            No confirmed customer invoices found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brown-200 text-xs font-semibold text-brown-600 bg-brown-50/30">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {receivables.map(c => {
                  const isExpanded = expandedCustomerId === c.customerId;
                  const hasDue = Number(c.totalOutstanding) > 0;

                  return (
                    <React.Fragment key={c.customerId}>
                      <tr
                        onClick={() => handleToggleCustomer(c.customerId)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-brown-100/60' : 'hover:bg-brown-50/50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-brown-900">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-brown-500 font-mono">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span>{c.customerName}</span>
                          </div>
                          {c.customerEmail && (
                            <span className="text-xs text-brown-500 font-normal block pl-4">
                              {c.customerEmail}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-brown-900">
                          ₹{Number(c.totalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-posted font-medium">
                          ₹{Number(c.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-brown-900">
                          <span
                            className={
                              hasDue ? 'text-amber-800' : 'text-emerald-700'
                            }
                          >
                            ₹{Number(c.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                          {hasDue && onRegisterPaymentForCustomer && (
                            <button
                              type="button"
                              onClick={() => onRegisterPaymentForCustomer(c.customerId)}
                              className="px-3 py-1 text-xs font-semibold bg-posted text-surface rounded hover:bg-posted/90 shadow-sm"
                            >
                              Pay Due
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Invoices List */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-brown-50/40 p-4 border-b border-brown-200">
                            <div className="bg-surface border border-brown-200 rounded-[8px] p-4 shadow-sm">
                              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-brown-700 mb-3">
                                Invoices for {c.customerName}
                              </h3>

                              {invoicesLoading ? (
                                <div className="text-xs text-brown-500 py-3 text-center">
                                  Loading invoices...
                                </div>
                              ) : customerInvoices.length === 0 ? (
                                <div className="text-xs text-brown-500 py-3 text-center">
                                  No invoices found.
                                </div>
                              ) : (
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-brown-200 text-brown-600 bg-brown-50/60">
                                      <th className="py-2 px-3">Invoice No</th>
                                      <th className="py-2 px-3">Date</th>
                                      <th className="py-2 px-3">Due Date</th>
                                      <th className="py-2 px-3 text-right">Total</th>
                                      <th className="py-2 px-3 text-right">Paid</th>
                                      <th className="py-2 px-3 text-right">Amount Due</th>
                                      <th className="py-2 px-3">Status</th>
                                      <th className="py-2 px-3 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-brown-100">
                                    {customerInvoices.map(inv => (
                                      <tr key={inv.id} className="hover:bg-brown-50/30">
                                        <td className="py-2.5 px-3 font-mono font-bold text-brown-900">
                                          {inv.number}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono">{inv.invoiceDate}</td>
                                        <td className="py-2.5 px-3 font-mono text-brown-500">{inv.dueDate || '-'}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">
                                          ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-posted font-medium">
                                          ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brown-900">
                                          ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <StatusBadge status={inv.paymentStatus || 'not_paid'} />
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <div className="flex items-center justify-center space-x-2">
                                            {onSelectInvoice && (
                                              <button
                                                type="button"
                                                onClick={() => onSelectInvoice(inv.id)}
                                                className="text-brown-700 hover:text-brown-900 underline font-medium"
                                              >
                                                View
                                              </button>
                                            )}
                                            {Number(inv.amountDue) > 0 && onRegisterPaymentForInvoice && (
                                              <button
                                                type="button"
                                                onClick={() => onRegisterPaymentForInvoice(inv.id)}
                                                className="px-2 py-0.5 text-xs bg-posted text-surface rounded hover:bg-posted/90 font-medium"
                                              >
                                                Pay
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
