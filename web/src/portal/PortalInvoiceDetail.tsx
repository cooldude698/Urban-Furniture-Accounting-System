import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';

interface InvoiceLine {
  lineNo: number;
  productName: string;
  qty: string;
  unitPrice: string;
  taxRate: string;
  total: string;
}

interface PaymentHistoryItem {
  allocationId: number;
  paymentId: number;
  paymentNumber: string;
  paymentDate: string;
  method: 'cash' | 'bank';
  direction: 'inbound' | 'outbound';
  amount: string;
  runningRemaining: string;
}

interface InvoiceDetail {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  lines: InvoiceLine[];
  payments: PaymentHistoryItem[];
}

interface PortalInvoiceDetailProps {
  invoiceId: number;
  onBack: () => void;
}

export const PortalInvoiceDetail: React.FC<PortalInvoiceDetailProps> = ({
  invoiceId,
  onBack,
}) => {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'bank' | 'cash'>('bank');
  const [payAmount, setPayAmount] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchInvoice = () => {
    setLoading(true);
    fetch(`/api/portal/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setInvoice(json.data);
          setPayAmount(json.data.amountDue);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    setPaySuccess(null);

    const amt = new Decimal(payAmount || '0');
    if (amt.lte(0)) {
      setPayError('Amount must be greater than zero');
      return;
    }

    if (invoice && amt.gt(new Decimal(invoice.amountDue))) {
      setPayError(`Amount exceeds outstanding due of ₹${invoice.amountDue}`);
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: payMethod,
          amount: amt.toFixed(2),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Payment failed');
      }

      setPaySuccess('Payment registered and posted to ledger successfully!');
      setTimeout(() => {
        setShowPayModal(false);
        setPaySuccess(null);
        fetchInvoice();
      }, 1000);
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md mb-4">
          {error || 'Invoice not found or unauthorized'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-semibold"
        >
          ← Back to Invoices
        </button>
      </div>
    );
  }

  const hasDue = Number(invoice.amountDue) > 0;

  return (
    <div>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-[6px] hover:bg-slate-100 shadow-sm"
        >
          ← Back to Invoices
        </button>

        {hasDue && (
          <button
            type="button"
            onClick={() => {
              setPayAmount(invoice.amountDue);
              setShowPayModal(true);
            }}
            className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-[6px] shadow transition-all"
          >
            Record Payment (Cash / Bank)
          </button>
        )}
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-[10px] p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Customer Invoice
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 mt-0.5">
              {invoice.number}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.paymentStatus === 'partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {invoice.paymentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <span className="text-slate-500 block">Invoice Date</span>
            <span className="font-mono font-medium text-slate-800">{invoice.invoiceDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Due Date</span>
            <span className="font-mono font-medium text-slate-800">{invoice.dueDate || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Amount Paid</span>
            <span className="font-mono font-semibold text-emerald-700">
              ₹{Number(invoice.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Amount Outstanding Due</span>
            <span className="font-mono font-bold text-slate-900">
              ₹{Number(invoice.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Lines */}
      <div className="bg-white border border-slate-200 rounded-[10px] p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold font-display text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Purchased Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/50">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Tax (%)</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines.map(line => (
                <tr key={line.lineNo}>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{line.lineNo}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{line.productName}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{line.qty}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ₹{Number(line.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{line.taxRate}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    ₹{Number(line.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Total:</span>
              <span className="font-mono">₹{invoice.taxTotal}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono">₹{invoice.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Panel */}
      <div className="bg-white border border-slate-200 rounded-[10px] p-6 shadow-sm">
        <h2 className="text-sm font-bold font-display text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Payment & Settlement Ledger
        </h2>

        {invoice.payments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No payments recorded yet against this invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Receipt Doc #</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Settled Amount</th>
                  <th className="py-2.5 px-3 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map(pay => (
                  <tr key={pay.allocationId}>
                    <td className="py-2.5 px-3 font-mono">{pay.paymentDate}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pay.method === 'bank'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {pay.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      ₹{Number(pay.runningRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Record Payment
              </h3>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-4">
                {payError}
              </div>
            )}

            {paySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md mb-4">
                ✓ {paySuccess}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settlement Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank')}
                    className={`py-2 text-xs font-semibold rounded border ${
                      payMethod === 'bank'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 text-xs font-semibold rounded border ${
                      payMethod === 'cash'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Outstanding Due: ₹{invoice.amountDue}
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded shadow disabled:opacity-50"
                >
                  {paySubmitting ? 'Posting...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
