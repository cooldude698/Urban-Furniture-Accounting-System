import React, { useState, useEffect } from 'react';

export interface StatementLineItem {
  id: number;
  date: string;
  type: 'invoice' | 'payment';
  ref: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface CustomerStatement {
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerMobile: string | null;
  totalInvoiced: string;
  totalPaid: string;
  currentBalance: string;
  lines: StatementLineItem[];
}

interface CustomerStatementModalProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customerId) {
      setStatement(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/receivables/statements/${customerId}`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setStatement(json.data);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-surface border border-brown-300 rounded-[10px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-body">
        {/* Modal Header */}
        <div className="p-5 border-b border-brown-200 bg-brown-50/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brown-500">
              Customer Account Statement
            </span>
            <h2 className="text-xl font-bold font-display text-brown-900">
              {statement ? statement.customerName : 'Loading Statement...'}
            </h2>
            {statement && (
              <p className="text-xs text-brown-600 mt-0.5">
                {statement.customerEmail && <span className="mr-3">✉ {statement.customerEmail}</span>}
                {statement.customerMobile && <span>📞 {statement.customerMobile}</span>}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brown-100 hover:bg-brown-200 text-brown-900 text-xs font-semibold rounded-[6px] border border-brown-300 transition-colors"
            >
              Print Statement
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-surface hover:bg-brown-100 text-brown-700 text-xs font-semibold rounded-[6px] border border-brown-300 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-brown-500 text-sm">
              Loading chronological transactions and balance ledger...
            </div>
          ) : error ? (
            <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-md text-sm">
              {error}
            </div>
          ) : !statement || statement.lines.length === 0 ? (
            <div className="py-16 text-center text-brown-500 text-sm">
              No confirmed transactions or payments found for this customer.
            </div>
          ) : (
            <div>
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-brown-50/60 border border-brown-200 rounded-[8px] p-4">
                  <span className="text-xs font-semibold text-brown-500 uppercase block">Total Invoiced</span>
                  <span className="text-lg font-bold font-mono text-brown-900">
                    ₹{Number(statement.totalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-brown-50/60 border border-brown-200 rounded-[8px] p-4">
                  <span className="text-xs font-semibold text-posted uppercase block">Total Paid</span>
                  <span className="text-lg font-bold font-mono text-posted">
                    ₹{Number(statement.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-4">
                  <span className="text-xs font-semibold text-amber-800 uppercase block">Current Balance Due</span>
                  <span className="text-lg font-bold font-mono text-amber-900">
                    ₹{Number(statement.currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="border border-brown-200 rounded-[8px] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brown-100/70 border-b border-brown-200 text-brown-800 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Invoiced)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-200/60 font-body">
                    {statement.lines.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brown-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-brown-800">{item.date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.type === 'invoice'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-brown-900">{item.ref}</td>
                        <td className="py-2.5 px-3 text-brown-700">{item.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-brown-900">
                          {Number(item.debit) > 0
                            ? `₹${Number(item.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-posted font-medium">
                          {Number(item.credit) > 0
                            ? `₹${Number(item.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brown-900">
                          ₹{Number(item.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brown-200 bg-brown-50/50 flex items-center justify-between text-xs text-brown-600">
          <span>Mathematical Balance Invariant: Debit (+) minus Credit (−) = Running Balance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brown-900 hover:bg-brown-800 text-cream font-semibold rounded-[6px] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
