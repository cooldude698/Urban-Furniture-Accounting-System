import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { BlockingWarning } from '../components/Warnings';

interface PurchaseOrder {
  id: number;
  number: string;
  vendorId: number;
  vendorName: string;
  poDate: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  total: string;
  lines: any[];
}

interface VendorBill {
  id: number;
  number: string;
  billReference: string | null;
  poId: number | null;
  vendorId: number;
  vendorName: string;
  billDate: string;
  dueDate: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  subtotal: string;
  taxTotal: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: 'paid' | 'partial' | 'not_paid';
  journalEntryId: number | null;
  lines: any[];
}

export const PurchaseView: React.FC = () => {
  const [subTab, setSubTab] = useState<'bills' | 'orders'>('bills');

  // Bills state
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loadingBills, setLoadingBills] = useState<boolean>(true);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [billView, setBillView] = useState<'list' | 'form' | 'new'>('list');

  // Orders state
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderView, setOrderView] = useState<'list' | 'form' | 'new'>('list');

  // Dropdown reference data
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);

  // Form states for creating new bill/po
  const [vendorId, setVendorId] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState<string>(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [billRef, setBillRef] = useState<string>('');
  const [formLines, setFormLines] = useState<Array<{ productId: number; accountId?: number; analyticAccountId?: number; qty: number; unitPrice: string; taxRate: string }>>([
    { productId: 0, qty: 1, unitPrice: '0.00', taxRate: '18.00' }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoadingBills(true);
      const res = await fetch('/api/bills');
      const json = await res.json();
      if (json.data) setBills(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/purchase-orders');
      const json = await res.json();
      if (json.data) setOrders(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchRefs = async () => {
    try {
      const [cRes, pRes, aRes, aaRes] = await Promise.all([
        fetch('/api/contacts?type=vendor'),
        fetch('/api/products'),
        fetch('/api/accounts?type=expense'),
        fetch('/api/analytic-accounts')
      ]);
      const [c, p, a, aa] = await Promise.all([cRes.json(), pRes.json(), aRes.json(), aaRes.json()]);
      if (c.data) setContacts(c.data);
      if (p.data) setProducts(p.data);
      if (a.data) setAccounts(a.data);
      if (aa.data) setAnalytics(aa.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchOrders();
    fetchRefs();
  }, []);

  const handleConfirmBill = async (id: number) => {
    setError(null);
    setWarningMsg(null);
    try {
      const res = await fetch(`/api/bills/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.error) {
        if (json.error.severity === 'warning') {
          setWarningMsg(json.error.message);
        } else {
          setError(json.error.message);
          return;
        }
      }
      setSuccessMsg(`Vendor Bill #${json.data?.number || id} confirmed! Journal Entry posted to ledger.`);
      fetchBills();
      if (selectedBill) {
        const updated = await fetch(`/api/bills/${id}`).then(r => r.json());
        if (updated.data) setSelectedBill(updated.data);
      }
    } catch (e: any) {
      setError(e.message || 'Confirm failed');
    }
  };

  const handleConfirmPO = async (id: number) => {
    setError(null);
    setWarningMsg(null);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.error && json.error.severity === 'warning') {
        setWarningMsg(json.error.message);
      } else if (json.error) {
        setError(json.error.message);
        return;
      }
      setSuccessMsg(`Purchase Order #${json.data?.number || id} confirmed. Zero ledger impact.`);
      fetchOrders();
      if (selectedOrder) {
        const updated = await fetch(`/api/purchase-orders/${id}`).then(r => r.json());
        if (updated.data) setSelectedOrder(updated.data);
      }
    } catch (e: any) {
      setError(e.message || 'Confirm failed');
    }
  };

  const handleCreateBillFromPO = async (poId: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/create-bill`, { method: 'POST' });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }
      setSuccessMsg(`Draft Bill ${json.data.billNumber} created from PO!`);
      fetchBills();
      setSubTab('bills');
      setBillView('list');
    } catch (e: any) {
      setError(e.message || 'Bill creation failed');
    }
  };

  const handleSaveBill = async () => {
    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          billDate: formDate,
          dueDate: formDueDate,
          billReference: billRef,
          lines: formLines.map(l => ({
            productId: l.productId,
            accountId: l.accountId || 6,
            analyticAccountId: l.analyticAccountId || null,
            qty: l.qty,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }
      setSuccessMsg(`Draft Vendor Bill #${json.data.number} created!`);
      setBillView('list');
      fetchBills();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-body">
      {/* Submenu tabs */}
      <div className="flex items-center justify-between border-b border-brown-300 pb-3 mb-6">
        <div className="flex space-x-3">
          <button
            onClick={() => { setSubTab('bills'); setBillView('list'); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'bills' ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Vendor Bills
          </button>
          <button
            onClick={() => { setSubTab('orders'); setOrderView('list'); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'orders' ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Purchase Orders
          </button>
        </div>

        <div>
          {subTab === 'bills' && billView === 'list' && (
            <button
              onClick={() => {
                setBillView('new');
                setVendorId(contacts[0]?.id || 0);
                setFormLines([{ productId: products[0]?.id || 1, qty: 1, unitPrice: products[0]?.cost_price || '1000.00', taxRate: products[0]?.tax_rate || '18.00' }]);
              }}
              className="px-4 py-2 bg-brown-900 hover:bg-brown-800 text-cream font-semibold rounded-lg text-sm shadow-sm transition-colors"
            >
              + Create Vendor Bill
            </button>
          )}
          {subTab === 'orders' && orderView === 'list' && (
            <button
              onClick={() => {
                setOrderView('new');
                setVendorId(contacts[0]?.id || 0);
                setFormLines([{ productId: products[0]?.id || 1, qty: 1, unitPrice: products[0]?.cost_price || '1000.00', taxRate: products[0]?.tax_rate || '18.00' }]);
              }}
              className="px-4 py-2 bg-brown-900 hover:bg-brown-800 text-cream font-semibold rounded-lg text-sm shadow-sm transition-colors"
            >
              + Create Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && <BlockingWarning message={error} />}
      {warningMsg && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-sm flex justify-between">
          <span>⚠️ {warningMsg}</span>
          <button onClick={() => setWarningMsg(null)} className="font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-sm flex justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* VENDOR BILLS SECTION */}
      {subTab === 'bills' && (
        billView === 'list' ? (
          <div className="bg-surface rounded-xl border border-brown-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brown-200 flex justify-between items-center bg-brown-50/50">
              <h3 className="font-display font-bold text-lg text-brown-900">Vendor Bills ({bills.length})</h3>
              <span className="text-xs text-brown-600 font-mono">Real-time PostgreSQL ledger sync</span>
            </div>
            {loadingBills ? (
              <div className="p-8 text-center text-brown-600">Loading vendor bills...</div>
            ) : bills.length === 0 ? (
              <div className="p-8 text-center text-brown-600">No vendor bills found. Click "+ Create Vendor Bill" to post your first bill.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                      <th className="py-3 px-4">Bill No.</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Bill Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Amount Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(bill => (
                      <tr key={bill.id} className="border-b border-brown-100 hover:bg-brown-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-brown-900">{bill.number}</td>
                        <td className="py-3 px-4 font-medium text-brown-900">{bill.vendorName}</td>
                        <td className="py-3 px-4 text-brown-700">{bill.billDate}</td>
                        <td className="py-3 px-4 text-brown-700">{bill.dueDate || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-brown-900">₹{parseFloat(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-mono text-brown-700">₹{parseFloat(bill.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            bill.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            bill.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {bill.paymentStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center space-x-2">
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handleConfirmBill(bill.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-cream rounded text-xs font-semibold shadow-xs"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedBill(bill); setBillView('form'); }}
                            className="px-2.5 py-1 bg-brown-200 hover:bg-brown-300 text-brown-900 rounded text-xs font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : billView === 'new' ? (
          <div className="bg-surface p-6 rounded-xl border border-brown-300 shadow-sm max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b border-brown-200 pb-3 mb-4">
              <h3 className="font-display font-bold text-lg text-brown-900">Create Draft Vendor Bill</h3>
              <button onClick={() => setBillView('list')} className="text-sm font-semibold text-brown-600 hover:text-brown-900">Cancel</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Vendor *</label>
                <select
                  value={vendorId}
                  onChange={e => setVendorId(Number(e.target.value))}
                  className="w-full border border-brown-300 rounded-lg p-2 bg-cream font-body"
                >
                  <option value={0}>-- Select Vendor --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Vendor Bill Reference</label>
                <input
                  type="text"
                  placeholder="e.g. INV/2026/0912"
                  value={billRef}
                  onChange={e => setBillRef(e.target.value)}
                  className="w-full border border-brown-300 rounded-lg p-2 bg-cream font-body"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bill Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full border border-brown-300 rounded-lg p-2 bg-cream font-body"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="w-full border border-brown-300 rounded-lg p-2 bg-cream font-body"
                />
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-brown-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-brown-100/60 p-2 font-semibold text-xs text-brown-900 flex justify-between">
                <span>Bill Line Items</span>
                <button
                  onClick={() => setFormLines([...formLines, { productId: products[0]?.id || 1, qty: 1, unitPrice: products[0]?.cost_price || '1000.00', taxRate: '18.00' }])}
                  className="text-brown-800 underline font-bold"
                >
                  + Add Line
                </button>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-brown-50 border-b border-brown-200">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2">Expense Account</th>
                    <th className="p-2">Analytic Account</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price (₹)</th>
                    <th className="p-2 text-right">Tax (%)</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formLines.map((line, idx) => (
                    <tr key={idx} className="border-b border-brown-100">
                      <td className="p-2">
                        <select
                          value={line.productId}
                          onChange={e => {
                            const pId = Number(e.target.value);
                            const p = products.find(x => x.id === pId);
                            const copy = [...formLines];
                            copy[idx].productId = pId;
                            if (p) {
                              copy[idx].unitPrice = p.cost_price;
                              copy[idx].taxRate = p.tax_rate;
                            }
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 bg-cream w-full"
                        >
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={line.accountId || 6}
                          onChange={e => {
                            const copy = [...formLines];
                            copy[idx].accountId = Number(e.target.value);
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 bg-cream w-full"
                        >
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={line.analyticAccountId || 0}
                          onChange={e => {
                            const copy = [...formLines];
                            copy[idx].analyticAccountId = Number(e.target.value) || undefined;
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 bg-cream w-full"
                        >
                          <option value={0}>None</option>
                          {analytics.map(aa => <option key={aa.id} value={aa.id}>{aa.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={e => {
                            const copy = [...formLines];
                            copy[idx].qty = Number(e.target.value);
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 w-16 text-right bg-cream"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="text"
                          value={line.unitPrice}
                          onChange={e => {
                            const copy = [...formLines];
                            copy[idx].unitPrice = e.target.value;
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 w-24 text-right bg-cream"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="text"
                          value={line.taxRate}
                          onChange={e => {
                            const copy = [...formLines];
                            copy[idx].taxRate = e.target.value;
                            setFormLines(copy);
                          }}
                          className="border border-brown-300 rounded p-1 w-16 text-right bg-cream"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {formLines.length > 1 && (
                          <button
                            onClick={() => setFormLines(formLines.filter((_, i) => i !== idx))}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={() => setBillView('list')} className="px-4 py-2 border border-brown-300 rounded-lg text-sm font-semibold text-brown-800">Cancel</button>
              <button onClick={handleSaveBill} className="px-5 py-2 bg-brown-900 hover:bg-brown-800 text-cream rounded-lg text-sm font-semibold shadow-sm">Save Draft Bill</button>
            </div>
          </div>
        ) : (
          /* Detail view */
          selectedBill && (
            <div className="bg-surface p-6 rounded-xl border border-brown-300 shadow-sm max-w-4xl mx-auto">
              <div className="flex justify-between items-start border-b border-brown-200 pb-4 mb-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="font-display font-bold text-2xl text-brown-900">{selectedBill.number}</h2>
                    <StatusBadge status={selectedBill.status} />
                  </div>
                  <p className="text-sm text-brown-600 mt-1">Vendor: <span className="font-semibold text-brown-900">{selectedBill.vendorName}</span></p>
                </div>
                <div className="flex space-x-2">
                  {selectedBill.status === 'draft' && (
                    <button
                      onClick={() => handleConfirmBill(selectedBill.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-cream text-sm font-semibold rounded-lg shadow-sm"
                    >
                      Confirm Bill (Post to Ledger)
                    </button>
                  )}
                  <button
                    onClick={() => setBillView('list')}
                    className="px-3 py-2 border border-brown-300 rounded-lg text-sm font-semibold text-brown-800 hover:bg-brown-100"
                  >
                    Back to List
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-xs mb-6 bg-brown-50 p-4 rounded-lg border border-brown-200">
                <div><span className="text-brown-600 block">Bill Date:</span><span className="font-semibold text-sm">{selectedBill.billDate}</span></div>
                <div><span className="text-brown-600 block">Due Date:</span><span className="font-semibold text-sm">{selectedBill.dueDate || '-'}</span></div>
                <div><span className="text-brown-600 block">Bill Reference:</span><span className="font-semibold text-sm">{selectedBill.billReference || '-'}</span></div>
                <div><span className="text-brown-600 block">Journal Entry ID:</span><span className="font-semibold text-sm font-mono">{selectedBill.journalEntryId || 'Pending Confirm'}</span></div>
              </div>

              <table className="w-full text-xs text-left border border-brown-200 rounded-lg overflow-hidden mb-6">
                <thead className="bg-brown-100/80 font-semibold border-b border-brown-200">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Account</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Tax Rate</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.lines.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-brown-100">
                      <td className="p-2.5 font-medium">{l.productName}</td>
                      <td className="p-2.5 text-brown-700">{l.accountName}</td>
                      <td className="p-2.5 text-right font-mono">{l.qty}</td>
                      <td className="p-2.5 text-right font-mono">₹{parseFloat(l.unitPrice).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono">{l.taxRate}%</td>
                      <td className="p-2.5 text-right font-mono font-bold">₹{parseFloat(l.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 bg-brown-50 p-4 rounded-lg border border-brown-200 text-xs space-y-1.5">
                  <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">₹{parseFloat(selectedBill.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax Amount:</span><span className="font-mono">₹{parseFloat(selectedBill.taxTotal).toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-brown-300 pt-1.5 font-bold text-sm text-brown-900">
                    <span>Grand Total:</span><span className="font-mono">₹{parseFloat(selectedBill.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )
      )}

      {/* PURCHASE ORDERS SECTION */}
      {subTab === 'orders' && (
        orderView === 'list' ? (
          <div className="bg-surface rounded-xl border border-brown-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brown-200 flex justify-between items-center bg-brown-50/50">
              <h3 className="font-display font-bold text-lg text-brown-900">Purchase Orders ({orders.length})</h3>
              <span className="text-xs text-brown-600 font-mono">Zero-ledger commitment workflow</span>
            </div>
            {loadingOrders ? (
              <div className="p-8 text-center text-brown-600">Loading purchase orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-brown-600">No purchase orders found. Click "+ Create Purchase Order" to create one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                      <th className="py-3 px-4">PO No.</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(po => (
                      <tr key={po.id} className="border-b border-brown-100 hover:bg-brown-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-brown-900">{po.number}</td>
                        <td className="py-3 px-4 font-medium text-brown-900">{po.vendorName}</td>
                        <td className="py-3 px-4 text-brown-700">{po.poDate}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-brown-900">₹{parseFloat(po.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-3 px-4 text-center space-x-2">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleConfirmPO(po.id)}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-cream rounded text-xs font-semibold shadow-xs"
                            >
                              Confirm PO
                            </button>
                          )}
                          {po.status === 'confirmed' && (
                            <button
                              onClick={() => handleCreateBillFromPO(po.id)}
                              className="px-2.5 py-1 bg-brown-800 hover:bg-brown-900 text-cream rounded text-xs font-semibold shadow-xs"
                            >
                              Generate Bill
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedOrder(po); setOrderView('form'); }}
                            className="px-2.5 py-1 bg-brown-200 hover:bg-brown-300 text-brown-900 rounded text-xs font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* PO Detail / Form */
          selectedOrder && (
            <div className="bg-surface p-6 rounded-xl border border-brown-300 shadow-sm max-w-4xl mx-auto">
              <div className="flex justify-between items-start border-b border-brown-200 pb-4 mb-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="font-display font-bold text-2xl text-brown-900">{selectedOrder.number}</h2>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <p className="text-sm text-brown-600 mt-1">Vendor: <span className="font-semibold text-brown-900">{selectedOrder.vendorName}</span></p>
                </div>
                <div className="flex space-x-2">
                  {selectedOrder.status === 'draft' && (
                    <button
                      onClick={() => handleConfirmPO(selectedOrder.id)}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-cream text-sm font-semibold rounded-lg shadow-sm"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => handleCreateBillFromPO(selectedOrder.id)}
                      className="px-4 py-2 bg-brown-900 hover:bg-brown-800 text-cream text-sm font-semibold rounded-lg shadow-sm"
                    >
                      Create Vendor Bill
                    </button>
                  )}
                  <button
                    onClick={() => setOrderView('list')}
                    className="px-3 py-2 border border-brown-300 rounded-lg text-sm font-semibold text-brown-800 hover:bg-brown-100"
                  >
                    Back to List
                  </button>
                </div>
              </div>

              <table className="w-full text-xs text-left border border-brown-200 rounded-lg overflow-hidden mb-6">
                <thead className="bg-brown-100/80 font-semibold border-b border-brown-200">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Analytic Dimension</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-brown-100">
                      <td className="p-2.5 font-medium">{l.productName}</td>
                      <td className="p-2.5 text-brown-700">{l.analyticAccountName || 'General'}</td>
                      <td className="p-2.5 text-right font-mono">{l.qty}</td>
                      <td className="p-2.5 text-right font-mono">₹{parseFloat(l.unitPrice).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold">₹{parseFloat(l.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 bg-brown-50 p-4 rounded-lg border border-brown-200 text-xs">
                  <div className="flex justify-between font-bold text-sm text-brown-900">
                    <span>Total Order Amount:</span>
                    <span className="font-mono">₹{parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
};
