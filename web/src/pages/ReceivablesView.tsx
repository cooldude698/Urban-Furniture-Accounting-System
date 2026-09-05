import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { CustomerStatementModal } from '../components/CustomerStatementModal';

export interface CustomerReceivableItem {
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  invoiceCount: number;
}

export interface CustomerInvoiceItem {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  status: string;
}

export interface CustomerAgingBucket {
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  current: string;
  days1_30: string;
  days31_60: string;
  days61_90: string;
  days90Plus: string;
  totalOutstanding: string;
}

export interface AgingReport {
  asOfDate: string;
  customers: CustomerAgingBucket[];
  totals: {
    current: string;
    days1_30: string;
    days31_60: string;
    days61_90: string;
    days90Plus: string;
    totalOutstanding: string;
  };
}

export interface OverdueSummary {
  overdueCount: number;
  overdueAmount: string;
  invoices: {
    invoiceId: number;
    invoiceNumber: string;
    customerId: number;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    daysOverdue: number;
    total: string;
    amountPaid: string;
    amountDue: string;
  }[];
}

interface ReceivablesViewProps {
  onSelectInvoice?: (invoiceId: number) => void;
  onRegisterPaymentForInvoice?: (invoiceId: number) => void;
  onRegisterPaymentForCustomer?: (customerId: number) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  onSelectInvoice,
  onRegisterPaymentForInvoice,
  onRegisterPaymentForCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'aging'>('summary');
  const [receivables, setReceivables] = useState<CustomerReceivableItem[]>([]);
  const [agingData, setAgingData] = useState<AgingReport | null>(null);
  const [overdueData, setOverdueData] = useState<OverdueSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded invoices in summary view
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);

  // Statement modal state
  const [statementCustomerId, setStatementCustomerId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/receivables').then(r => r.json()),
      fetch('/api/aging?type=receivable').then(r => r.json()),
      fetch('/api/receivables/overdue').then(r => r.json()),
    ])
      .then(([recJson, agingJson, overdueJson]) => {
        if (recJson.data) setReceivables(recJson.data);
        if (agingJson.data) setAgingData(agingJson.data);
        if (overdueJson.data) setOverdueData(overdueJson.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a customer is expanded, fetch their invoices
  const handleToggleCustomer = async (customerId: number) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerInvoices([]);
      return;
    }

    setExpandedCustomerId(customerId);
    setInvoicesLoading(true);
    try {
      const res = await fetch(`/api/invoices?customerId=${customerId}`);
      const json = await res.json();
      if (json.data) {
        setCustomerInvoices(json.data);
      }
    } catch (err: any) {
      console.error('Failed to load customer invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Aggregated totals across all customers
  const overallInvoiced = receivables.reduce((sum, r) => sum + Number(r.totalInvoiced || 0), 0);
  const overallPaid = receivables.reduce((sum, r) => sum + Number(r.totalPaid || 0), 0);
  const overallOutstanding = receivables.reduce((sum, r) => sum + Number(r.totalOutstanding || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-brown-300 gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900 tracking-tight">
            Accounts Receivable &amp; Aging
          </h1>
          <p className="text-sm text-brown-600 mt-1">
            Customer exposure, chronological statements, and 0-30/31-60/61-90/90+ aging buckets
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-brown-100/70 p-1 rounded-[8px] border border-brown-300">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-1.5 text-xs font-bold rounded-[6px] transition-all ${
              activeTab === 'summary'
                ? 'bg-brown-900 text-cream shadow-xs'
                : 'text-brown-700 hover:text-brown-900'
            }`}
          >
            Customer Summary
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-4 py-1.5 text-xs font-bold rounded-[6px] transition-all ${
              activeTab === 'aging'
                ? 'bg-brown-900 text-cream shadow-xs'
                : 'text-brown-700 hover:text-brown-900'
            }`}
          >
            Aging Report (30/60/90+)
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueData && overdueData.overdueCount > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border-l-4 border-amber-600 rounded-r-[8px] flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Overdue Receivables Alert ({overdueData.overdueCount} {overdueData.overdueCount === 1 ? 'Invoice' : 'Invoices'})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Total overdue balance past payment terms:{' '}
                <strong className="font-mono">
                  ₹{Number(overdueData.overdueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
                . Immediate follow-up recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider block mb-1">
            Total Invoiced Revenue
          </span>
          <span className="text-2xl font-bold font-mono text-brown-900">
            ₹{overallInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-posted uppercase tracking-wider block mb-1">
            Total Collected Receipts
          </span>
          <span className="text-2xl font-bold font-mono text-posted">
            ₹{overallPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Total Outstanding Receivables
          </span>
          <span className="text-2xl font-bold font-mono text-amber-800">
            ₹{overallOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      {/* View Content: Summary vs Aging */}
      {activeTab === 'summary' ? (
        <div className="bg-surface border border-brown-300 rounded-[10px] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brown-200 bg-brown-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold font-display text-brown-900 uppercase tracking-wider">
              Customer Exposure Ledger
            </h2>
            <span className="text-xs text-brown-500">
              Click any customer row to expand invoices or click Statement for full chronological ledger
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-brown-500 text-sm">
              Loading receivables ledger...
            </div>
          ) : receivables.length === 0 ? (
            <div className="py-12 text-center text-brown-500 text-sm">
              No confirmed customer invoices found in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brown-200 text-xs font-semibold text-brown-600 bg-brown-50/30">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100">
                  {receivables.map(c => {
                    const isExpanded = expandedCustomerId === c.customerId;
                    const hasDue = Number(c.totalOutstanding) > 0;

                    return (
                      <React.Fragment key={c.customerId}>
                        <tr
                          onClick={() => handleToggleCustomer(c.customerId)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-brown-100/60' : 'hover:bg-brown-50/50'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-brown-900">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-brown-500 font-mono">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <span>{c.customerName}</span>
                            </div>
                            {c.customerEmail && (
                              <span className="text-xs text-brown-500 font-normal block pl-4">
                                {c.customerEmail}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            {c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-brown-900">
                            ₹{Number(c.totalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-posted font-medium">
                            ₹{Number(c.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-brown-900">
                            <span className={hasDue ? 'text-amber-800' : 'text-emerald-700'}>
                              ₹{Number(c.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setStatementCustomerId(c.customerId)}
                                className="px-2.5 py-1 text-xs font-semibold bg-brown-100 hover:bg-brown-200 text-brown-900 rounded border border-brown-300 transition-colors"
                              >
                                Statement
                              </button>
                              {hasDue && onRegisterPaymentForCustomer && (
                                <button
                                  type="button"
                                  onClick={() => onRegisterPaymentForCustomer(c.customerId)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-posted text-surface rounded hover:bg-posted/90 shadow-sm"
                                >
                                  Pay Due
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Invoices List */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-brown-50/40 p-4 border-b border-brown-200">
                              <div className="bg-surface border border-brown-200 rounded-[8px] p-4 shadow-sm">
                                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-brown-700 mb-3">
                                  Invoices for {c.customerName}
                                </h3>

                                {invoicesLoading ? (
                                  <div className="text-xs text-brown-500 py-3 text-center">
                                    Loading invoices...
                                  </div>
                                ) : customerInvoices.length === 0 ? (
                                  <div className="text-xs text-brown-500 py-3 text-center">
                                    No invoices found.
                                  </div>
                                ) : (
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-brown-200 text-brown-600 bg-brown-50/60">
                                        <th className="py-2 px-3">Invoice No</th>
                                        <th className="py-2 px-3">Date</th>
                                        <th className="py-2 px-3">Due Date</th>
                                        <th className="py-2 px-3 text-right">Total</th>
                                        <th className="py-2 px-3 text-right">Paid</th>
                                        <th className="py-2 px-3 text-right">Amount Due</th>
                                        <th className="py-2 px-3">Status</th>
                                        <th className="py-2 px-3 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brown-100">
                                      {customerInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-brown-50/30">
                                          <td className="py-2.5 px-3 font-mono font-bold text-brown-900">
                                            {inv.number}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono">{inv.invoiceDate}</td>
                                          <td className="py-2.5 px-3 font-mono text-brown-500">{inv.dueDate || '-'}</td>
                                          <td className="py-2.5 px-3 text-right font-mono">
                                            ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-posted font-medium">
                                            ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-brown-900">
                                            ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <StatusBadge status={inv.paymentStatus || 'not_paid'} />
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                              {onSelectInvoice && (
                                                <button
                                                  type="button"
                                                  onClick={() => onSelectInvoice(inv.id)}
                                                  className="text-brown-700 hover:text-brown-900 underline font-medium"
                                                >
                                                  View
                                                </button>
                                              )}
                                              {Number(inv.amountDue) > 0 && onRegisterPaymentForInvoice && (
                                                <button
                                                  type="button"
                                                  onClick={() => onRegisterPaymentForInvoice(inv.id)}
                                                  className="px-2 py-0.5 text-xs bg-posted text-surface rounded hover:bg-posted/90 font-medium"
                                                >
                                                  Pay
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Aging Report Tab */
        <div className="bg-surface border border-brown-300 rounded-[10px] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brown-200 bg-brown-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display text-brown-900 uppercase tracking-wider">
                Receivables Aging Schedule
              </h2>
              <p className="text-xs text-brown-500 mt-0.5">
                Outstanding balances categorized strictly into overdue aging buckets as of today
              </p>
            </div>
            <span className="text-xs font-mono bg-brown-100 text-brown-800 px-2.5 py-1 rounded">
              As Of: {agingData?.asOfDate || new Date().toISOString().split('T')[0]}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-brown-500 text-sm">
              Computing aging schedule across customer invoices...
            </div>
          ) : !agingData || agingData.customers.length === 0 ? (
            <div className="py-12 text-center text-brown-500 text-sm">
              No outstanding receivables found in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brown-200 bg-brown-100/60 text-brown-800 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4 text-right">Current (Not Due)</th>
                    <th className="py-3 px-4 text-right text-amber-800">1–30 Days</th>
                    <th className="py-3 px-4 text-right text-amber-900">31–60 Days</th>
                    <th className="py-3 px-4 text-right text-rose-800">61–90 Days</th>
                    <th className="py-3 px-4 text-right text-danger font-bold">90+ Days</th>
                    <th className="py-3 px-4 text-right font-bold text-brown-950">Total Outstanding</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100 font-body">
                  {agingData.customers.map(cust => (
                    <tr key={cust.customerId} className="hover:bg-brown-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-brown-900">
                        {cust.customerName}
                        {cust.customerEmail && (
                          <span className="block text-[11px] text-brown-500 font-normal">
                            {cust.customerEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800">
                        ₹{Number(cust.current).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800">
                        ₹{Number(cust.days1_30).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-900">
                        ₹{Number(cust.days31_60).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-800">
                        ₹{Number(cust.days61_90).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-danger font-semibold">
                        ₹{Number(cust.days90Plus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-brown-950">
                        ₹{Number(cust.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setStatementCustomerId(cust.customerId)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-brown-100 hover:bg-brown-200 text-brown-900 rounded border border-brown-300 transition-colors"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-brown-400 bg-brown-100/90 font-bold text-brown-950">
                    <td className="py-3 px-4 uppercase tracking-wider text-xs">Total Aging Schedule</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-900">
                      ₹{Number(agingData.totals.current).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-900">
                      ₹{Number(agingData.totals.days1_30).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-950">
                      ₹{Number(agingData.totals.days31_60).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-900">
                      ₹{Number(agingData.totals.days61_90).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-danger">
                      ₹{Number(agingData.totals.days90Plus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-brown-950 text-sm">
                      ₹{Number(agingData.totals.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-[10px] text-brown-600 font-normal">
                      ✓ Balanced
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Statement Modal */}
      <CustomerStatementModal
        customerId={statementCustomerId}
        isOpen={statementCustomerId !== null}
        onClose={() => setStatementCustomerId(null)}
      />
    </div>
  );
};
