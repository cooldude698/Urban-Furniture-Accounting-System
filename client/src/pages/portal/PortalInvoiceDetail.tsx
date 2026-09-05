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
          setPayAmount(json.data.amountDue || '0.00');
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
    if (amt.lessThanOrEqualTo(0)) {
      setPayError('Payment amount must be greater than zero');
      return;
    }

    if (invoice && amt.greaterThan(new Decimal(invoice.amountDue))) {
      setPayError(
        `Payment cannot exceed total amount due of ₹${invoice.amountDue}`
      );
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt.toFixed(2),
          method: payMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Payment processing failed');
      }

      setPaySuccess(
        `Payment of ₹${amt.toFixed(2)} recorded! The ledger balance was immediately settled.`
      );
      setTimeout(() => {
        setShowPayModal(false);
        setPaySuccess(null);
        fetchInvoice();
      }, 1200);
    } catch (err: any) {
      setPayError(err.message || 'Payment submission failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-brown-600 font-body text-sm">
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-8 font-body">
        <div className="bg-danger-bg border border-danger text-danger p-6 rounded-xl">
          <h2 className="font-bold text-base mb-1 font-display">Access Error</h2>
          <p className="text-sm">{error || 'Invoice not found or unauthorized'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-1.5 bg-surface hover:bg-brown-100 text-brown-900 border border-brown-300 rounded-[8px] text-xs font-semibold cursor-pointer"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const isFullyPaid = Number(invoice.amountDue) <= 0;

  return (
    <div className="space-y-6 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-brown-700 hover:text-brown-900 flex items-center gap-1 transition-colors font-body cursor-pointer"
        >
          ← Return to Invoices
        </button>

        <div className="flex items-center space-x-3">
          {!isFullyPaid && (
            <button
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2 bg-brown-900 hover:bg-brown-800 text-cream font-bold font-display text-xs uppercase tracking-wider rounded-[8px] transition-colors shadow-sm active:scale-[0.99] cursor-pointer"
            >
              💳 Pay Now (₹{invoice.amountDue})
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface border border-brown-300 hover:bg-brown-100/50 text-brown-800 font-semibold text-xs rounded-[8px] transition-colors shadow-xs font-body cursor-pointer"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="bg-surface border border-brown-300 rounded-[14px] p-8 shadow-sm">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-brown-200/60 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-brown-500 uppercase tracking-widest block font-mono">
              Official Tax Invoice
            </span>
            <h1 className="text-3xl font-bold font-display text-brown-900 mt-1">
              {invoice.number}
            </h1>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-posted-bg text-posted border-posted/30'
                  : invoice.paymentStatus === 'partial'
                  ? 'bg-warning-bg text-warning border-warning/30'
                  : 'bg-danger-bg text-danger border-danger/30'
              }`}
            >
              {invoice.paymentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Dates Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-brown-200/60 text-xs">
          <div>
            <span className="text-brown-600 block mb-1 font-body">Invoice Date</span>
            <span className="font-mono font-semibold text-brown-900 text-sm">
              {invoice.invoiceDate}
            </span>
          </div>
          <div>
            <span className="text-brown-600 block mb-1 font-body">Due Date</span>
            <span className="font-mono font-semibold text-brown-900 text-sm">
              {invoice.dueDate || 'Immediate'}
            </span>
          </div>
          <div>
            <span className="text-brown-600 block mb-1 font-body">Total Amount</span>
            <span className="font-mono font-bold text-brown-900 text-sm">
              ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-brown-600 block mb-1 font-body">Balance Due</span>
            <span className={`font-mono font-bold text-sm ${isFullyPaid ? 'text-posted' : 'text-danger'}`}>
              ₹{Number(invoice.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brown-700 mb-3 font-body">
            Billed Products & Materials
          </h3>
          <div className="border border-brown-300 rounded-[8px] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="bg-brown-100/75 text-brown-800 font-semibold border-b border-brown-300 uppercase tracking-wider text-[11px] font-body">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 text-right w-24">Qty</th>
                  <th className="p-3 text-right w-28">Unit Price</th>
                  <th className="p-3 text-right w-24">Tax Rate</th>
                  <th className="p-3 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100/60">
                {invoice.lines.map(line => (
                  <tr key={line.lineNo}>
                    <td className="p-3 text-center text-brown-500 font-mono">{line.lineNo}</td>
                    <td className="p-3 font-semibold text-brown-900">{line.productName}</td>
                    <td className="p-3 text-right font-mono text-brown-800">{line.qty}</td>
                    <td className="p-3 text-right font-mono text-brown-800">₹{line.unitPrice}</td>
                    <td className="p-3 text-right font-mono text-brown-800">{line.taxRate}%</td>
                    <td className="p-3 text-right font-mono font-bold text-brown-900">
                      ₹{line.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary Card */}
        <div className="flex justify-end pt-4 border-t border-brown-200/60">
          <div className="w-72 space-y-2 text-xs font-body">
            <div className="flex justify-between text-brown-700">
              <span>Subtotal:</span>
              <span className="font-mono">
                ₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-brown-700">
              <span>GST Tax Amount:</span>
              <span className="font-mono">
                ₹{Number(invoice.taxTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-brown-300 flex justify-between font-bold text-brown-900 text-sm">
              <span>Grand Total:</span>
              <span className="font-mono">
                ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-posted font-medium">
              <span>Amount Paid:</span>
              <span className="font-mono">
                ₹{Number(invoice.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-brown-300 flex justify-between font-bold text-danger text-sm">
              <span>Amount Due:</span>
              <span className="font-mono">
                ₹{Number(invoice.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Settlement History */}
      <div className="bg-surface border border-brown-300 rounded-[14px] p-8 shadow-sm font-body">
        <h3 className="text-sm font-bold font-display text-brown-900 mb-1">
          Receipt & Settlement Trail
        </h3>
        <p className="text-xs text-brown-600 mb-4 font-body">
          Direct allocations against this invoice verified on the double-entry ledger
        </p>

        {invoice.payments.length === 0 ? (
          <div className="py-6 text-center text-brown-500 text-xs bg-cream/40 rounded-lg font-body">
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <div className="border border-brown-300 rounded-[8px] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="bg-brown-100/75 text-brown-800 font-semibold border-b border-brown-300">
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Reference #</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Settled Amount</th>
                  <th className="p-3 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100/60">
                {invoice.payments.map(item => (
                  <tr key={item.allocationId}>
                    <td className="p-3 font-mono text-brown-700">{item.paymentDate}</td>
                    <td className="p-3 font-mono font-bold text-brown-900">{item.paymentNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-brown-100/70 text-brown-800 font-medium capitalize">
                        {item.method}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-posted">
                      ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-brown-700">
                      ₹{Number(item.runningRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brown-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-[14px] shadow-lg max-w-md w-full p-6 border border-brown-300 font-body">
            <div className="flex items-center justify-between pb-3 border-b border-brown-200/60 mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-brown-900">
                  Record Invoice Payment
                </h3>
                <span className="text-xs text-brown-600 font-mono">{invoice.number}</span>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-brown-500 hover:text-brown-900 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-danger-bg border border-danger text-danger text-xs rounded-md mb-4 font-medium font-body">
                {payError}
              </div>
            )}
            {paySuccess && (
              <div className="p-3 bg-posted-bg border border-posted text-posted text-xs rounded-md mb-4 font-medium font-body">
                {paySuccess}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank')}
                    className={`py-2 px-3 text-xs font-bold rounded-[8px] border transition-all cursor-pointer ${
                      payMethod === 'bank'
                        ? 'bg-brown-900 text-cream border-brown-900 shadow-xs font-display'
                        : 'bg-surface text-brown-800 border-brown-300 hover:bg-brown-100/50 font-body'
                    }`}
                  >
                    🏦 Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 px-3 text-xs font-bold rounded-[8px] border transition-all cursor-pointer ${
                      payMethod === 'cash'
                        ? 'bg-brown-900 text-cream border-brown-900 shadow-xs font-display'
                        : 'bg-surface text-brown-800 border-brown-300 hover:bg-brown-100/50 font-body'
                    }`}
                  >
                    💵 Cash Payment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
                  Amount to Pay (₹)
                </label>
                <input
                  type="text"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3 py-2 text-base font-bold font-mono text-brown-900 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none"
                />
                <span className="text-[11px] text-brown-600 mt-1 block font-body">
                  Partial payment allowed. Outstanding due: ₹{invoice.amountDue}
                </span>
              </div>

              <div className="pt-4 border-t border-brown-200/60 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-brown-700 hover:text-brown-900 cursor-pointer font-body"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2 bg-brown-900 hover:bg-brown-800 text-cream font-bold font-display text-xs uppercase tracking-wider rounded-[8px] transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {paySubmitting ? 'CONFIRMING…' : 'CONFIRM & SETTLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
