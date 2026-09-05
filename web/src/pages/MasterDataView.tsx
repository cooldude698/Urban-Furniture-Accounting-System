import React, { useState, useEffect } from 'react';

export const MasterDataView: React.FC = () => {
  const [subTab, setSubTab] = useState<'contacts' | 'products' | 'accounts' | 'journals' | 'analytics' | 'budgets'>('contacts');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Contacts modal/statement
  const [statementContact, setStatementContact] = useState<any | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState<boolean>(false);

  // New item modal
  const [showCreateContact, setShowCreateContact] = useState<boolean>(false);
  const [newContact, setNewContact] = useState({ name: '', type: 'customer', email: '', mobile: '', address: '', city: '', state: '', pincode: '', gstin: '' });

  const [showCreateProduct, setShowCreateProduct] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({ name: '', type: 'goods', category: 'Living Room', sales_price: '5000.00', cost_price: '3000.00', mrp: '6000.00', tax_rate: '18.00', stock_qty: '10' });

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/contacts';
      if (subTab === 'products') endpoint = '/api/products';
      if (subTab === 'accounts') endpoint = '/api/accounts';
      if (subTab === 'journals') endpoint = '/api/journals';
      if (subTab === 'analytics') endpoint = '/api/analytic-accounts';
      if (subTab === 'budgets') endpoint = '/api/budgets';

      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const handleOpenStatement = async (contact: any) => {
    setStatementContact(contact);
    setLoadingStatement(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/statement`);
      const json = await res.json();
      if (json.data) setStatementData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      const json = await res.json();
      if (json.data) {
        setShowCreateContact(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const json = await res.json();
      if (json.data) {
        setShowCreateProduct(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-body">
      {/* Submenu tabs */}
      <div className="flex items-center justify-between border-b border-brown-300 pb-3 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { key: 'contacts', label: 'Contacts' },
            { key: 'products', label: 'Products & Services' },
            { key: 'accounts', label: 'Chart of Accounts' },
            { key: 'journals', label: 'Journals' },
            { key: 'analytics', label: 'Analytic Accounts' },
            { key: 'budgets', label: 'Budgets' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key as any)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                subTab === t.key ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {subTab === 'contacts' && (
            <button
              onClick={() => setShowCreateContact(true)}
              className="px-4 py-1.5 bg-brown-900 text-cream font-semibold rounded-lg text-sm hover:bg-brown-800"
            >
              + Add Contact
            </button>
          )}
          {subTab === 'products' && (
            <button
              onClick={() => setShowCreateProduct(true)}
              className="px-4 py-1.5 bg-brown-900 text-cream font-semibold rounded-lg text-sm hover:bg-brown-800"
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-brown-300 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brown-200 flex justify-between items-center bg-brown-50/50">
          <h3 className="font-display font-bold text-lg text-brown-900 capitalize">
            {subTab.replace('-', ' ')} Directory ({data.length})
          </h3>
          <span className="text-xs text-brown-600 font-mono">Synced from Postgres database</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-brown-600">Loading {subTab}...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-brown-600">No records found for {subTab}.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* CONTACTS TABLE */}
            {subTab === 'contacts' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">City / State</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((c: any) => (
                    <tr key={c.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                      <td className="py-3 px-4 font-semibold text-brown-900">{c.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          c.type === 'vendor' ? 'bg-amber-100 text-amber-800' :
                          c.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-brown-700">{c.email || '-'}</td>
                      <td className="py-3 px-4 text-brown-700">{c.mobile || '-'}</td>
                      <td className="py-3 px-4 text-brown-700">{c.city ? `${c.city}, ${c.state || ''}` : '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenStatement(c)}
                          className="px-2.5 py-1 bg-brown-100 hover:bg-brown-200 text-brown-900 rounded text-xs font-semibold"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PRODUCTS TABLE */}
            {subTab === 'products' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Sales Price (₹)</th>
                    <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                    <th className="py-3 px-4 text-right">Tax Rate</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p: any) => (
                    <tr key={p.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-brown-700">{p.sku || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-brown-900">{p.name}</td>
                      <td className="py-3 px-4 uppercase text-xs text-brown-600">{p.type}</td>
                      <td className="py-3 px-4 text-brown-700">{p.category || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">₹{parseFloat(p.sales_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono text-brown-700">₹{parseFloat(p.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono">{p.tax_rate}%</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        <span className={parseFloat(p.stock_qty) <= 5 && p.type === 'goods' ? 'text-rose-600 font-bold' : 'text-brown-900'}>
                          {parseFloat(p.stock_qty)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* CHART OF ACCOUNTS TABLE */}
            {subTab === 'accounts' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Account ID</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reporting Section</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a: any) => {
                    const isBs = ['asset', 'liability', 'bank', 'capital', 'cash'].includes(a.type);
                    return (
                      <tr key={a.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-brown-600">#{a.id}</td>
                        <td className="py-3 px-4 font-semibold text-brown-900">{a.name}</td>
                        <td className="py-3 px-4 uppercase text-xs text-brown-700 font-mono">{a.type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            isBs ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {isBs ? 'Balance Sheet' : 'Profit & Loss'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* JOURNALS TABLE */}
            {subTab === 'journals' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Journal Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Default Account</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((j: any) => (
                    <tr key={j.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                      <td className="py-3 px-4 font-semibold text-brown-900">{j.name}</td>
                      <td className="py-3 px-4 uppercase text-xs text-brown-700 font-mono">{j.type}</td>
                      <td className="py-3 px-4 text-brown-800 font-medium">{j.default_account_name || `Account #${j.default_account_id}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ANALYTIC ACCOUNTS TABLE */}
            {subTab === 'analytics' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Analytic Account Name</th>
                    <th className="py-3 px-4">Cost Center / Dimension Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((aa: any) => (
                    <tr key={aa.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                      <td className="py-3 px-4 font-semibold text-brown-900">{aa.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          aa.type === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}>
                          {aa.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BUDGETS TABLE */}
            {subTab === 'budgets' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Budget Name</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Responsible User</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Committed Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((b: any) => {
                    const totalCommitted = (b.lines || []).reduce((acc: number, l: any) => acc + parseFloat(l.committed_amount || 0), 0);
                    return (
                      <tr key={b.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                        <td className="py-3 px-4 font-semibold text-brown-900">{b.name}</td>
                        <td className="py-3 px-4 text-brown-700">{b.period_start} to {b.period_end}</td>
                        <td className="py-3 px-4 text-brown-700">{b.responsible_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-brown-900">
                          ₹{totalCommitted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* VENDOR STATEMENT MODAL */}
      {statementContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-brown-300 shadow-xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-brown-200 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900">Statement of Account: {statementContact.name}</h3>
                <span className="text-xs text-brown-600 font-mono">Vendor Chronological Running Balance</span>
              </div>
              <button onClick={() => setStatementContact(null)} className="font-bold text-lg text-brown-700 hover:text-brown-950">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingStatement ? (
                <div className="py-8 text-center text-brown-600">Calculating running balance statement...</div>
              ) : statementData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-brown-50 rounded-lg border border-brown-200 text-xs">
                    <div><span className="text-brown-600 block">Total Billed:</span><span className="font-bold text-sm font-mono">₹{statementData.total_billed}</span></div>
                    <div><span className="text-brown-600 block">Total Paid:</span><span className="font-bold text-sm font-mono">₹{statementData.total_paid}</span></div>
                    <div><span className="text-brown-600 block">Closing Balance:</span><span className="font-bold text-sm font-mono text-amber-900">₹{statementData.closing_balance}</span></div>
                  </div>

                  <table className="w-full text-xs text-left border border-brown-200 rounded-lg overflow-hidden">
                    <thead className="bg-brown-100/70 font-semibold border-b border-brown-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Ref / Doc</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Debit (₹)</th>
                        <th className="p-2 text-right">Credit (₹)</th>
                        <th className="p-2 text-right">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.lines?.map((l: any, i: number) => (
                        <tr key={i} className="border-b border-brown-100">
                          <td className="p-2">{l.date}</td>
                          <td className="p-2 font-mono font-semibold">{l.doc_number}</td>
                          <td className="p-2 uppercase text-[10px] font-bold">{l.type}</td>
                          <td className="p-2 text-right font-mono">{parseFloat(l.debit) > 0 ? `₹${l.debit}` : '-'}</td>
                          <td className="p-2 text-right font-mono">{parseFloat(l.credit) > 0 ? `₹${l.credit}` : '-'}</td>
                          <td className="p-2 text-right font-mono font-bold">₹{l.running_balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            <div className="border-t border-brown-200 pt-3 mt-3 flex justify-end">
              <button onClick={() => setStatementContact(null)} className="px-4 py-1.5 bg-brown-900 text-cream rounded-lg text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CONTACT MODAL */}
      {showCreateContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-brown-300 shadow-xl max-w-md w-full p-6">
            <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-4">Add Contact</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1 text-xs">Name *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-xs">Type</label>
                <select
                  value={newContact.type}
                  onChange={e => setNewContact({ ...newContact, type: e.target.value })}
                  className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-xs">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-xs">Mobile</label>
                <input
                  type="text"
                  value={newContact.mobile}
                  onChange={e => setNewContact({ ...newContact, mobile: e.target.value })}
                  className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowCreateContact(false)} className="px-3 py-1.5 border rounded text-xs font-semibold">Cancel</button>
              <button onClick={handleCreateContact} className="px-4 py-1.5 bg-brown-900 text-cream rounded text-xs font-semibold">Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-brown-300 shadow-xl max-w-md w-full p-6">
            <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-4">Add Product</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1 text-xs">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-xs">Type</label>
                  <select
                    value={newProduct.type}
                    onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}
                    className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                  >
                    <option value="goods">Goods</option>
                    <option value="service">Service</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-xs">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-xs">Sales Price (₹)</label>
                  <input
                    type="text"
                    value={newProduct.sales_price}
                    onChange={e => setNewProduct({ ...newProduct, sales_price: e.target.value })}
                    className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-xs">Cost Price (₹)</label>
                  <input
                    type="text"
                    value={newProduct.cost_price}
                    onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                    className="w-full border border-brown-300 rounded p-1.5 bg-cream"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowCreateProduct(false)} className="px-3 py-1.5 border rounded text-xs font-semibold">Cancel</button>
              <button onClick={handleCreateProduct} className="px-4 py-1.5 bg-brown-900 text-cream rounded text-xs font-semibold">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
