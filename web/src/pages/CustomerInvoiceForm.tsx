import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { SmartButton } from '../components/SmartButton';
import { InvoiceLineGrid, InvoiceGridLine } from '../components/InvoiceLineGrid';
import { BlockingWarning } from '../components/Warnings';
import { PaymentHistoryPanel } from '../components/PaymentHistoryPanel';
import { CustomerInvoiceDTO } from '../../../shared/schemas/invoice';

interface CustomerInvoiceFormProps {
  invoiceId?: number | null;
  onBack: () => void;
  onNavigateToSO?: (soId: number) => void;
  onRegisterPayment?: (invoiceId: number) => void;
}

export const CustomerInvoiceForm: React.FC<CustomerInvoiceFormProps> = ({
  invoiceId,
  onBack,
  onNavigateToSO,
  onRegisterPayment,
}) => {
  const [invoice, setInvoice] = useState<CustomerInvoiceDTO | null>(null);
  const [customerId, setCustomerId] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [lines, setLines] = useState<InvoiceGridLine[]>([]);

  const [contacts, setContacts] = useState<Array<{ id: number; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string; sku: string; sales_price: string; tax_rate: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [analytics, setAnalytics] = useState<Array<{ id: number; name: string }>>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch dropdown data
  useEffect(() => {
    fetch('/api/contacts?type=customer')
      .then(res => res.json())
      .then(json => json.data && setContacts(json.data))
      .catch(() => {});

    fetch('/api/products')
      .then(res => res.json())
      .then(json => json.data && setProducts(json.data))
      .catch(() => {});

    // Accounts for sales line selection
    setAccounts([
      { id: 6, name: 'Sales Income', type: 'income' },
      { id: 10, name: 'Other Income', type: 'income' },
    ]);

    fetch('/api/analytic-accounts')
      .then(res => res.json())
      .then(json => json.data && setAnalytics(json.data))
      .catch(() => {});
  }, []);

  // Fetch existing invoice
  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      fetch(`/api/invoices/${invoiceId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            const inv: CustomerInvoiceDTO = json.data;
            setInvoice(inv);
            setCustomerId(inv.customerId);
            setInvoiceDate(inv.invoiceDate);
            setDueDate(inv.dueDate);
            setLines(inv.lines.map(l => ({
              productId: l.productId,
              accountId: l.accountId,
              analyticAccountId: l.analyticAccountId || null,
              qty: l.qty,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              subtotal: l.subtotal,
              taxAmount: l.taxAmount,
              total: l.total,
            })));
          } else if (json.error) {
            setError(json.error.message);
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setInvoice(null);
      setCustomerId(0);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setLines([{ productId: 0, accountId: 6, analyticAccountId: null, qty: '1', unitPrice: '0.00', taxRate: '18.00' }]);
    }
  }, [invoiceId]);

  const handleSaveDraft = async () => {
    if (!customerId) {
      setError('Please select a Customer.');
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.productId || Number(l.qty) <= 0)) {
      setError('Please provide valid products and quantities.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceDate,
          dueDate,
          lines,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setInvoice(json.data);
        setSuccessMsg(`Customer Invoice ${json.data.number} created as Draft.`);
      } else {
        setError(json.error?.message || 'Failed to save Invoice');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!invoice?.id) {
      await handleSaveDraft();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/confirm`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.data) {
        setInvoice(json.data);
        setSuccessMsg(`Customer Invoice ${json.data.number} Posted to Ledger! (JE #${json.data.journalEntryNumber || json.data.journalEntryId})`);
      } else {
        setError(json.error?.message || 'Failed to confirm Invoice');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = invoice?.status === 'confirmed';
  const isDraft = !invoice || invoice.status === 'draft';

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-300/40 py-3 px-6 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-sm font-medium text-brown-700 hover:text-brown-900"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => {
              setInvoice(null);
              setCustomerId(0);
              setLines([{ productId: 0, accountId: 6, analyticAccountId: null, qty: '1', unitPrice: '0.00', taxRate: '18.00' }]);
              setError(null);
              setSuccessMsg(null);
            }}
            className="px-4 py-1.5 text-sm font-medium bg-surface text-brown-900 border border-brown-300 rounded-[6px] hover:bg-brown-100 shadow-sm"
          >
            New
          </button>

          {isDraft && (
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="px-4 py-1.5 text-sm font-semibold bg-brown-900 text-cream rounded-[6px] hover:bg-brown-700 shadow-sm transition-all"
            >
              {loading ? 'Posting...' : 'Confirm'}
            </button>
          )}

          {isConfirmed && onRegisterPayment && (
            <button
              type="button"
              onClick={() => onRegisterPayment(invoice.id)}
              className="px-4 py-1.5 text-sm font-semibold bg-posted text-surface rounded-[6px] hover:bg-posted/90 shadow-sm"
            >
              Pay
            </button>
          )}

          {invoice?.id && (
            <button
              type="button"
              onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
              className="px-3 py-1.5 text-sm font-medium bg-surface text-brown-800 border border-brown-300 rounded-[6px] hover:bg-brown-100 shadow-sm"
            >
              📄 Export PDF
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-bg rounded-[6px]"
          >
            Cancel
          </button>
        </div>

        {/* Smart Buttons (SO and Budget) */}
        <div className="flex items-center space-x-3">
          <SmartButton
            visible={Boolean(invoice?.soId)}
            label="Sales Order"
            count={invoice?.soNumber || `SO #${invoice?.soId}`}
            onClick={() => invoice?.soId && onNavigateToSO && onNavigateToSO(invoice.soId)}
          />

          <SmartButton
            visible={lines.some(l => l.analyticAccountId)}
            label="Analytics"
            count="Budget"
            onClick={() => alert('Opens Analytic Budget line report.')}
          />
        </div>
      </div>

      <div className="px-6">
        {error && <BlockingWarning message={error} />}
        {successMsg && (
          <div className="p-4 bg-posted-bg border border-posted/30 text-posted rounded-md mb-4 text-sm font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* Invoice Header Details */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-brown-100 gap-4">
            <div>
              <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">Customer Invoice</span>
              <h1 className="text-2xl font-bold font-display text-brown-900 mt-1">
                {invoice ? invoice.number : 'New Draft Invoice'}
              </h1>
              {invoice?.journalEntryNumber && (
                <span className="text-xs text-brown-500 font-mono">
                  Posted to Ledger: {invoice.journalEntryNumber}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {invoice && invoice.dueDate && new Date(invoice.dueDate) < new Date() && Number(invoice.amountDue) > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  ⚠️ Overdue
                </span>
              )}
              {invoice && <StatusBadge status={invoice.status} />}
              <StatusBadge status={invoice?.paymentStatus || 'Not Paid'} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Customer *
              </label>
              <select
                disabled={isConfirmed}
                value={customerId}
                onChange={e => setCustomerId(Number(e.target.value))}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 text-sm focus:ring-2 focus:ring-brown-700 outline-none"
              >
                <option value={0} disabled>Select Customer...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                disabled={isConfirmed}
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 text-sm focus:ring-2 focus:ring-brown-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                disabled={isConfirmed}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 text-sm focus:ring-2 focus:ring-brown-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice Lines Grid */}
        <div className="mb-6">
          <h2 className="text-base font-bold font-display text-brown-900 mb-2">Invoice Line Items</h2>
          <InvoiceLineGrid
            lines={lines}
            products={products}
            accounts={accounts}
            analytics={analytics}
            onChange={setLines}
            disabled={isConfirmed}
          />
        </div>

        {/* Payment History Panel (Phase 3) */}
        {invoice?.id && (
          <PaymentHistoryPanel invoiceId={invoice.id} invoiceTotal={invoice.total || '0.00'} />
        )}

        {/* Footer breakdown per Mockup: Subtotal, Tax, Total, Paid Via Cash, Paid Via Bank, Amount Due */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm ml-auto max-w-md space-y-2 text-sm">
          <div className="flex justify-between text-brown-700">
            <span>Subtotal:</span>
            <span className="font-mono-num font-medium">₹{invoice?.subtotal || '0.00'}</span>
          </div>
          <div className="flex justify-between text-brown-700">
            <span>Tax Amount:</span>
            <span className="font-mono-num font-medium">₹{invoice?.taxTotal || '0.00'}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-brown-900 border-t border-brown-300 pt-2">
            <span>Grand Total:</span>
            <span className="font-mono-num">₹{invoice?.total || '0.00'}</span>
          </div>
          <div className="border-t border-brown-100 pt-2 text-xs space-y-1">
            <div className="flex justify-between text-posted">
              <span>Paid Via Cash:</span>
              <span className="font-mono-num">₹{invoice?.paidViaCash || '0.00'}</span>
            </div>
            <div className="flex justify-between text-posted">
              <span>Paid Via Bank:</span>
              <span className="font-mono-num">₹{invoice?.paidViaBank || '0.00'}</span>
            </div>
            <div className="flex justify-between font-bold text-danger text-sm border-t border-dashed border-brown-300 pt-1">
              <span>Amount Due:</span>
              <span className="font-mono-num">₹{invoice?.amountDue || invoice?.total || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
