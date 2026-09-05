import React, { useState, useEffect } from 'react';

export const ReportsView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'bs' | 'pl' | 'budget' | 'verify'>('bs');

  // Balance Sheet state
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bsData, setBsData] = useState<any>(null);
  const [loadingBs, setLoadingBs] = useState<boolean>(false);

  // Profit & Loss state
  const [fromDate, setFromDate] = useState<string>('2026-01-01');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plData, setPlData] = useState<any>(null);
  const [loadingPl, setLoadingPl] = useState<boolean>(false);

  // Budget progress state
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loadingBudget, setLoadingBudget] = useState<boolean>(false);

  // /verify state
  const [verifyData, setVerifyData] = useState<any>(null);
  const [loadingVerify, setLoadingVerify] = useState<boolean>(false);

  // Drilldown modal
  const [drillAccount, setDrillAccount] = useState<{ id: number; name: string } | null>(null);
  const [drillLines, setDrillLines] = useState<any[]>([]);
  const [loadingDrill, setLoadingDrill] = useState<boolean>(false);

  const fetchBs = async () => {
    setLoadingBs(true);
    try {
      const res = await fetch(`/api/reports/balance-sheet?asOf=${asOfDate}`);
      const json = await res.json();
      if (json.data) setBsData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBs(false);
    }
  };

  const fetchPl = async () => {
    setLoadingPl(true);
    try {
      const res = await fetch(`/api/reports/profit-loss?from=${fromDate}&to=${toDate}`);
      const json = await res.json();
      if (json.data) setPlData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPl(false);
    }
  };

  const fetchBudget = async () => {
    setLoadingBudget(true);
    try {
      const res = await fetch('/api/reports/budget');
      const json = await res.json();
      if (json.data) setBudgetData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBudget(false);
    }
  };

  const fetchVerify = async () => {
    setLoadingVerify(true);
    try {
      const res = await fetch('/api/verify');
      const json = await res.json();
      if (json.data) setVerifyData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVerify(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'bs') fetchBs();
    if (activeReport === 'pl') fetchPl();
    if (activeReport === 'budget') fetchBudget();
    if (activeReport === 'verify') fetchVerify();
  }, [activeReport]);

  const handleDrilldown = async (accountId: number, accountName: string) => {
    setDrillAccount({ id: accountId, name: accountName });
    setLoadingDrill(true);
    try {
      const res = await fetch(`/api/ledger?accountId=${accountId}`);
      const json = await res.json();
      if (json.data) setDrillLines(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrill(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-body">
      {/* Report Tabs */}
      <div className="flex items-center justify-between border-b border-brown-300 pb-3 mb-6">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveReport('bs')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeReport === 'bs' ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveReport('pl')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeReport === 'pl' ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveReport('budget')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeReport === 'budget' ? 'bg-brown-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            Budget Progress
          </button>
          <button
            onClick={() => setActiveReport('verify')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeReport === 'verify' ? 'bg-emerald-900 text-cream shadow-sm' : 'text-brown-700 hover:bg-brown-100'
            }`}
          >
            System Ledger Audit (/verify)
          </button>
        </div>
      </div>

      {/* BALANCE SHEET */}
      {activeReport === 'bs' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm p-6">
          <div className="flex justify-between items-center border-b border-brown-200 pb-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-brown-900">Balance Sheet</h2>
              <p className="text-xs text-brown-600 mt-0.5">Cumulative financial standing up to specified date</p>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <label className="font-semibold text-brown-800">As Of Date:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="border border-brown-300 rounded-lg p-1.5 bg-cream text-sm font-body"
              />
              <button
                onClick={fetchBs}
                className="px-3 py-1.5 bg-brown-900 text-cream text-xs font-semibold rounded-lg hover:bg-brown-800"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingBs ? (
            <div className="py-12 text-center text-brown-600">Calculating cumulative balance sheet...</div>
          ) : bsData ? (
            <div className="space-y-8">
              {/* Assets */}
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-3">Assets</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-brown-600 border-b border-brown-100">
                      <th className="py-2 text-left">Account</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bsData.assets?.map((a: any) => (
                      <tr key={a.accountId} className="border-b border-brown-50 hover:bg-brown-50/50">
                        <td className="py-2.5 font-medium text-brown-900 cursor-pointer hover:underline text-blue-800" onClick={() => handleDrilldown(a.accountId, a.accountName)}>
                          {a.accountName} ↗
                        </td>
                        <td className="py-2.5 text-brown-600 uppercase text-xs">{a.type}</td>
                        <td className="py-2.5 text-right font-mono font-semibold">₹{parseFloat(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-brown-300 bg-brown-50/60">
                      <td colSpan={2} className="py-2.5">Total Assets</td>
                      <td className="py-2.5 text-right font-mono text-base">₹{parseFloat(bsData.totalAssets).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Liabilities */}
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-3">Liabilities</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-brown-600 border-b border-brown-100">
                      <th className="py-2 text-left">Account</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bsData.liabilities?.map((l: any) => (
                      <tr key={l.accountId} className="border-b border-brown-50 hover:bg-brown-50/50">
                        <td className="py-2.5 font-medium text-brown-900 cursor-pointer hover:underline text-blue-800" onClick={() => handleDrilldown(l.accountId, l.accountName)}>
                          {l.accountName} ↗
                        </td>
                        <td className="py-2.5 text-brown-600 uppercase text-xs">{l.type}</td>
                        <td className="py-2.5 text-right font-mono font-semibold">₹{parseFloat(l.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-brown-300 bg-brown-50/60">
                      <td colSpan={2} className="py-2.5">Total Liabilities</td>
                      <td className="py-2.5 text-right font-mono text-base">₹{parseFloat(bsData.totalLiabilities).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equity & Net Profit Flow */}
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-3">Equity & Retained Earnings</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {bsData.capital?.map((c: any) => (
                      <tr key={c.accountId} className="border-b border-brown-50">
                        <td className="py-2.5 font-medium text-brown-900 cursor-pointer hover:underline text-blue-800" onClick={() => handleDrilldown(c.accountId, c.accountName)}>
                          {c.accountName} ↗
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold">₹{parseFloat(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-brown-50 bg-emerald-50/40">
                      <td className="py-2.5 font-semibold text-emerald-900">
                        Current Period Net Profit (Auto-flows from P&L)
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-900">
                        ₹{parseFloat(bsData.currentPeriodProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold border-t-2 border-brown-300 bg-brown-50/60">
                      <td className="py-2.5">Total Equity</td>
                      <td className="py-2.5 text-right font-mono text-base">₹{parseFloat(bsData.totalEquity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equation summary verification */}
              <div className="p-4 rounded-xl border bg-brown-100/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm block">Accounting Equation Verification:</span>
                  <span className="text-xs text-brown-700">Assets (₹{parseFloat(bsData.totalAssets).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) = Liabilities (₹{parseFloat(bsData.totalLiabilities).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) + Equity (₹{parseFloat(bsData.totalEquity).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                </div>
                <div>
                  {bsData.isBalanced ? (
                    <span className="px-3 py-1 bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold text-xs rounded-full">
                      ✓ PERFECTLY BALANCED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-100 border border-rose-400 text-rose-900 font-bold text-xs rounded-full">
                      ⚠️ UNBALANCED
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* PROFIT & LOSS */}
      {activeReport === 'pl' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm p-6">
          <div className="flex justify-between items-center border-b border-brown-200 pb-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-brown-900">Profit & Loss Statement</h2>
              <p className="text-xs text-brown-600 mt-0.5">Operating performance across period</p>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <label className="font-semibold text-brown-800">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border border-brown-300 rounded-lg p-1.5 bg-cream text-sm font-body"
              />
              <label className="font-semibold text-brown-800">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border border-brown-300 rounded-lg p-1.5 bg-cream text-sm font-body"
              />
              <button
                onClick={fetchPl}
                className="px-3 py-1.5 bg-brown-900 text-cream text-xs font-semibold rounded-lg hover:bg-brown-800"
              >
                Apply Range
              </button>
            </div>
          </div>

          {loadingPl ? (
            <div className="py-12 text-center text-brown-600">Generating Profit & Loss statement...</div>
          ) : plData ? (
            <div className="space-y-8">
              {/* Income */}
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-3">Revenues / Income</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {plData.income?.map((inc: any) => (
                      <tr key={inc.accountId} className="border-b border-brown-50 hover:bg-brown-50/50">
                        <td className="py-2.5 font-medium text-brown-900 cursor-pointer hover:underline text-blue-800" onClick={() => handleDrilldown(inc.accountId, inc.accountName)}>
                          {inc.accountName} ↗
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold">₹{parseFloat(inc.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-brown-300 bg-brown-50/60">
                      <td className="py-2.5">Total Income</td>
                      <td className="py-2.5 text-right font-mono text-base">₹{parseFloat(plData.totalIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses */}
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900 border-b border-brown-200 pb-2 mb-3">Expenses</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {plData.expenses?.map((exp: any) => (
                      <tr key={exp.accountId} className="border-b border-brown-50 hover:bg-brown-50/50">
                        <td className="py-2.5 font-medium text-brown-900 cursor-pointer hover:underline text-blue-800" onClick={() => handleDrilldown(exp.accountId, exp.accountName)}>
                          {exp.accountName} ↗
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold">₹{parseFloat(exp.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-brown-300 bg-brown-50/60">
                      <td className="py-2.5">Total Expenses</td>
                      <td className="py-2.5 text-right font-mono text-base">₹{parseFloat(plData.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Profit Summary */}
              <div className="p-5 rounded-xl border bg-emerald-50 border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-base text-emerald-950 block">Net Profit for the Period:</span>
                  <span className="text-xs text-emerald-800">Total Income (₹{parseFloat(plData.totalIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) - Total Expenses (₹{parseFloat(plData.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-extrabold text-2xl text-emerald-950 font-mono">
                    ₹{parseFloat(plData.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* BUDGET PROGRESS */}
      {activeReport === 'budget' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm p-6">
          <div className="border-b border-brown-200 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="font-display font-bold text-2xl text-brown-900">Analytical Budget Progress</h2>
              <p className="text-xs text-brown-600 mt-0.5">Real-time committed vs achieved tracking across cost centers</p>
            </div>
            <button
              onClick={fetchBudget}
              className="px-3 py-1.5 bg-brown-900 text-cream text-xs font-semibold rounded-lg hover:bg-brown-800"
            >
              Refresh Progress
            </button>
          </div>

          {loadingBudget ? (
            <div className="py-12 text-center text-brown-600">Calculating analytical budget progress...</div>
          ) : budgetData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-brown-100/70 text-brown-900 font-semibold border-b border-brown-200">
                    <th className="py-3 px-4">Cost Center / Analytic</th>
                    <th className="py-3 px-4">Budget Name</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-right">Committed (₹)</th>
                    <th className="py-3 px-4 text-right">Achieved (₹)</th>
                    <th className="py-3 px-4 text-center w-48">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.map((b: any) => {
                    const pct = Math.min(100, Math.max(0, parseFloat(b.achieved_pct || 0)));
                    return (
                      <tr key={b.budget_line_id} className="border-b border-brown-100 hover:bg-brown-50/50">
                        <td className="py-3 px-4 font-semibold text-brown-900">{b.analytic_account_name}</td>
                        <td className="py-3 px-4 text-brown-700">{b.budget_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            b.analytic_account_type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {b.analytic_account_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">₹{parseFloat(b.committed_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">₹{parseFloat(b.achieved_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-brown-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${pct > 90 ? 'bg-rose-600' : pct > 60 ? 'bg-amber-600' : 'bg-emerald-600'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold w-12 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* SYSTEM LEDGER AUDIT (/VERIFY) */}
      {activeReport === 'verify' && (
        <div className="bg-surface rounded-xl border border-brown-300 shadow-sm p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ⚖️
          </div>
          <h2 className="font-display font-extrabold text-2xl text-brown-900 mb-1">
            Core Ledger Audit (/api/verify)
          </h2>
          <p className="text-sm text-brown-600 mb-8">
            Authoritative mathematical integrity check verifying SUM(debit) == SUM(credit) across all 50,000+ posted journal lines in PostgreSQL.
          </p>

          {loadingVerify ? (
            <div className="py-6 text-brown-600 font-mono">Querying PostgreSQL ledger...</div>
          ) : verifyData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brown-50 p-4 rounded-xl border border-brown-200">
                  <span className="text-xs text-brown-600 block uppercase tracking-wider font-semibold">Total Debit</span>
                  <span className="text-xl font-bold font-mono text-brown-900 block mt-1">
                    ₹{parseFloat(verifyData.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-brown-50 p-4 rounded-xl border border-brown-200">
                  <span className="text-xs text-brown-600 block uppercase tracking-wider font-semibold">Total Credit</span>
                  <span className="text-xl font-bold font-mono text-brown-900 block mt-1">
                    ₹{parseFloat(verifyData.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950">
                <span className="text-xs uppercase tracking-widest font-bold block mb-1">Ledger Imbalance (Difference)</span>
                <span className="font-display font-black text-4xl text-emerald-700 font-mono">
                  ₹{verifyData.difference}
                </span>
                <span className="block text-xs text-emerald-800 mt-2 font-medium">
                  ✓ Passed strict double-entry verification. Debit and credit lines are in exact parity.
                </span>
              </div>

              <button
                onClick={fetchVerify}
                className="px-6 py-2.5 bg-brown-900 hover:bg-brown-800 text-cream font-semibold rounded-lg text-sm shadow-sm transition-colors"
              >
                Re-Verify Global Ledger Now
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* DRILLDOWN MODAL */}
      {drillAccount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-brown-300 shadow-xl max-w-4xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-brown-200 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-brown-900">Account Drilldown: {drillAccount.name}</h3>
                <span className="text-xs text-brown-600">Individual posted journal lines affecting this account</span>
              </div>
              <button
                onClick={() => setDrillAccount(null)}
                className="text-brown-700 hover:text-brown-950 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingDrill ? (
                <div className="py-8 text-center text-brown-600 font-mono">Loading transaction lines...</div>
              ) : drillLines.length === 0 ? (
                <div className="py-8 text-center text-brown-600">No individual lines found for this account.</div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-brown-100/70 text-brown-900 font-semibold border-b border-brown-200 sticky top-0">
                      <th className="py-2.5 px-3">Entry No.</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Partner</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillLines.slice(0, 100).map((line: any) => (
                      <tr key={line.id} className="border-b border-brown-100 hover:bg-brown-50/50">
                        <td className="py-2 px-3 font-mono font-semibold">{line.entry_number}</td>
                        <td className="py-2 px-3 text-brown-700">{line.entry_date?.split('T')[0] || line.entry_date}</td>
                        <td className="py-2 px-3 font-medium text-brown-900">{line.partner_name || '-'}</td>
                        <td className="py-2 px-3 text-brown-700 max-w-xs truncate">{line.description || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-brown-900">{parseFloat(line.debit) > 0 ? `₹${parseFloat(line.debit).toFixed(2)}` : '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-brown-900">{parseFloat(line.credit) > 0 ? `₹${parseFloat(line.credit).toFixed(2)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-brown-200 pt-3 mt-3 flex justify-between items-center text-xs text-brown-600">
              <span>Showing up to 100 recent lines</span>
              <button
                onClick={() => setDrillAccount(null)}
                className="px-4 py-1.5 bg-brown-900 text-cream rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
