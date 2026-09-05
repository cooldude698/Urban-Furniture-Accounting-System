import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { BlockingWarning } from '../components/Warnings';

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

interface RegisterPaymentFormProps {
  initialInvoiceId?: number | null;
  onBack: () => void;
  onPaymentSuccess?: (paymentId: number) => void;
}

export const RegisterPaymentForm: React.FC<RegisterPaymentFormProps> = ({
  initialInvoiceId,
  onBack,
  onPaymentSuccess,
}) => {
  const [contacts, setContacts] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
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
        .finally(() => setLoading(false));
    }
  }, [initialInvoiceId]);

  // When customer changes, load their open invoices
  useEffect(() => {
    if (!selectedCustomerId) {
      setOpenInvoices([]);
      setAllocations({});
      return;
    }

    setLoading(true);
    fetch(`/api/payments/open-invoices/${selectedCustomerId}`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const invs: OpenInvoiceItem[] = json.data;
          setOpenInvoices(invs);

          // If initialInvoiceId matches an open invoice, pre-allocate its due amount
          const newAlloc: Record<number, string> = {};
          if (initialInvoiceId) {
            const matched = invs.find(i => i.id === initialInvoiceId);
            if (matched) {
              newAlloc[matched.id] = matched.amountDue;
              setAmount(matched.amountDue);
            }
          } else if (invs.length > 0) {
            // Default first invoice allocation
            newAlloc[invs[0].id] = invs[0].amountDue;
            setAmount(invs[0].amountDue);
          }
          setAllocations(newAlloc);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerId, initialInvoiceId]);

  // Helper to calculate total allocated
  const calculateTotalAllocated = (currentAlloc: Record<number, string>): Decimal => {
    let sum = new Decimal(0);
    for (const val of Object.values(currentAlloc)) {
      if (val && !isNaN(Number(val)) && Number(val) > 0) {
        sum = sum.plus(new Decimal(val));
      }
    }
    return sum;
  };

  const handleAllocationChange = (invoiceId: number, valStr: string) => {
    const updated = { ...allocations, [invoiceId]: valStr };
    setAllocations(updated);

    // Auto-sync total amount with sum of allocations
    const sum = calculateTotalAllocated(updated);
    setAmount(sum.toFixed(2));
  };

  const handleQuickPayFull = (inv: OpenInvoiceItem) => {
    handleAllocationChange(inv.id, inv.amountDue);
  };

  const handleQuickClear = (invoiceId: number) => {
    handleAllocationChange(invoiceId, '0.00');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    const payAmt = new Decimal(amount || '0');
    if (payAmt.lte(0)) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    // Build allocations array
    const allocArray: Array<{ invoiceId: number; amount: string }> = [];
    for (const [idStr, valStr] of Object.entries(allocations)) {
      const invId = Number(idStr);
      const val = new Decimal(valStr || '0');
      if (val.gt(0)) {
        allocArray.push({
          invoiceId: invId,
          amount: val.toFixed(2),
        });
      }
    }

    if (allocArray.length === 0) {
      setError('Please allocate payment against at least one invoice.');
      return;
    }

    const totalAlloc = calculateTotalAllocated(allocations);
    if (!totalAlloc.equals(payAmt)) {
      setError(
        `Allocated total (₹${totalAlloc.toFixed(2)}) does not match Payment Amount (₹${payAmt.toFixed(2)}). Please adjust allocations.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: 'inbound',
          partnerId: selectedCustomerId,
          method,
          paymentDate,
          amount: payAmt.toFixed(2),
          allocations: allocArray,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to record payment');
      }

      setSuccessMsg(`Payment ${json.data.number} recorded and posted to ledger successfully!`);
      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess(json.data.id);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAllocated = calculateTotalAllocated(allocations);
  const isBalanced = totalAllocated.equals(new Decimal(amount || '0')) && totalAllocated.gt(0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-body">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-brown-300">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-sm font-medium bg-surface text-brown-700 border border-brown-300 rounded-[6px] hover:bg-brown-100 shadow-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold font-display text-brown-900">
            Register Customer Payment
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !isBalanced}
          className={`px-5 py-2 text-sm font-semibold rounded-[6px] shadow-sm transition-all ${
            isBalanced && !submitting
              ? 'bg-posted text-surface hover:bg-posted/90 cursor-pointer'
              : 'bg-brown-300 text-brown-600 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Posting to Ledger...' : 'Post Payment'}
        </button>
      </div>

      {error && <BlockingWarning message={error} />}
      {successMsg && (
        <div className="p-4 bg-posted-bg border border-posted/30 text-posted rounded-md mb-6 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      {/* Payment Details Form */}
      <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold font-display uppercase tracking-wider text-brown-600 mb-4 pb-2 border-b border-brown-100">
          Payment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">
              Customer <span className="text-danger">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(Number(e.target.value))}
              disabled={Boolean(initialInvoiceId)}
              className="w-full bg-cream/40 border border-brown-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brown-500 disabled:opacity-70"
            >
              <option value={0}>-- Select Customer --</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">
              Payment Method <span className="text-danger">*</span>
            </label>
            <div className="flex rounded-[6px] border border-brown-300 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex-1 py-2 font-medium transition-colors ${
                  method === 'bank'
                    ? 'bg-brown-900 text-cream font-bold'
                    : 'bg-cream/40 text-brown-700 hover:bg-brown-100'
                }`}
              >
                Bank
              </button>
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`flex-1 py-2 font-medium transition-colors ${
                  method === 'cash'
                    ? 'bg-brown-900 text-cream font-bold'
                    : 'bg-cream/40 text-brown-700 hover:bg-brown-100'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">
              Payment Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full bg-cream/40 border border-brown-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brown-500 font-mono"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">
              Total Amount (₹) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-cream/40 border border-brown-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brown-500 font-mono font-bold text-brown-900"
            />
            <span className="text-[11px] text-brown-500 mt-1 block">
              Editable for partial payments
            </span>
          </div>
        </div>
      </div>

      {/* Allocation UI: Multi-invoice settlement for customer */}
      <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-brown-200 mb-4">
          <div>
            <h2 className="text-base font-bold font-display text-brown-900">
              Invoice Allocation Grid
            </h2>
            <p className="text-xs text-brown-500">
              Allocate payment across outstanding invoices for this customer. Partial settlements are supported.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-brown-600 block">Total Allocated</span>
            <span className="text-base font-mono font-bold text-brown-900">
              ₹{totalAllocated.toFixed(2)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-brown-500 text-sm">
            Fetching outstanding customer invoices...
          </div>
        ) : openInvoices.length === 0 ? (
          <div className="py-8 text-center text-brown-500 text-sm">
            {selectedCustomerId
              ? 'No outstanding confirmed invoices for this customer.'
              : 'Please select a customer above to view unpaid invoices.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brown-200 text-xs font-semibold text-brown-600 bg-brown-50/50">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Invoice Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Amount Due</th>
                  <th className="py-2.5 px-3 text-right w-44">Allocated Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {openInvoices.map(inv => {
                  const currentAlloc = allocations[inv.id] || '';

                  return (
                    <tr key={inv.id} className="hover:bg-brown-50/40">
                      <td className="py-3 px-3 font-mono font-bold text-brown-900">
                        {inv.number}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{inv.invoiceDate}</td>
                      <td className="py-3 px-3 font-mono text-xs text-brown-500">{inv.dueDate || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-posted">
                        ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-brown-900">
                        ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          max={inv.amountDue}
                          value={currentAlloc}
                          onChange={e => handleAllocationChange(inv.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full text-right bg-cream/40 border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brown-500 font-mono font-semibold"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleQuickPayFull(inv)}
                            className="px-2 py-0.5 bg-brown-100 hover:bg-brown-200 text-brown-800 rounded font-medium"
                          >
                            Full Due
                          </button>
                          {Number(currentAlloc) > 0 && (
                            <button
                              type="button"
                              onClick={() => handleQuickClear(inv.id)}
                              className="px-2 py-0.5 text-danger hover:bg-danger-bg rounded font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Balance Verification Footer */}
        <div className="mt-6 pt-4 border-t border-brown-200 flex flex-col md:flex-row items-center justify-between text-sm gap-4">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isBalanced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="font-medium text-brown-800">
              {isBalanced
                ? 'Allocations perfectly match Payment Amount (Balanced)'
                : `Allocation Mismatch: Payment Amount ₹${amount || '0.00'} vs Allocated ₹${totalAllocated.toFixed(2)}`}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setAmount(totalAllocated.toFixed(2))}
              className="text-xs text-brown-600 hover:text-brown-900 underline font-medium"
            >
              Set Payment Amount to Allocated (₹{totalAllocated.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
