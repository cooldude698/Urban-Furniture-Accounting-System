import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export interface PortalBillListItem {
  id: number;
  number: string;
  billReference?: string;
  billDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
}



export const PortalBillList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<PortalBillListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get('/api/portal/bills')
      .then(res => {
        if (res.data?.data) {
          setBills(res.data.data);
        } else if (res.data?.error) {
          setError(res.data.error.message);
        }
      })
      .catch(err => setError(err?.response?.data?.error?.message || err.message))
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

  const totalOutstanding = bills
    .reduce((acc, b) => acc + Number(b.amountDue || 0), 0)
    .toFixed(2);

  return (
    <div className="font-body">
      {/* Overview Banner */}
      <div className="bg-surface border border-brown-300 rounded-[14px] p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">Your Vendor Bills</h1>
          <p className="text-xs text-brown-600 mt-1 font-body">
            Access, inspect, and track payments on your vendor purchase bills
          </p>
        </div>
        <div className="bg-brown-100/60 border border-brown-300 rounded-[10px] px-5 py-3 text-right">
          <span className="text-[11px] font-semibold text-brown-700 uppercase tracking-wider block font-body">
            Total Outstanding Due
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
                <th className="p-4">Bill #</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Amount Due</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-brown-600 text-sm italic font-body">
                    Loading vendor bills...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-brown-700 text-sm font-body">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                      <span className="text-2xl">📋</span>
                      <p className="font-semibold text-brown-900 m-0 text-sm">No Vendor Purchase Bills on Record</p>
                      <p className="text-xs text-brown-600 m-0 leading-relaxed">
                        Your account is currently registered as a Customer. Vendor bills are only applicable to supplier/vendor accounts.
                      </p>
                      <button
                        onClick={() => navigate('/portal/invoices')}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-brown-800 hover:bg-brown-900 text-cream text-xs font-semibold rounded-md shadow-sm transition-colors"
                      >
                        <span>⚡</span>
                        <span>Go to Customer Invoices & Pay Online</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map(bill => (
                  <tr
                    key={bill.id}
                    onClick={() => navigate(`/portal/bills/${bill.id}`)}
                    className="hover:bg-brown-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-mono font-semibold text-brown-900">
                      {bill.number}
                    </td>
                    <td className="p-4 text-brown-700 text-xs font-mono">
                      {bill.billReference || '—'}
                    </td>
                    <td className="p-4 text-brown-700 font-mono text-xs">
                      {bill.billDate || '—'}
                    </td>
                    <td className="p-4 text-brown-700 font-mono text-xs">
                      {bill.dueDate || '—'}
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-brown-900">
                      ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono text-posted font-medium">
                      ₹{Number(bill.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-brown-900">
                      ₹{Number(bill.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(bill.paymentStatus)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/portal/bills/${bill.id}`);
                        }}
                        className="px-3 py-1 bg-brown-100 group-hover:bg-brown-800 group-hover:text-cream text-brown-800 text-xs font-semibold rounded-[6px] transition-colors font-body"
                      >
                        Inspect & Settle →
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
