import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { SmartButton } from '../../components/SmartButton';
import { InvoiceLineGrid, InvoiceGridLine } from './components/InvoiceLineGrid';
import { BlockingWarning } from './components/Warnings';
import { PaymentHistoryPanel } from './components/PaymentHistoryPanel';
import { CustomerInvoiceDTO } from '@shared/schemas/invoice';
import { ShoppingCart, CreditCard } from 'lucide-react';

export const CustomerInvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = id ? parseInt(id, 10) : null;

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
    fetch('/api/accounts')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setAccounts(json.data.filter((a: any) => a.type === 'income' || a.category === 'income'));
        }
      })
      .catch(() => {
        setAccounts([
          { id: 6, name: 'Sales Income', type: 'income' },
          { id: 10, name: 'Other Income', type: 'income' },
        ]);
      });

    fetch('/api/analytic-accounts')
      .then(res => res.json())
      .then(json => json.data && setAnalytics(json.data))
      .catch(() => {});
  }, []);

  // Fetch existing invoice if invoiceId provided
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
            setDueDate(inv.dueDate || '');
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
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setLines([
        {
          productId: 0,
          accountId: 6,
          analyticAccountId: null,
          qty: '1',
          unitPrice: '0.00',
          taxRate: '18.00',
        },
      ]);
    }
  }, [invoiceId]);

  const handleSaveDraft = async () => {
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.productId || Number(l.qty) <= 0)) {
      setError('Please configure valid line items with products and quantities.');
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
          dueDate: dueDate || undefined,
          lines,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setInvoice(json.data);
        setSuccessMsg(`Invoice ${json.data.number} saved as Draft.`);
        navigate(`/sales/invoices/${json.data.id}`, { replace: true });
      } else {
        setError(json.error?.message || 'Failed to save Customer Invoice');
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
        setSuccessMsg(`Invoice ${json.data.number} Confirmed & Posted to Ledger! (Debit Debtors, Credit Income)`);
      } else {
        setError(json.error?.message || 'Failed to post invoice');
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
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-300/40 py-3 px-6 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/sales/invoices')}
            className="px-3 py-1.5 text-sm font-medium text-brown-700 hover:text-brown-900 transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/invoices/new')}
            className="px-4 py-1.5 text-sm font-medium bg-surface text-brown-900 border border-brown-300 rounded-[6px] hover:bg-brown-100 transition-colors shadow-sm"
          >
            New
          </button>
          {isDraft && (
            <button
              type="button"
              disabled={loading || lines.length === 0}
              onClick={handleConfirm}
              className="px-4 py-1.5 text-sm font-semibold bg-brown-900 text-cream rounded-[6px] hover:bg-brown-700 transition-all shadow-sm active:scale-[0.99] disabled:bg-brown-300"
            >
              {loading ? 'Posting...' : 'Confirm & Post'}
            </button>
          )}
          {isConfirmed && (
            <button
              type="button"
              onClick={() => navigate(`/sales/payments?invoiceId=${invoice?.id}`)}
              className="px-4 py-1.5 text-sm font-semibold bg-posted text-white rounded-[6px] hover:bg-emerald-800 transition-all shadow-sm flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Register Payment
            </button>
          )}
        </div>

        {/* Smart Buttons */}
        <div className="flex items-center space-x-2">
          {invoice?.soId && (
            <SmartButton
              label={`SO #${invoice.soNumber || invoice.soId}`}
              icon={ShoppingCart}
              onClick={() => navigate(`/sales/orders/${invoice.soId}`)}
            />
          )}
        </div>
      </div>

      <div className="px-6">
        {error && <BlockingWarning message={error} />}
        {successMsg && (
          <div className="p-4 bg-posted-bg border border-posted/30 text-posted rounded-md mb-4 text-sm font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* Document Header Card */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-brown-100 gap-4">
            <div>
              <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">Customer Invoice</span>
              <h1 className="text-2xl font-bold font-display text-brown-900 mt-1">
                {invoice ? invoice.number : 'Draft Invoice'}
              </h1>
              {invoice?.soNumber && (
                <span className="text-xs text-brown-500 font-mono mt-1 block">
                  Originating Sales Order: <strong>{invoice.soNumber}</strong>
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={((invoice?.paymentStatus || invoice?.status) as any) || 'draft'} />
              {invoice && (
                <span className="text-xs text-brown-500 font-mono">
                  Due: ₹{Number(invoice.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Customer *
              </label>
              <select
                disabled={isConfirmed}
                value={customerId}
                onChange={e => setCustomerId(Number(e.target.value))}
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

            {/* Invoice Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                disabled={isConfirmed}
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                disabled={isConfirmed}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Lines Grid */}
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

        {/* Payment History & Settlement Audit Panel */}
        {isConfirmed && invoice && (
          <PaymentHistoryPanel
            invoiceId={invoice.id}
            invoiceTotal={invoice.total}
          />
        )}
      </div>
    </div>
  );
};
export default CustomerInvoiceFormPage;
