import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomerStatementModal } from './components/CustomerStatementModal';

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
    dueDate: string;
    amountDue: string;
    daysPastDue: number;
  }[];
}

export const ReceivablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'aging'>('summary');
  const [agingType, setAgingType] = useState<'receivable' | 'payable'>('receivable');
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

  const loadData = (type: 'receivable' | 'payable' = agingType) => {
    setLoading(true);
    Promise.all([
      fetch('/api/receivables').then(r => r.json()),
      fetch(`/api/aging?type=${type}`).then(r => r.json()),
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

  const handleSwitchAgingType = (type: 'receivable' | 'payable') => {
    setAgingType(type);
    fetch(`/api/aging?type=${type}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) setAgingData(json.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCustomer = async (customerId: number) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerInvoices([]);
      return;
    }

    setExpandedCustomerId(customerId);
    setInvoicesLoading(true);
    try {
      const res = await fetch(`/api/receivables/customers/${customerId}/invoices`);
      const json = await res.json();
      if (json.data) {
        setCustomerInvoices(json.data);
      }
    } catch {
      setCustomerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const grandTotalInvoiced = receivables
    .reduce((acc, c) => acc + Number(c.totalInvoiced), 0)
    .toFixed(2);
  const grandTotalPaid = receivables
    .reduce((acc, c) => acc + Number(c.totalPaid), 0)
    .toFixed(2);
  const grandTotalOutstanding = receivables
    .reduce((acc, c) => acc + Number(c.totalOutstanding), 0)
    .toFixed(2);

  return (
    <div className="w-full">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">
            Receivables & Aging Analysis
          </h1>
          <p className="text-sm text-brown-700">
            Customer balance tracking, aging buckets, and statement ledger
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-surface p-1.5 border border-brown-300 rounded-[8px] shadow-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'summary'
                ? 'bg-brown-900 text-cream shadow-xs'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Customer Summary
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === 'aging'
                ? 'bg-brown-900 text-cream shadow-xs'
                : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Aging Buckets
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner if any overdue invoices exist */}
      {overdueData && overdueData.overdueCount > 0 && (
        <div className="bg-danger-bg border-l-4 border-danger p-4 rounded-r-[8px] mb-6 flex items-start justify-between shadow-sm">
          <div className="flex items-start space-x-3">
            <span className="text-danger text-lg font-bold">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-danger">
                Overdue Invoice Alert: {overdueData.overdueCount} Invoices Exceeding Due Dates
              </h3>
              <p className="text-xs text-brown-800 mt-0.5">
                Total overdue receivables:{' '}
                <strong className="font-mono text-danger">
                  ₹{Number(overdueData.overdueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
                . Immediate payment follow-up recommended.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('aging')}
            className="text-xs font-semibold text-danger underline hover:text-red-950 px-2 py-1"
          >
            View Aging Details →
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-brown-300 rounded-[10px] p-4 shadow-sm">
          <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider block">
            Total Revenue Billed
          </span>
          <span className="text-2xl font-bold font-mono text-brown-900 mt-1 block">
            ₹{Number(grandTotalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-brown-500 mt-1 block">
            Across {receivables.length} active customers
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-4 shadow-sm">
          <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider block">
            Total Inward Receipts
          </span>
          <span className="text-2xl font-bold font-mono text-posted mt-1 block">
            ₹{Number(grandTotalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-brown-500 mt-1 block">
            Cash & Bank collections applied
          </span>
        </div>

        <div className="bg-surface border border-brown-300 rounded-[10px] p-4 shadow-sm">
          <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider block">
            Net Outstanding Due
          </span>
          <span className="text-2xl font-bold font-mono text-danger mt-1 block">
            ₹{Number(grandTotalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-danger mt-1 block">
            Awaiting customer payment
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-surface border border-brown-300 rounded-[10px] p-12 text-center text-brown-500">
          Loading receivables & aging analysis...
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-md text-sm">
          {error}
        </div>
      ) : activeTab === 'summary' ? (
        /* Summary Table */
        <div className="bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Invoices</th>
                  <th className="p-3.5 text-right font-mono-num">Total Billed</th>
                  <th className="p-3.5 text-right font-mono-num">Total Paid</th>
                  <th className="p-3.5 text-right font-mono-num">Outstanding</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100/70">
                {receivables.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brown-500">
                      No customer receivables recorded.
                    </td>
                  </tr>
                ) : (
                  receivables.map(item => {
                    const isExpanded = expandedCustomerId === item.customerId;
                    return (
                      <React.Fragment key={item.customerId}>
                        <tr className="hover:bg-brown-50/60 transition-colors">
                          <td className="p-3.5 font-bold text-brown-900">
                            <button
                              onClick={() => handleToggleCustomer(item.customerId)}
                              className="inline-flex items-center space-x-2 text-left hover:text-brown-700"
                            >
                              <span className="text-xs text-brown-400">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <span>{item.customerName}</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-xs text-brown-600 font-mono">
                            {item.customerEmail || item.customerPhone || '—'}
                          </td>
                          <td className="p-3.5 text-center font-mono text-xs">
                            <span className="px-2 py-0.5 bg-brown-100 rounded-full font-semibold">
                              {item.invoiceCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono text-brown-700">
                            ₹{Number(item.totalInvoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono text-posted font-medium">
                            ₹{Number(item.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-danger">
                            ₹{Number(item.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => setStatementCustomerId(item.customerId)}
                                className="px-2.5 py-1 text-xs font-medium bg-surface text-brown-800 border border-brown-300 rounded hover:bg-brown-100 transition-colors"
                              >
                                Statement
                              </button>
                              {Number(item.totalOutstanding) > 0 && (
                                <button
                                  onClick={() => navigate(`/sales/payments?customerId=${item.customerId}`)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-brown-900 text-cream rounded hover:bg-brown-700 transition-colors shadow-xs"
                                >
                                  Settle Due
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible Sub-invoices */}
                        {isExpanded && (
                          <tr className="bg-brown-50/50">
                            <td colSpan={7} className="p-4 pl-10 border-t border-b border-brown-200">
                              {invoicesLoading ? (
                                <div className="text-xs text-brown-500 py-2">
                                  Loading invoices for {item.customerName}...
                                </div>
                              ) : customerInvoices.length === 0 ? (
                                <div className="text-xs text-brown-500 py-2">
                                  No open or past invoices found for this customer.
                                </div>
                              ) : (
                                <div className="border border-brown-300 rounded-[6px] overflow-hidden bg-surface shadow-xs">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                                        <th className="p-2.5">Invoice #</th>
                                        <th className="p-2.5">Invoice Date</th>
                                        <th className="p-2.5">Due Date</th>
                                        <th className="p-2.5">Status</th>
                                        <th className="p-2.5 text-right font-mono-num">Total</th>
                                        <th className="p-2.5 text-right font-mono-num">Amount Paid</th>
                                        <th className="p-2.5 text-right font-mono-num">Amount Due</th>
                                        <th className="p-2.5 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brown-100">
                                      {customerInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-brown-50">
                                          <td className="p-2.5 font-semibold text-brown-900 font-mono">
                                            {inv.number}
                                          </td>
                                          <td className="p-2.5 text-brown-600">{inv.invoiceDate}</td>
                                          <td className="p-2.5 text-brown-600">{inv.dueDate || '—'}</td>
                                          <td className="p-2.5">
                                            <StatusBadge status={(inv.paymentStatus || inv.status) as any} />
                                          </td>
                                          <td className="p-2.5 text-right font-mono text-brown-900">
                                            ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-2.5 text-right font-mono text-posted">
                                            ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-2.5 text-right font-mono font-bold text-danger">
                                            ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-2.5 text-center">
                                            <div className="flex items-center justify-center space-x-1.5">
                                              <button
                                                onClick={() => navigate(`/sales/invoices/${inv.id}`)}
                                                className="px-2 py-0.5 text-[11px] font-semibold text-brown-800 bg-brown-100 hover:bg-brown-200 rounded"
                                              >
                                                View
                                              </button>
                                              {Number(inv.amountDue) > 0 && (
                                                <button
                                                  onClick={() => navigate(`/sales/payments?invoiceId=${inv.id}`)}
                                                  className="px-2 py-0.5 text-[11px] font-semibold text-cream bg-posted hover:bg-emerald-800 rounded shadow-xs"
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
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Aging Buckets Table */
        <div className="bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-brown-200 bg-brown-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-brown-700">
                Aging Schedule as of <span className="font-mono text-brown-900">{agingData?.asOfDate}</span>
              </span>
              <div className="flex items-center bg-surface border border-brown-300 rounded-[6px] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchAgingType('receivable')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                    agingType === 'receivable'
                      ? 'bg-brown-900 text-cream font-semibold shadow-xs'
                      : 'text-brown-700 hover:text-brown-900'
                  }`}
                >
                  Receivables (Debtors)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAgingType('payable')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                    agingType === 'payable'
                      ? 'bg-brown-900 text-cream font-semibold shadow-xs'
                      : 'text-brown-700 hover:text-brown-900'
                  }`}
                >
                  Payables (Creditors)
                </button>
              </div>
            </div>
            <span className="text-[11px] text-brown-500">
              Bucketed by due date (0-30, 31-60, 61-90, 90+ days intervals)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                  <th className="p-3">{agingType === 'receivable' ? 'Customer' : 'Vendor'}</th>
                  <th className="p-3 text-right font-mono-num">Current (Not Due)</th>
                  <th className="p-3 text-right font-mono-num">1–30 Days</th>
                  <th className="p-3 text-right font-mono-num">31–60 Days</th>
                  <th className="p-3 text-right font-mono-num">61–90 Days</th>
                  <th className="p-3 text-right font-mono-num">90+ Days</th>
                  <th className="p-3 text-right font-mono-num bg-brown-200/50 font-bold">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {!agingData || agingData.customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brown-500">
                      No {agingType === 'receivable' ? 'customer' : 'vendor'} aging balances.
                    </td>
                  </tr>
                ) : (
                  agingData.customers.map(c => (
                    <tr key={c.customerId} className="hover:bg-brown-50/60 transition-colors">
                      <td className="p-3 font-semibold text-brown-900">
                        {c.customerName}
                        {c.customerEmail && (
                          <span className="block text-[10px] text-brown-400 font-mono">{c.customerEmail}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-brown-700">
                        {Number(c.current) > 0 ? `₹${Number(c.current).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-800">
                        {Number(c.days1_30) > 0 ? `₹${Number(c.days1_30).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-900">
                        {Number(c.days31_60) > 0 ? `₹${Number(c.days31_60).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-danger">
                        {Number(c.days61_90) > 0 ? `₹${Number(c.days61_90).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-red-900">
                        {Number(c.days90Plus) > 0 ? `₹${Number(c.days90Plus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-brown-900 bg-brown-50/40">
                        ₹{Number(c.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {agingData && (
                <tfoot>
                  <tr className="bg-brown-100 font-bold border-t-2 border-brown-300 text-brown-900">
                    <td className="p-3 uppercase">Total Portfolio Aging</td>
                    <td className="p-3 text-right font-mono">
                      ₹{Number(agingData.totals.current).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-800">
                      ₹{Number(agingData.totals.days1_30).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-900">
                      ₹{Number(agingData.totals.days31_60).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-danger">
                      ₹{Number(agingData.totals.days61_90).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-red-950 font-bold">
                      ₹{Number(agingData.totals.days90Plus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-brown-950 bg-brown-200/50">
                      ₹{Number(agingData.totals.totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
export default ReceivablesPage;
