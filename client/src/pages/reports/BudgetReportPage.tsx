import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ReportsApi, BudgetReportData } from '../../api/reports.api';
import { BudgetApi, Budget } from '../../api/budget.api';
import Money from '../../components/ui/Money';
import {
  Printer,
  FileBarChart,
  PieChart as PieIcon,
  BarChart3,
  X,
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

const PALETTE = {
  achieved: '#5F7052', // --posted
  remaining: '#C08A3E', // --warning
  committed: '#77574A', // --brown-700
  neutral: '#EBD7BE',
};

export default function BudgetReportPage() {
  const [selectedBudgetId, setSelectedBudgetId] = useState<number>(1);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [drillDownLineId, setDrillDownLineId] = useState<number | null>(null);
  const [drillDownData, setDrillDownData] = useState<{ line: any; documents: any[] } | null>(null);
  const [isDrillDownLoading, setIsDrillDownLoading] = useState<boolean>(false);

  // Load all available budgets
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ['budgets-list'],
    queryFn: () => BudgetApi.getAll(),
  });

  // Default to first budget if none or missing
  useEffect(() => {
    if (budgets.length > 0 && !budgets.some((b) => b.id === selectedBudgetId)) {
      setSelectedBudgetId(budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  // Load report data for selected budget
  const { data: report, isLoading } = useQuery<BudgetReportData>({
    queryKey: ['budget-report', selectedBudgetId],
    queryFn: () => ReportsApi.getBudgetReport(selectedBudgetId),
    enabled: !!selectedBudgetId,
  });

  const handlePrint = () => {
    ReportsApi.downloadPdf('budget', { budgetId: String(selectedBudgetId) });
  };

  const handleDrillDown = async (lineId: number) => {
    setDrillDownLineId(lineId);
    setIsDrillDownLoading(true);
    try {
      const data = await ReportsApi.getBudgetLineDocuments(lineId);
      setDrillDownData(data);
    } catch {
      setDrillDownData(null);
    } finally {
      setIsDrillDownLoading(false);
    }
  };

  // Recharts data for pie chart: Overall Achieved vs Amount to Achieve
  const pieData = report
    ? [
        {
          name: 'Achieved',
          value: Math.max(0, parseFloat(report.totals?.achieved || '0')),
          color: PALETTE.achieved,
        },
        {
          name: 'Amount to Achieve',
          value: Math.max(0, parseFloat(report.totals?.toAchieve || '0')),
          color: PALETTE.remaining,
        },
      ]
    : [];

  // Recharts data for bar chart: per analytic account
  const barData =
    report?.lines?.map((l) => ({
      name: l.analyticAccountName,
      Committed: parseFloat(l.committedAmount || '0'),
      Achieved: parseFloat(l.achievedAmount || '0'),
      ToAchieve: Math.max(0, parseFloat(l.amountToAchieve || '0')),
    })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          paddingBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              lineHeight: '34px',
              color: 'var(--brown-900)',
              margin: 0,
            }}
          >
            Budget Performance Report
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--brown-700)',
              marginTop: 4,
              margin: 0,
            }}
          >
            Analytical budget commitments vs achieved milestones with live drill-down tracking
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--brown-900)',
            background: 'var(--surface)',
            border: '1px solid var(--brown-300)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Printer size={15} />
          <span>Print / PDF</span>
        </button>
      </div>

      {/* ── Budget Selector & Chart Switcher ── */}
      <div
        style={{
          background: 'var(--cream)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileBarChart size={18} style={{ color: 'var(--brown-700)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="budgetSelector" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
              Analytical Budget:
            </label>
            <select
              id="budgetSelector"
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(parseInt(e.target.value, 10))}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brown-300)',
                background: 'var(--surface)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {budgets.length > 0 ? (
                budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.status.toUpperCase()})
                  </option>
                ))
              ) : (
                <option value={1}>FY2026 Operations Budget</option>
              )}
            </select>
          </div>
        </div>

        {/* Chart Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--brown-300)' }}>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: chartType === 'pie' ? 'var(--brown-900)' : 'transparent',
              color: chartType === 'pie' ? 'var(--cream)' : 'var(--brown-700)',
            }}
          >
            <PieIcon size={13} />
            <span>Pie View</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: chartType === 'bar' ? 'var(--brown-900)' : 'transparent',
              color: chartType === 'bar' ? 'var(--cream)' : 'var(--brown-700)',
            }}
          >
            <BarChart3 size={13} />
            <span>Breakdown View</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Strip ── */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-md)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Committed Budget</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)', marginTop: 4 }}>
              <Money value={report.totals?.committed || '0.00'} />
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-md)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--posted)', textTransform: 'uppercase' }}>Achieved to Date</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--posted)', marginTop: 4 }}>
              <Money value={report.totals?.achieved || '0.00'} />
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-md)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase' }}>Amount to Achieve</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--warning)', marginTop: 4 }}>
              <Money value={report.totals?.toAchieve || '0.00'} />
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-md)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Achieved Progress</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)', marginTop: 4 }}>
              {(report.totals?.achievedPct || 0).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* ── Recharts Visualization Section ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--brown-900)', margin: 0 }}>
            {chartType === 'pie' ? 'Committed vs Achieved Distribution' : 'Analytic Account Commitments & Achievement'}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--brown-700)' }}>
            Live performance visualizer rendered with offline Recharts library
          </span>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)' }}
                />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(208, 174, 146, 0.3)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--brown-900)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--brown-700)', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)' }}
                />
                <Legend />
                <Bar dataKey="Committed" fill={PALETTE.committed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Achieved" fill={PALETTE.achieved} radius={[4, 4, 0, 0]} />
                <Bar dataKey="ToAchieve" fill={PALETTE.remaining} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table View ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', background: 'var(--brown-100)', borderBottom: '1px solid var(--brown-300)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--brown-900)', margin: 0 }}>
              Analytic Budget Breakdown Table
            </h3>
            <span style={{ fontSize: 11, color: 'var(--brown-700)' }}>Click on any achieved figure to inspect source posted documents</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(249, 242, 228, 0.5)', height: 38, borderBottom: '1px solid rgba(208, 174, 146, 0.3)' }}>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Analytic Account</th>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', width: 90 }}>Type</th>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Committed</th>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Achieved (Click to Drill)</th>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Achieved %</th>
              <th style={{ padding: '0 16px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Amount to Achieve</th>
            </tr>
          </thead>
          <tbody>
            {report?.lines && report.lines.length > 0 ? (
              report.lines.map((line) => (
                <tr key={line.budgetLineId} style={{ height: 44, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                  <td style={{ padding: '0 16px', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                    {line.analyticAccountName}
                  </td>
                  <td style={{ padding: '0 16px', fontSize: 12, color: 'var(--brown-700)', textTransform: 'capitalize' }}>
                    {line.analyticType}
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right' }}>
                    <Money value={line.committedAmount} />
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDrillDown(line.budgetLineId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--posted)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 6px',
                        borderRadius: 4,
                        transition: 'background 120ms ease',
                      }}
                      title="Drill down to view source documents"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(95, 112, 82, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Money value={line.achievedAmount} />
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {(line.achievedPct || 0).toFixed(2)}%
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right' }}>
                    <Money value={line.amountToAchieve} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                  {isLoading ? 'Loading budget progress...' : 'No budget line progress records found.'}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--brown-100)', height: 44, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
              <td colSpan={2} style={{ padding: '0 16px', fontSize: 12, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                Total Summary
              </td>
              <td style={{ padding: '0 16px', textAlign: 'right' }}>
                <Money value={report?.totals?.committed || '0.00'} />
              </td>
              <td style={{ padding: '0 16px', textAlign: 'right', color: 'var(--posted)' }}>
                <Money value={report?.totals?.achieved || '0.00'} />
              </td>
              <td style={{ padding: '0 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {(report?.totals?.achievedPct || 0).toFixed(2)}%
              </td>
              <td style={{ padding: '0 16px', textAlign: 'right' }}>
                <Money value={report?.totals?.toAchieve || '0.00'} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Drill-Down Document Inspection Modal ── */}
      {drillDownLineId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(74, 58, 52, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => {
            setDrillDownLineId(null);
            setDrillDownData(null);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 800,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--brown-300)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.4)', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--brown-900)', margin: 0 }}>
                  Source Documents for {drillDownData?.line?.analytic_account_name || 'Budget Line'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--brown-700)' }}>
                  {drillDownData?.line?.budget_name} ({drillDownData?.line?.analytic_type?.toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrillDownLineId(null);
                  setDrillDownData(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--brown-700)',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {isDrillDownLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                Loading source documents...
              </div>
            ) : drillDownData?.documents && drillDownData.documents.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(249, 242, 228, 0.6)', height: 36, borderBottom: '1px solid var(--brown-300)' }}>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Document</th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Partner</th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Doc Total</th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Line Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {drillDownData.documents.map((doc: any, i: number) => (
                    <tr key={i} style={{ height: 40, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                      <td style={{ padding: '0 12px', fontWeight: 600, color: 'var(--brown-900)' }}>
                        {doc.number}
                      </td>
                      <td style={{ padding: '0 12px', color: 'var(--brown-700)' }}>
                        {doc.date ? String(doc.date).split('T')[0] : '—'}
                      </td>
                      <td style={{ padding: '0 12px', color: 'var(--brown-900)' }}>
                        {doc.partner_name || '—'}
                      </td>
                      <td style={{ padding: '0 12px', textAlign: 'right' }}>
                        <Money value={doc.document_total || '0.00'} />
                      </td>
                      <td style={{ padding: '0 12px', textAlign: 'right', fontWeight: 700, color: 'var(--posted)' }}>
                        <Money value={doc.line_amount || '0.00'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                No posted documents found contributing to this budget line yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
