import React, { useState, useEffect } from 'react';

export interface PortalInvoiceListItem {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
}

interface PortalInvoiceListProps {
  onSelectInvoice: (id: number) => void;
}

export const PortalInvoiceList: React.FC<PortalInvoiceListProps> = ({ onSelectInvoice }) => {
  const [invoices, setInvoices] = useState<PortalInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/portal/invoices')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setInvoices(json.data);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-posted-bg text-posted border border-posted/30">
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-warning-bg text-warning border border-warning/30">
            Partial
          </span>
        );
      case 'not_paid':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-danger-bg text-danger border border-danger/30">
            Not Paid
          </span>
        );
    }
  };

  const totalOutstanding = invoices
    .reduce((acc, i) => acc + Number(i.amountDue || 0), 0)
    .toFixed(2);

  return (
    <div className="font-body">
      {/* Overview Banner */}
      <div className="bg-surface border border-brown-300 rounded-[14px] p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">Your Invoices</h1>
          <p className="text-xs text-brown-600 mt-1 font-body">
            Access, inspect, and settle statements billed to your account
          </p>
        </div>
        <div className="bg-brown-100/60 border border-brown-300 rounded-[10px] px-5 py-3 text-right">
          <span className="text-[11px] font-semibold text-brown-700 uppercase tracking-wider block font-body">
            Total Outstanding
          </span>
          <span className="text-xl font-bold font-mono text-brown-900 block">
            ₹{Number(totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-bg border border-danger text-danger text-xs rounded-md mb-6 font-medium font-body">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-brown-300 rounded-[14px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-brown-100/75 text-brown-800 font-semibold border-b border-brown-300 text-xs uppercase tracking-wider font-body">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-right">Amount Paid</th>
                <th className="p-4 text-right">Amount Due</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-brown-500 font-body">
                    Loading your invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-brown-600 font-body">
                    No invoices recorded for your customer profile.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    className="hover:bg-brown-100/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-brown-900">{inv.number}</td>
                    <td className="p-4 text-brown-700 text-xs font-mono">{inv.invoiceDate}</td>
                    <td className="p-4 text-brown-700 text-xs font-mono">{inv.dueDate || '—'}</td>
                    <td className="p-4">{getStatusBadge(inv.paymentStatus)}</td>
                    <td className="p-4 text-right font-mono font-semibold text-brown-900">
                      ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono text-posted font-medium">
                      ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-danger">
                      ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectInvoice(inv.id);
                        }}
                        className="px-3.5 py-1 bg-brown-900 hover:bg-brown-800 text-cream font-display font-bold text-xs uppercase tracking-wider rounded-[6px] transition-colors shadow-xs cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
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
