import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { SmartButton } from '../../components/SmartButton';
import { InvoiceLineGrid, InvoiceGridLine } from './components/InvoiceLineGrid';
import { BlockingWarning } from './components/Warnings';
import { PaymentHistoryPanel } from './components/PaymentHistoryPanel';
import { CustomerInvoiceDTO } from '@shared/schemas/invoice';
import { ShoppingCart, CreditCard, BookOpen, TrendingUp, Printer, Mail } from 'lucide-react';
import { JournalEntryModal } from '../../components/purchase/JournalEntryModal';
import { RegisterPaymentModal } from '../../components/purchase/RegisterPaymentModal';

export interface CustomerInvoiceFormPageProps {
  invoiceId?: number | null;
  onBack?: () => void;
  onSaved?: (id: number) => void;
}

export const CustomerInvoiceFormPage: React.FC<CustomerInvoiceFormPageProps> = ({ invoiceId: propInvoiceId, onBack, onSaved }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = propInvoiceId !== undefined ? propInvoiceId : (id ? parseInt(id, 10) : null);

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
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);


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
  const loadInvoice = async (idToLoad: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${idToLoad}`);
      const json = await res.json();
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice(invoiceId);
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

  const handleSendEmail = async () => {
    if (!invoice?.id) return;
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecipient || undefined }),
      });
      const json = await res.json();
      if (json.data && json.data.success) {
        setEmailStatus({
          success: true,
          message: `PDF receipt successfully sent to ${json.data.recipient}! (Resend ID: ${json.data.resendId})`,
        });
      } else {
        setEmailStatus({
          success: false,
          message: json.error?.message || json.data?.message || 'Failed to dispatch email receipt via Resend.',
        });
      }
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.message || 'Error communicating with email receipt service.',
      });
    } finally {
      setEmailSending(false);
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
            <>
              <button
                type="button"
                disabled={Number(invoice?.amountDue ?? invoice?.total) <= 0}
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-1.5 text-sm font-semibold bg-posted text-white rounded-[6px] hover:bg-emerald-800 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                {Number(invoice?.amountDue ?? invoice?.total) <= 0 ? 'Paid in Full' : 'Pay / Register Payment'}
              </button>
              <a
                href={`/api/invoices/${invoice?.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-sm font-medium bg-surface text-brown-800 border border-brown-300 rounded-[6px] hover:bg-brown-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-brown-600" />
                Print / PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setEmailRecipient(invoice?.customerEmail || '');
                  setEmailStatus(null);
                  setIsEmailModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-sm font-medium bg-surface text-brown-800 border border-brown-300 rounded-[6px] hover:bg-brown-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-brown-600" />
                Email Receipt (Resend)
              </button>
            </>
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
          {invoice?.journalEntryId && (
            <SmartButton
              label={`Journal Entry #${invoice.journalEntryId}`}
              icon={BookOpen}
              onClick={() => setIsJournalModalOpen(true)}
            />
          )}
          {(invoice?.lines?.some(l => l.analyticAccountId) || lines.some(l => l.analyticAccountId)) && (
            <SmartButton
              label="Budget Report"
              icon={TrendingUp}
              onClick={() => navigate('/report/budget')}
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

        {/* Settlement Overview Cards */}
        {invoice && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-surface border border-brown-200 rounded-[10px] shadow-sm mb-6">
            <div className="p-3 bg-brown-50/70 rounded-lg border border-brown-100">
              <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                Invoice Total
              </span>
              <span className="text-sm font-bold font-mono text-brown-900">
                ₹{Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-brown-50/70 rounded-lg border border-brown-100">
              <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                Paid Via Cash
              </span>
              <span className="text-sm font-bold font-mono text-emerald-800">
                ₹{Number(invoice.paidViaCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-brown-50/70 rounded-lg border border-brown-100">
              <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                Paid Via Bank
              </span>
              <span className="text-sm font-bold font-mono text-blue-800">
                ₹{Number(invoice.paidViaBank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-brown-50/70 rounded-lg border border-brown-100">
              <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                Total Paid
              </span>
              <span className="text-sm font-bold font-mono text-emerald-700">
                ₹{Number(invoice.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-brown-50/70 rounded-lg border border-brown-100">
              <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                Amount Due
              </span>
              <span className={`text-sm font-bold font-mono ${Number(invoice.amountDue || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                ₹{Number(invoice.amountDue !== undefined && invoice.amountDue !== null ? invoice.amountDue : (invoice.total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
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

        {/* Payment & Settlement Summary Box matching Wireframe 10 */}
        {isConfirmed && invoice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 mb-6">
            <div className="p-4 bg-brown-50/60 rounded-xl border border-brown-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brown-700 mb-2">
                Settlement & Payments (View Derived)
              </h4>
              <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
                <span className="text-brown-600">Paid Via Cash:</span>
                <span className="font-mono font-medium text-brown-900">
                  ₹{Number(invoice.paidViaCash || '0.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
                <span className="text-brown-600">Paid Via Bank:</span>
                <span className="font-mono font-medium text-brown-900">
                  ₹{Number(invoice.paidViaBank || '0.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-amber-900 pt-1">
                <span>Amount Due:</span>
                <span className="font-mono text-base font-bold text-amber-900">
                  ₹{Number(invoice.amountDue ?? (Number(invoice.total || '0') - Number(invoice.amountPaid || '0'))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-4 bg-brown-50/60 rounded-xl border border-brown-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brown-700 mb-2">
                Document Ledger Overview
              </h4>
              <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
                <span className="text-brown-600">Invoice Total:</span>
                <span className="font-mono font-medium text-brown-900">
                  ₹{Number(invoice.total || invoice.totalAmount || '0.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
                <span className="text-brown-600">Total Settled:</span>
                <span className="font-mono font-medium text-emerald-700 font-bold">
                  ₹{Number(invoice.amountPaid || '0.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 pt-1">
                <span className="text-brown-600">Payment Status:</span>
                <span className="font-semibold capitalize text-brown-800">
                  {invoice.paymentStatus || (Number(invoice.amountDue) <= 0 ? 'Paid' : 'Not Paid')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment History & Settlement Audit Panel */}
        {isConfirmed && invoice && (
          <PaymentHistoryPanel
            invoiceId={invoice.id}
            invoiceTotal={invoice.total}
          />
        )}
      </div>

      {/* Journal Entry Double-Entry Modal */}
      {invoice?.journalEntryId && (
        <JournalEntryModal
          journalEntryId={invoice.journalEntryId}
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
          sourceDocNumber={invoice.number}
        />
      )}

      {/* Register Payment Modal */}
      {invoice && (
        <RegisterPaymentModal
          invoice={invoice}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={() => {
            setSuccessMsg('Payment successfully registered and posted to ledger!');
            loadInvoice(invoice.id);
          }}
        />
      )}

      {/* Resend Email Receipt Modal */}
      {isEmailModalOpen && invoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-2xl border border-brown-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-brown-200 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brown-700" />
                <h3 className="text-lg font-bold text-brown-900">Email PDF Payment Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-brown-400 hover:text-brown-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-brown-600">
              Sends an official formatted PDF receipt for <strong>{invoice.number}</strong> ({invoice.customerName}) via <strong>Resend API</strong> directly to the client's mailbox.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider">
                Recipient Email (Personal Gmail / Work Email)
              </label>
              <input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-cream/30 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-transparent text-brown-900"
              />
            </div>

            {emailStatus && (
              <div
                className={`p-3 rounded-lg text-sm border ${
                  emailStatus.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {emailStatus.message}
              </div>
            )}

            <div className="flex justify-end items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-brown-700 hover:text-brown-900"
              >
                Close
              </button>
              <button
                type="button"
                disabled={emailSending || !emailRecipient}
                onClick={handleSendEmail}
                className="px-4 py-2 text-sm font-semibold bg-brown-900 text-cream rounded-lg hover:bg-brown-800 transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                {emailSending ? 'Sending PDF via Resend...' : 'Send Receipt Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoiceFormPage;

