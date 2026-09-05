import React, { useEffect, useState } from 'react';

export interface PaymentHistoryItem {
  allocationId: number;
  paymentId: number;
  paymentNumber: string;
  paymentDate: string;
  method: 'cash' | 'bank';
  direction: 'inbound' | 'outbound';
  amount: string;
  runningRemaining: string;
}

interface PaymentHistoryPanelProps {
  invoiceId: number;
  invoiceTotal: string;
  onPaymentRecorded?: () => void;
}

export const PaymentHistoryPanel: React.FC<PaymentHistoryPanelProps> = ({
  invoiceId,
  invoiceTotal,
}) => {
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    fetch(`/api/invoices/${invoiceId}/payments`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setHistory(json.data);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-brown-200 mb-4">
        <div>
          <h3 className="text-base font-bold font-display text-brown-900">Payment & Settlement History</h3>
          <p className="text-xs text-brown-500">
            Real-time ledger audit trail for this customer invoice
          </p>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-1 bg-brown-100 text-brown-900 rounded-md">
          Total Invoiced: ₹{Number(invoiceTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-brown-500 py-4 text-center">Loading payment history...</div>
      ) : error ? (
        <div className="text-xs text-danger py-2">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-sm text-brown-500 py-4 text-center">
          No settlements or payments applied to this invoice yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brown-100/50 text-brown-900 font-semibold border-b border-brown-200">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Payment Ref</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5 text-right font-mono-num">Allocated Amount</th>
                <th className="p-2.5 text-right font-mono-num">Remaining Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100">
              {history.map(item => (
                <tr key={item.allocationId} className="hover:bg-brown-50">
                  <td className="p-2.5 font-mono text-brown-700">{item.paymentDate}</td>
                  <td className="p-2.5 font-mono font-semibold text-brown-900">{item.paymentNumber}</td>
                  <td className="p-2.5 capitalize">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.method === 'bank'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {item.method === 'bank' ? '🏦 Bank' : '💵 Cash'}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-posted">
                    ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium text-brown-700">
                    ₹{Number(item.runningRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
