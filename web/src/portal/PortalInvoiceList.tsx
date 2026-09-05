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

  return (
    <div>
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">
            My Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review confirmed billing history and settle outstanding invoices
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-6 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[10px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading your invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No confirmed invoices found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50/70">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                      ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-medium">
                      ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(inv.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline">
                        View & Pay →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
