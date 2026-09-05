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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Partial
          </span>
        );
      case 'not_paid':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            Not Paid
          </span>
        );
    }
  };

  const totalOutstanding = invoices
    .reduce((acc, i) => acc + Number(i.amountDue || 0), 0)
    .toFixed(2);

  return (
    <div>
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Your Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access, inspect, and settle statements billed to your account
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-5 py-3 text-right">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className="text-xl font-bold font-mono text-amber-950 block">
            ₹{Number(totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-6 font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading your invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No invoices recorded for your customer profile.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.number}</td>
                    <td className="p-4 text-slate-600 text-xs font-mono">{inv.invoiceDate}</td>
                    <td className="p-4 text-slate-600 text-xs font-mono">{inv.dueDate || '—'}</td>
                    <td className="p-4">{getStatusBadge(inv.paymentStatus)}</td>
                    <td className="p-4 text-right font-mono font-semibold text-slate-900">
                      ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-600 font-medium">
                      ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-red-600">
                      ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectInvoice(inv.id);
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs rounded-[6px] transition-colors shadow-xs"
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
