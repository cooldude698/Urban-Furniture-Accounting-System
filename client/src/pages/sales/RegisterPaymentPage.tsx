import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { BlockingWarning } from './components/Warnings';

export interface OpenInvoiceItem {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
}

export const RegisterPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const invoiceIdParam = searchParams.get('invoiceId');
  const customerIdParam = searchParams.get('customerId');
  const initialInvoiceId = invoiceIdParam ? parseInt(invoiceIdParam, 10) : null;
  const initialCustomerId = customerIdParam ? parseInt(customerIdParam, 10) : 0;

  const [contacts, setContacts] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(initialCustomerId);
  const [method, setMethod] = useState<'bank' | 'cash'>('bank');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('0.00');

  const [openInvoices, setOpenInvoices] = useState<OpenInvoiceItem[]>([]);
  const [allocations, setAllocations] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load customer list
  useEffect(() => {
    fetch('/api/contacts?type=customer')
      .then(res => res.json())
      .then(json => {
        if (json.data) setContacts(json.data);
      })
      .catch(() => {});
  }, []);

  // If initialInvoiceId provided, load that invoice to find its customer
  useEffect(() => {
    if (initialInvoiceId) {
      setLoading(true);
      fetch(`/api/invoices/${initialInvoiceId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            setSelectedCustomerId(json.data.customerId);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [initialInvoiceId]);

  // When selectedCustomerId changes, fetch their open invoices
  useEffect(() => {
    if (!selectedCustomerId) {
      setOpenInvoices([]);
      setAllocations({});
      return;
    }

    setLoading(true);
    fetch(`/api/invoices/open?partner_id=${selectedCustomerId}`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const invs: OpenInvoiceItem[] = json.data;
          setOpenInvoices(invs);

          // If initialInvoiceId matches, auto-allocate full amount_due of that invoice
          if (initialInvoiceId) {
            const target = invs.find(i => i.id === initialInvoiceId);
            if (target) {
              setAmount(target.amountDue);
              setAllocations({ [target.id]: target.amountDue });
              return;
            }
          }

          // Otherwise calculate sum of open dues
          const totalDue = invs.reduce((acc, i) => acc.plus(i.amountDue), new Decimal(0));
          setAmount(totalDue.toFixed(2));
          // Default auto-allocate first open invoice
          if (invs.length > 0) {
            setAllocations({ [invs[0].id]: invs[0].amountDue });
          }
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerId, initialInvoiceId]);

  const handleAllocationChange = (invId: number, val: string) => {
    setAllocations(prev => ({
      ...prev,
      [invId]: val,
    }));
  };

  const handleAutoDistribute = () => {
    let rem = new Decimal(amount || '0');
    const newAlloc: Record<number, string> = {};

    for (const inv of openInvoices) {
      if (rem.lessThanOrEqualTo(0)) break;
      const due = new Decimal(inv.amountDue);
      if (rem.greaterThanOrEqualTo(due)) {
        newAlloc[inv.id] = due.toFixed(2);
        rem = rem.minus(due);
      } else {
        newAlloc[inv.id] = rem.toFixed(2);
        rem = new Decimal(0);
      }
    }
    setAllocations(newAlloc);
  };

  const allocatedSum = Object.values(allocations).reduce(
    (acc, v) => acc.plus(Number(v) || 0),
    new Decimal(0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    const payAmt = new Decimal(amount || '0');
    if (payAmt.lessThanOrEqualTo(0)) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (!allocatedSum.equals(payAmt)) {
      setError(
        `Total allocated sum (₹${allocatedSum.toFixed(2)}) must exactly match payment amount (₹${payAmt.toFixed(2)}).`
      );
      return;
    }

    const cleanAllocations = Object.entries(allocations)
      .filter(([_, val]) => Number(val) > 0)
      .map(([invoiceId, allocAmt]) => ({
        invoiceId: Number(invoiceId),
        amount: new Decimal(allocAmt).toFixed(2),
      }));

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedCustomerId,
          method,
          paymentDate,
          amount: payAmt.toFixed(2),
          direction: 'inbound',
          allocations: cleanAllocations,
        }),
      });

      const json = await res.json();
      if (json.data) {
        setSuccessMsg(
          `Payment ${json.data.number || 'recorded'} successfully! Revenue remains at original invoice recognition — no new income accounts touched.`
        );
        setTimeout(() => {
          navigate('/sales/invoices');
        }, 1200);
      } else {
        setError(json.error?.message || 'Failed to record customer payment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Action Bar */}
      <div className="flex items-center justify-between py-3 mb-6 border-b border-brown-300">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">
            Register Customer Payment
          </h1>
          <p className="text-xs text-brown-700">
            Inward cash/bank receipt settling outstanding receivables
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sales/invoices')}
          className="px-3 py-1.5 text-xs font-semibold bg-surface border border-brown-300 rounded-[6px] text-brown-700 hover:bg-brown-100 transition-colors"
        >
          ← Back to Invoices
        </button>
      </div>

      {error && <BlockingWarning message={error} />}
      {successMsg && (
        <div className="p-4 bg-posted-bg border border-posted/30 text-posted rounded-md mb-6 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Details Header Card */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brown-500 mb-4 border-b border-brown-100 pb-2">
            Payment Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(Number(e.target.value))}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
              >
                <option value={0} disabled>Select Customer...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Payment Journal / Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`py-2 px-3 text-xs font-bold rounded-[6px] border transition-all ${
                    method === 'bank'
                      ? 'bg-brown-900 text-cream border-brown-900 shadow-sm'
                      : 'bg-surface text-brown-700 border-brown-300 hover:bg-brown-100'
                  }`}
                >
                  🏦 Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`py-2 px-3 text-xs font-bold rounded-[6px] border transition-all ${
                    method === 'cash'
                      ? 'bg-brown-900 text-cream border-brown-900 shadow-sm'
                      : 'bg-surface text-brown-700 border-brown-300 hover:bg-brown-100'
                  }`}
                >
                  💵 Cash Drawer
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm font-mono"
              />
            </div>

            {/* Total Amount Received */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Received Amount (₹) *
              </label>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-base font-bold font-mono"
                placeholder="0.00"
              />
              <span className="text-[11px] text-brown-500 mt-1 block">
                Partial payment supported. Revenue is unchanged.
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Allocation Grid */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brown-200 mb-4 gap-2">
            <div>
              <h3 className="text-base font-bold font-display text-brown-900">
                Invoice Settlement Allocation
              </h3>
              <p className="text-xs text-brown-500">
                Select open customer invoices to settle with this payment
              </p>
            </div>
            {openInvoices.length > 0 && (
              <button
                type="button"
                onClick={handleAutoDistribute}
                className="text-xs font-semibold text-brown-700 bg-brown-100 hover:bg-brown-200 px-3 py-1.5 rounded-[6px] transition-colors"
              >
                Auto-Distribute Oldest First
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-brown-500 text-sm">
              Loading open invoices for this customer...
            </div>
          ) : openInvoices.length === 0 ? (
            <div className="py-8 text-center text-brown-500 text-sm">
              {selectedCustomerId
                ? 'This customer has no open unpaid invoices.'
                : 'Select a customer above to load open invoices.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Invoice Date</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5 text-right font-mono-num">Total Amount</th>
                    <th className="p-2.5 text-right font-mono-num">Current Due</th>
                    <th className="p-2.5 text-right font-mono-num w-44">Allocate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100">
                  {openInvoices.map(inv => {
                    const currentAlloc = allocations[inv.id] || '';
                    return (
                      <tr key={inv.id} className="hover:bg-brown-50/70">
                        <td className="p-2.5 font-mono font-bold text-brown-900">
                          {inv.number}
                        </td>
                        <td className="p-2.5 text-brown-600 font-mono">{inv.invoiceDate}</td>
                        <td className="p-2.5 text-brown-600 font-mono">{inv.dueDate || '—'}</td>
                        <td className="p-2.5 text-right font-mono text-brown-700">
                          ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right font-mono text-danger font-semibold">
                          ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="text"
                            value={currentAlloc}
                            onChange={e => handleAllocationChange(inv.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-surface border border-brown-300 rounded px-2 py-1 font-mono font-bold text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Allocation Reconciliation Footer */}
              <div className="mt-4 p-4 bg-brown-50 rounded-[8px] border border-brown-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-brown-700 block">
                    Payment Amount: <strong className="font-mono text-brown-900">₹{amount || '0.00'}</strong>
                  </span>
                  <span className="text-brown-700 block">
                    Total Allocated: <strong className="font-mono text-posted">₹{allocatedSum.toFixed(2)}</strong>
                  </span>
                </div>
                <div>
                  {allocatedSum.equals(Number(amount) || 0) ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                      ✓ Perfectly Balanced
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-full">
                      Difference: ₹{new Decimal(amount || '0').minus(allocatedSum).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/sales/invoices')}
            className="px-4 py-2 text-sm font-semibold text-brown-700 hover:text-brown-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || openInvoices.length === 0}
            className="px-6 py-2 text-sm font-bold bg-brown-900 text-cream rounded-[6px] hover:bg-brown-700 transition-all shadow-md active:scale-[0.99] disabled:bg-brown-300"
          >
            {submitting ? 'Posting Payment Entry...' : 'Post Inbound Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default RegisterPaymentPage;
