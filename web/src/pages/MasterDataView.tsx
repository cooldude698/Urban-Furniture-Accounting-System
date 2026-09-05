import React, { useState, useEffect } from 'react';

export const MasterDataView: React.FC = () => {
  const [subTab, setSubTab] = useState<'contacts' | 'products' | 'accounts' | 'journals' | 'analytics' | 'budgets'>('contacts');

  // View mode: 'list' (default) or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auxiliary data for dropdowns
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [analyticsList, setAnalyticsList] = useState<any[]>([]);

  // Form states
  const [contactForm, setContactForm] = useState({
    name: '',
    type: 'customer',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
  });

  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    type: 'goods',
    category: 'Living Room',
    sales_price: '5000.00',
    cost_price: '3000.00',
    mrp: '6000.00',
    tax_rate: '18.00',
    stock_qty: '10',
  });

  const [accountForm, setAccountForm] = useState({
    name: '',
    code: '',
    type: 'asset',
  });

  const [journalForm, setJournalForm] = useState({
    name: '',
    type: 'sales',
    default_account_id: 1,
  });

  const [analyticForm, setAnalyticForm] = useState({
    name: '',
    type: 'expense',
    description: '',
  });

  const [budgetForm, setBudgetForm] = useState({
    name: '',
    period_start: '2026-01-01',
    period_end: '2026-12-31',
    responsible_name: 'Administrator',
    lines: [
      { analytic_account_id: 1, committed_amount: '100000.00' },
    ],
  });

  // Statement modal for contacts
  const [statementContact, setStatementContact] = useState<any | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState<boolean>(false);

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

  // Load auxiliary data for dropdowns
  useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.json())
      .then(j => { if (j.data) setAccountsList(j.data); })
      .catch(() => {});

    fetch('/api/analytic-accounts')
      .then(r => r.json())
      .then(j => { if (j.data) setAnalyticsList(j.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setViewMode('list');
    setSelectedItem(null);
    setFormError(null);
    fetchData();
  }, [subTab]);

  // Open blank form view for creating a new record
  const handleOpenNew = () => {
    setSelectedItem(null);
    setFormError(null);

    if (subTab === 'contacts') {
      setContactForm({
        name: '',
        type: 'customer',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
      });
    } else if (subTab === 'products') {
      setProductForm({
        sku: '',
        name: '',
        type: 'goods',
        category: 'Living Room',
        sales_price: '5000.00',
        cost_price: '3000.00',
        mrp: '6000.00',
        tax_rate: '18.00',
        stock_qty: '10',
      });
    } else if (subTab === 'accounts') {
      setAccountForm({
        name: '',
        code: '',
        type: 'asset',
      });
    } else if (subTab === 'journals') {
      setJournalForm({
        name: '',
        type: 'sales',
        default_account_id: accountsList[0]?.id || 1,
      });
    } else if (subTab === 'analytics') {
      setAnalyticForm({
        name: '',
        type: 'expense',
        description: '',
      });
    } else if (subTab === 'budgets') {
      setBudgetForm({
        name: '',
        period_start: '2026-01-01',
        period_end: '2026-12-31',
        responsible_name: 'Administrator',
        lines: [
          { analytic_account_id: analyticsList[0]?.id || 1, committed_amount: '100000.00' },
        ],
      });
    }

    setViewMode('form');
  };

  // Open form view with saved details when clicking an existing record
  const handleSelectRecord = (record: any) => {
    setSelectedItem(record);
    setFormError(null);

    if (subTab === 'contacts') {
      setContactForm({
        name: record.name || '',
        type: record.type || 'customer',
        email: record.email || '',
        mobile: record.mobile || '',
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        pincode: record.pincode || '',
        gstin: record.gstin || '',
      });
    } else if (subTab === 'products') {
      setProductForm({
        sku: record.sku || '',
        name: record.name || '',
        type: record.type || 'goods',
        category: record.category || 'Living Room',
        sales_price: record.sales_price?.toString() || '0.00',
        cost_price: record.cost_price?.toString() || '0.00',
        mrp: record.mrp?.toString() || '0.00',
        tax_rate: record.tax_rate?.toString() || '18.00',
        stock_qty: record.stock_qty?.toString() || '0',
      });
    } else if (subTab === 'accounts') {
      setAccountForm({
        name: record.name || '',
        code: record.code || '',
        type: record.type || 'asset',
      });
    } else if (subTab === 'journals') {
      setJournalForm({
        name: record.name || '',
        type: record.type || 'sales',
        default_account_id: record.default_account_id || accountsList[0]?.id || 1,
      });
    } else if (subTab === 'analytics') {
      setAnalyticForm({
        name: record.name || '',
        type: record.type || 'expense',
        description: record.description || '',
      });
    } else if (subTab === 'budgets') {
      setBudgetForm({
        name: record.name || '',
        period_start: record.period_start || '2026-01-01',
        period_end: record.period_end || '2026-12-31',
        responsible_name: record.responsible_name || 'Administrator',
        lines: record.lines && record.lines.length > 0 ? record.lines : [
          { analytic_account_id: analyticsList[0]?.id || 1, committed_amount: '100000.00' },
        ],
      });
    }

    setViewMode('form');
  };

  // Save (Create new or update existing)
  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const isNew = !selectedItem;
      let endpoint = '';
      let method = isNew ? 'POST' : 'PUT';
      let payload: any = {};

      if (subTab === 'contacts') {
        endpoint = isNew ? '/api/contacts' : `/api/contacts/${selectedItem.id}`;
        payload = contactForm;
      } else if (subTab === 'products') {
        endpoint = isNew ? '/api/products' : `/api/products/${selectedItem.id}`;
        payload = productForm;
      } else if (subTab === 'accounts') {
        endpoint = isNew ? '/api/accounts' : `/api/accounts/${selectedItem.id}`;
        payload = accountForm;
      } else if (subTab === 'journals') {
        endpoint = isNew ? '/api/journals' : `/api/journals/${selectedItem.id}`;
        payload = journalForm;
      } else if (subTab === 'analytics') {
        endpoint = isNew ? '/api/analytic-accounts' : `/api/analytic-accounts/${selectedItem.id}`;
        payload = analyticForm;
      } else if (subTab === 'budgets') {
        endpoint = isNew ? '/api/budgets' : `/api/budgets/${selectedItem.id}`;
        payload = budgetForm;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to save record');
      }

      await fetchData();
      setViewMode('list');
      setSelectedItem(null);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Toggle archive
  const handleToggleArchive = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      let endpoint = '';
      if (subTab === 'contacts') endpoint = `/api/contacts/${selectedItem.id}/archive`;
      else if (subTab === 'products') endpoint = `/api/products/${selectedItem.id}/archive`;
      else if (subTab === 'accounts') endpoint = `/api/accounts/${selectedItem.id}/archive`;
      else if (subTab === 'journals') endpoint = `/api/journals/${selectedItem.id}/archive`;
      else if (subTab === 'analytics') endpoint = `/api/analytic-accounts/${selectedItem.id}/archive`;

      if (endpoint) {
        await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived: !selectedItem.is_archived }),
        });
        await fetchData();
        setViewMode('list');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenStatement = async (e: React.MouseEvent, contact: any) => {
    e.stopPropagation();
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-body">
      {/* Top Submenu tabs */}
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

        {/* Action button in List View */}
        {viewMode === 'list' && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-1.5 bg-brown-900 text-cream font-semibold rounded-lg text-sm hover:bg-brown-800 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>+ New</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. LIST VIEW (DEFAULT FOR ALL MASTERS)                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brown-200 flex justify-between items-center bg-brown-50/50">
            <div>
              <h3 className="font-display font-bold text-lg text-brown-900 capitalize">
                {subTab.replace('-', ' ')} Directory ({data.length})
              </h3>
              <p className="text-xs text-brown-600">Click any record to view or edit saved details</p>
            </div>
            <span className="text-xs text-brown-500 font-mono">Synced from database</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-brown-600 font-medium">Loading {subTab}...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-brown-600">
              <p className="mb-3">No records found for {subTab}.</p>
              <button
                onClick={handleOpenNew}
                className="px-4 py-1.5 bg-brown-900 text-cream font-semibold rounded-lg text-xs hover:bg-brown-800"
              >
                + Create First Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* CONTACTS LIST */}
              {subTab === 'contacts' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">City / State</th>
                      <th className="py-3 px-4 text-center">Statement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((c: any) => (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectRecord(c)}
                        className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                      >
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
                        <td className="py-3 px-4 text-brown-700">{c.email || '—'}</td>
                        <td className="py-3 px-4 text-brown-700">{c.mobile || '—'}</td>
                        <td className="py-3 px-4 text-brown-700">{c.city ? `${c.city}, ${c.state || ''}` : '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => handleOpenStatement(e, c)}
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

              {/* PRODUCTS LIST */}
              {subTab === 'products' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
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
                      <tr
                        key={p.id}
                        onClick={() => handleSelectRecord(p)}
                        className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                      >
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-brown-700">{p.sku || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-brown-900">{p.name}</td>
                        <td className="py-3 px-4 uppercase text-xs text-brown-600 font-semibold">{p.type}</td>
                        <td className="py-3 px-4 text-brown-700">{p.category || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          ₹{parseFloat(p.sales_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-brown-700">
                          ₹{parseFloat(p.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{p.tax_rate}%</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span className={parseFloat(p.stock_qty || 0) <= 5 && p.type === 'goods' ? 'text-rose-600 font-bold' : 'text-brown-900'}>
                            {parseFloat(p.stock_qty || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* CHART OF ACCOUNTS LIST */}
              {subTab === 'accounts' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Account ID</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Account Code</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Reporting Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((a: any) => {
                      const isBs = ['asset', 'liability', 'bank', 'capital', 'cash'].includes(a.type);
                      return (
                        <tr
                          key={a.id}
                          onClick={() => handleSelectRecord(a)}
                          className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                        >
                          <td className="py-3 px-4 font-mono text-xs text-brown-600">#{a.id}</td>
                          <td className="py-3 px-4 font-semibold text-brown-900">{a.name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-brown-700">{a.code || '—'}</td>
                          <td className="py-3 px-4 uppercase text-xs text-brown-700 font-mono font-semibold">{a.type}</td>
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

              {/* JOURNALS LIST */}
              {subTab === 'journals' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Journal Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Default Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((j: any) => (
                      <tr
                        key={j.id}
                        onClick={() => handleSelectRecord(j)}
                        className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                      >
                        <td className="py-3 px-4 font-semibold text-brown-900">{j.name}</td>
                        <td className="py-3 px-4 uppercase text-xs text-brown-700 font-mono font-semibold">{j.type}</td>
                        <td className="py-3 px-4 text-brown-800 font-medium">{j.default_account_name || `Account #${j.default_account_id}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ANALYTIC ACCOUNTS LIST */}
              {subTab === 'analytics' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Analytic Account Name</th>
                      <th className="py-3 px-4">Cost Center Type</th>
                      <th className="py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((aa: any) => (
                      <tr
                        key={aa.id}
                        onClick={() => handleSelectRecord(aa)}
                        className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                      >
                        <td className="py-3 px-4 font-semibold text-brown-900">{aa.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            aa.type === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                          }`}>
                            {aa.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-brown-600 text-xs">{aa.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* BUDGETS LIST */}
              {subTab === 'budgets' && (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-brown-100/60 text-brown-900 font-semibold border-b border-brown-200 text-xs uppercase tracking-wider">
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
                        <tr
                          key={b.id}
                          onClick={() => handleSelectRecord(b)}
                          className="border-b border-brown-100 hover:bg-brown-50/80 cursor-pointer transition-colors h-[44px]"
                        >
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
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. FORM VIEW (BLANK ON NEW, POPULATED ON SAVED RECORD)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'form' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm overflow-hidden">
          {/* Form Action Header Bar */}
          <div className="px-6 py-4 border-b border-brown-200 bg-brown-50/70 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setSelectedItem(null);
                }}
                className="px-3 py-1.5 bg-surface hover:bg-brown-100 text-brown-800 text-xs font-semibold rounded-lg border border-brown-300 transition-colors"
              >
                ← Back to List
              </button>
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900">
                  {selectedItem ? `Edit ${selectedItem.name || 'Record'}` : `New ${subTab.slice(0, -1)}`}
                </h3>
                <span className="text-xs text-brown-500">
                  {selectedItem ? `ID: #${selectedItem.id} · Saved details loaded` : 'Enter new record details'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNew}
                className="px-3 py-1.5 bg-surface hover:bg-brown-100 text-brown-800 text-xs font-semibold rounded-lg border border-brown-300 transition-colors"
              >
                + New
              </button>

              {selectedItem && (
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  disabled={saving}
                  className="px-3 py-1.5 bg-surface hover:bg-brown-100 text-brown-700 text-xs font-semibold rounded-lg border border-brown-300 transition-colors"
                >
                  {selectedItem.is_archived ? 'Unarchive' : 'Archive'}
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-brown-900 hover:bg-brown-800 text-cream text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {saving ? 'Saving...' : selectedItem ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>

          {/* Form Body Error */}
          {formError && (
            <div className="m-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <div className="p-6">
            {/* ── CONTACT FORM ── */}
            {subTab === 'contacts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brown-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Modern Living Furnishings"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Contact Type *</label>
                  <select
                    value={contactForm.type}
                    onChange={e => setContactForm({ ...contactForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="both">Both (Customer & Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="accounts@modernliving.com"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={contactForm.mobile}
                    onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={contactForm.gstin}
                    onChange={e => setContactForm({ ...contactForm, gstin: e.target.value })}
                    placeholder="24ABCDE1234F1Z5"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brown-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={contactForm.address}
                    onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="Plot 42, GIDC Industrial Estate"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">City</label>
                  <input
                    type="text"
                    value={contactForm.city}
                    onChange={e => setContactForm({ ...contactForm, city: e.target.value })}
                    placeholder="Gandhinagar"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">State</label>
                    <input
                      type="text"
                      value={contactForm.state}
                      onChange={e => setContactForm({ ...contactForm, state: e.target.value })}
                      placeholder="Gujarat"
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={contactForm.pincode}
                      onChange={e => setContactForm({ ...contactForm, pincode: e.target.value })}
                      placeholder="382010"
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── PRODUCT FORM ── */}
            {subTab === 'products' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Teak Wood Coffee Table"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="FURN-TBL-0001"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Product Type *</label>
                  <select
                    value={productForm.type}
                    onChange={e => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  >
                    <option value="goods">Goods (Physical Product)</option>
                    <option value="service">Service</option>
                    <option value="combo">Combo (Pack / Bundle)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Living Room / Office"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Sales Price (₹) *</label>
                  <input
                    type="text"
                    value={productForm.sales_price}
                    onChange={e => setProductForm({ ...productForm, sales_price: e.target.value })}
                    placeholder="5000.00"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="text"
                    value={productForm.cost_price}
                    onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })}
                    placeholder="3000.00"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">MRP Ceiling (₹)</label>
                  <input
                    type="text"
                    value={productForm.mrp}
                    onChange={e => setProductForm({ ...productForm, mrp: e.target.value })}
                    placeholder="6000.00"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="text"
                    value={productForm.tax_rate}
                    onChange={e => setProductForm({ ...productForm, tax_rate: e.target.value })}
                    placeholder="18.00"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ── CHART OF ACCOUNTS FORM ── */}
            {subTab === 'accounts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                    placeholder="e.g. Raw Timber Inventory"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Account Code</label>
                  <input
                    type="text"
                    value={accountForm.code}
                    onChange={e => setAccountForm({ ...accountForm, code: e.target.value })}
                    placeholder="1005"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface font-mono focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brown-700 mb-1">Account Type (8 Types in 2 Groups) *</label>
                  <select
                    value={accountForm.type}
                    onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none font-medium"
                  >
                    <optgroup label="Balancesheet" className="font-bold text-brown-800 bg-brown-50">
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="bank">Bank</option>
                      <option value="capital">Capital</option>
                      <option value="cash">Cash</option>
                    </optgroup>
                    <optgroup label="Profit and Loss" className="font-bold text-brown-800 bg-brown-50">
                      <option value="income">Income</option>
                      <option value="expense">Expenses</option>
                      <option value="other_expense">Other Expenses</option>
                    </optgroup>
                  </select>
                </div>

                <div className="md:col-span-2 p-3 bg-brown-50 rounded-lg border border-brown-200 text-xs text-brown-700">
                  <span className="font-bold">Financial Statement Placement: </span>
                  <span className="font-semibold text-brown-900">
                    {['asset', 'liability', 'bank', 'capital', 'cash'].includes(accountForm.type)
                      ? 'Balance Sheet'
                      : 'Profit and Loss'}
                  </span>
                </div>
              </div>
            )}

            {/* ── JOURNALS FORM ── */}
            {subTab === 'journals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Journal Name *</label>
                  <input
                    type="text"
                    required
                    value={journalForm.name}
                    onChange={e => setJournalForm({ ...journalForm, name: e.target.value })}
                    placeholder="e.g. Showroom Sales"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Journal Type *</label>
                  <select
                    value={journalForm.type}
                    onChange={e => setJournalForm({ ...journalForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none uppercase font-mono"
                  >
                    <option value="sales">Sales</option>
                    <option value="purchase">Purchase</option>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brown-700 mb-1">Default Account (From CoA) *</label>
                  <select
                    value={journalForm.default_account_id}
                    onChange={e => setJournalForm({ ...journalForm, default_account_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  >
                    {accountsList.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── ANALYTIC ACCOUNTS FORM ── */}
            {subTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Analytic Account Name *</label>
                  <input
                    type="text"
                    required
                    value={analyticForm.name}
                    onChange={e => setAnalyticForm({ ...analyticForm, name: e.target.value })}
                    placeholder="e.g. Gandhinagar Showroom"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown-700 mb-1">Cost Center Type *</label>
                  <select
                    value={analyticForm.type}
                    onChange={e => setAnalyticForm({ ...analyticForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  >
                    <option value="expense">Expense (Cost Center)</option>
                    <option value="income">Income (Revenue Stream)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brown-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={analyticForm.description}
                    onChange={e => setAnalyticForm({ ...analyticForm, description: e.target.value })}
                    placeholder="Tracking operational and project costs for this center"
                    className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ── BUDGETS FORM ── */}
            {subTab === 'budgets' && (
              <div className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">Budget Name *</label>
                    <input
                      type="text"
                      required
                      value={budgetForm.name}
                      onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })}
                      placeholder="e.g. FY 2026 Annual Budget"
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">Responsible User</label>
                    <input
                      type="text"
                      value={budgetForm.responsible_name}
                      onChange={e => setBudgetForm({ ...budgetForm, responsible_name: e.target.value })}
                      placeholder="Administrator"
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">Period Start</label>
                    <input
                      type="date"
                      value={budgetForm.period_start}
                      onChange={e => setBudgetForm({ ...budgetForm, period_start: e.target.value })}
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brown-700 mb-1">Period End</label>
                    <input
                      type="date"
                      value={budgetForm.period_end}
                      onChange={e => setBudgetForm({ ...budgetForm, period_end: e.target.value })}
                      className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm bg-surface focus:outline-none"
                    />
                  </div>
                </div>

                {/* Budget Lines */}
                <div>
                  <h4 className="text-xs font-bold text-brown-700 uppercase tracking-wider mb-2">Budget Lines</h4>
                  <table className="w-full text-left text-xs border border-brown-200 rounded-lg overflow-hidden">
                    <thead className="bg-brown-100/60 font-semibold border-b border-brown-200">
                      <tr>
                        <th className="p-2">Analytic Account</th>
                        <th className="p-2 text-right">Committed Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetForm.lines.map((l, i) => (
                        <tr key={i} className="border-b border-brown-100">
                          <td className="p-2">
                            <select
                              value={l.analytic_account_id}
                              onChange={e => {
                                const newLines = [...budgetForm.lines];
                                newLines[i].analytic_account_id = parseInt(e.target.value, 10);
                                setBudgetForm({ ...budgetForm, lines: newLines });
                              }}
                              className="w-full p-1 border border-brown-300 rounded text-xs bg-surface"
                            >
                              {analyticsList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="text"
                              value={l.committed_amount}
                              onChange={e => {
                                const newLines = [...budgetForm.lines];
                                newLines[i].committed_amount = e.target.value;
                                setBudgetForm({ ...budgetForm, lines: newLines });
                              }}
                              className="p-1 border border-brown-300 rounded text-xs font-mono text-right w-32"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. VENDOR STATEMENT MODAL (Chronological ledger running balance) */}
      {/* ─────────────────────────────────────────────────────────── */}
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
                    <tbody className="divide-y divide-brown-100 font-mono">
                      {(statementData.rows || []).map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-brown-50/50">
                          <td className="p-2 font-sans">{r.date}</td>
                          <td className="p-2 font-bold">{r.doc_number || r.reference}</td>
                          <td className="p-2 font-sans uppercase text-[10px]">{r.type}</td>
                          <td className="p-2 text-right">{r.debit > 0 ? `₹${r.debit}` : '—'}</td>
                          <td className="p-2 text-right">{r.credit > 0 ? `₹${r.credit}` : '—'}</td>
                          <td className="p-2 text-right font-bold text-brown-900">₹{r.running_balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-brown-500">No activity recorded for this partner yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
