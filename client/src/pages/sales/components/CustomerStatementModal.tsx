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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brown-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-brown-300 rounded-[12px] shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brown-200 flex items-center justify-between bg-cream/50">
          <div>
            <h2 className="text-lg font-bold font-display text-brown-900">
              Customer Account Statement
            </h2>
            <p className="text-xs text-brown-600">
              Chronological invoices and payments with immutable running balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brown-500 hover:text-brown-900 p-1.5 rounded-md hover:bg-brown-100 transition-colors text-lg font-bold leading-none"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-brown-500">
              Generating statement ledger...
            </div>
          ) : error ? (
            <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-md text-sm">
              {error}
            </div>
          ) : statement ? (
            <div>
              {/* Partner Overview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-brown-50 border border-brown-200 rounded-[8px] mb-6">
                <div>
                  <span className="text-[11px] font-semibold text-brown-500 uppercase tracking-wider block">
                    Customer
                  </span>
                  <span className="font-bold text-brown-900 text-sm block">
                    {statement.customerName}
                  </span>
                  <span className="text-xs text-brown-600 font-mono block">
                    {statement.customerEmail || 'No email registered'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-brown-500 uppercase tracking-wider block">
                    Total Billed / Settled
                  </span>
                  <span className="text-xs text-brown-700 block">
                    Invoiced: <strong className="font-mono text-brown-900">₹{Number(statement.totalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                  <span className="text-xs text-posted block">
                    Paid: <strong className="font-mono">₹{Number(statement.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-brown-500 uppercase tracking-wider block">
                    Current Outstanding
                  </span>
                  <span className={`text-base font-bold font-mono ${Number(statement.currentBalance) > 0 ? 'text-danger' : 'text-posted'}`}>
                    ₹{Number(statement.currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Statement Ledger Table */}
              <div className="border border-brown-300 rounded-[8px] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Reference</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right font-mono-num">Debit (+)</th>
                      <th className="p-2.5 text-right font-mono-num">Credit (−)</th>
                      <th className="p-2.5 text-right font-mono-num">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {statement.lines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-brown-500">
                          No accounting activity recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      statement.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-brown-50/70">
                          <td className="p-2.5 font-mono text-brown-700">{line.date}</td>
                          <td className="p-2.5 uppercase text-[10px] font-bold">
                            <span className={line.type === 'invoice' ? 'text-brown-900' : 'text-posted'}>
                              {line.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold text-brown-900">{line.ref}</td>
                          <td className="p-2.5 text-brown-600">{line.description}</td>
                          <td className="p-2.5 text-right font-mono text-brown-900">
                            {Number(line.debit) > 0 ? `₹${Number(line.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-posted">
                            {Number(line.credit) > 0 ? `₹${Number(line.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-brown-900 bg-brown-50/40">
                            ₹{Number(line.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-brown-200 bg-cream/30 flex items-center justify-between">
          <span className="text-[11px] text-brown-500 font-mono">
            Immutable Double-Entry Ledger Verification
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-brown-700 hover:text-brown-900 border border-brown-300 rounded-[6px] hover:bg-brown-100 transition-colors"
            >
              Print Statement
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-brown-900 text-cream rounded-[6px] hover:bg-brown-700 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
