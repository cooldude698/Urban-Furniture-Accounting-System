import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ReportsApi, BudgetReportData } from '../../api/reports.api';
import { BudgetApi, Budget } from '../../api/budget.api';
import Money from '../../components/ui/Money';
import {
  Printer,
  FileBarChart,
  RefreshCw,
  X,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const PALETTE = {
  achieved: '#5F7052', // --posted
  remaining: '#C08A3E', // --warning
  overrun: '#9E4A38', // --danger
  neutral: '#EBD7BE',
};

export default function BudgetReportPage() {
  const [selectedBudgetId, setSelectedBudgetId] = useState<number>(1);
  const [drillDownLineId, setDrillDownLineId] = useState<number | null>(null);
  const [drillDownData, setDrillDownData] = useState<{ line: any; documents: any[] } | null>(null);
  const [isDrillDownLoading, setIsDrillDownLoading] = useState<boolean>(false);

  // Load all available budgets
  const { data: budgets = [], refetch: refetchBudgets } = useQuery<Budget[]>({
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
  const {
    data: report,
    isLoading,
    refetch: refetchReport,
  } = useQuery<BudgetReportData>({
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

  const committedNum = parseFloat(report?.totals?.committed || '0');
  const achievedNum = parseFloat(report?.totals?.achieved || '0');
  const toAchieveNum = parseFloat(report?.totals?.toAchieve || '0');
  const achievedPct = report?.totals?.achievedPct || 0;

  // Recharts pie data without awkward label lines
  const pieData = [
    {
      name: 'Achieved to Date',
      value: Math.max(0, achievedNum),
      color: PALETTE.achieved,
    },
    {
      name: 'Remaining to Achieve',
      value: Math.max(0, toAchieveNum),
      color: PALETTE.remaining,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* ── Top Control Bar (Clean Accounting Toolbar) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '4px 0',
        }}
      >
        {/* Budget Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
            }}
          >
            <FileBarChart size={14} style={{ color: 'var(--brown-700)' }} />
            <label htmlFor="budgetSelector" style={{ fontWeight: 600, color: 'var(--brown-700)' }}>
              Analytical Budget:
            </label>
            <select
              id="budgetSelector"
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(parseInt(e.target.value, 10))}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--brown-900)',
                outline: 'none',
                cursor: 'pointer',
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              refetchBudgets();
              refetchReport();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--brown-700)',
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
            title="Refresh budget performance"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cream)',
              background: 'var(--brown-900)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ── Financial Statement Document Sheet (Standard Accounting Presentation) ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px rgba(74, 58, 52, 0.06)',
          border: '1px solid rgba(208, 174, 146, 0.45)',
          padding: '36px 44px',
        }}
      >
        {/* Document Formal Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid var(--brown-900)',
            paddingBottom: 20,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--brown-500)',
              textTransform: 'uppercase',
            }}
          >
            Urban Furniture Private Limited
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--brown-900)',
              margin: '6px 0 4px 0',
            }}
          >
            {report?.budgetName || 'Analytical Budget Performance Report'}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--brown-700)',
              margin: 0,
            }}
          >
            {report?.periodStart && report?.periodEnd
              ? `Period: ${String(report.periodStart).split('T')[0]} to ${String(report.periodEnd).split('T')[0]}`
              : 'Cumulative Analytical Commitment & Achievement Tracking'}
          </p>
          <span
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--brown-500)',
              marginTop: 4,
              display: 'inline-block',
            }}
          >
            (Amounts in Indian Rupees ₹ · Click any achieved amount to inspect source invoices and bills)
          </span>
        </div>

        {/* ── Summary KPI Cards Strip ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: 'rgba(235, 215, 190, 0.15)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Committed Budget
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--brown-900)', marginTop: 4 }}>
              <Money value={report?.totals?.committed || '0.00'} />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(95, 112, 82, 0.08)',
              border: '1px solid rgba(95, 112, 82, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Achieved to Date
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--posted)', marginTop: 4 }}>
              <Money value={report?.totals?.achieved || '0.00'} />
            </div>
          </div>

          <div
            style={{
              background: toAchieveNum >= 0 ? 'rgba(192, 138, 62, 0.08)' : 'rgba(95, 112, 82, 0.08)',
              border: `1px solid ${toAchieveNum >= 0 ? 'rgba(192, 138, 62, 0.3)' : 'rgba(95, 112, 82, 0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: toAchieveNum >= 0 ? 'var(--warning)' : 'var(--posted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {toAchieveNum >= 0 ? 'Remaining to Achieve' : 'Target Surpassed By'}
            </span>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 700,
                color: toAchieveNum >= 0 ? 'var(--warning)' : 'var(--posted)',
                marginTop: 4,
              }}
            >
              <Money value={Math.abs(toAchieveNum).toFixed(2)} />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(235, 215, 190, 0.15)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Progress Rate
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--brown-900)', marginTop: 4 }}>
              {achievedPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* ── Visualizer & Analytic Account Meters ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 32,
            alignItems: 'center',
            background: 'rgba(249, 242, 228, 0.35)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px 24px',
            marginBottom: 28,
          }}
        >
          {/* Donut Chart with Centered Metric */}
          <div style={{ position: 'relative', width: 220, height: 180, margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Label */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase', fontWeight: 600 }}>
                Achieved
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--brown-900)' }}>
                {achievedPct.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Per-Analytic Account Progress Meters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brown-900)', margin: 0 }}>
              Analytic Account Performance Breakdown
            </h3>
            {report?.lines && report.lines.length > 0 ? (
              report.lines.map((line) => {
                const pct = Math.min(100, Math.max(0, line.achievedPct || 0));
                return (
                  <div key={line.budgetLineId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--brown-900)' }}>
                        {line.analyticAccountName}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brown-700)', fontWeight: 600 }}>
                        <Money value={line.achievedAmount} /> / <Money value={line.committedAmount} /> ({(line.achievedPct || 0).toFixed(1)}%)
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div style={{ width: '100%', height: 6, background: 'rgba(208, 174, 146, 0.3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: (line.achievedPct || 0) >= 100 ? 'var(--posted)' : 'var(--brown-700)',
                          borderRadius: 3,
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                No analytic accounts defined for this budget.
              </div>
            )}
          </div>
        </div>

        {/* ── Analytic Budget Breakdown Table ── */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid var(--brown-900)',
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Detailed Analytic Lines
            </h2>
            <span style={{ fontSize: 11, color: 'var(--brown-500)' }}>
              Click achieved amount to view source invoices/bills
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(235, 215, 190, 0.2)', height: 36, borderBottom: '1px solid var(--brown-300)' }}>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Analytic Account</th>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', width: 90 }}>Type</th>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Committed</th>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Achieved to Date</th>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Progress %</th>
                <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Remaining Amount</th>
              </tr>
            </thead>
            <tbody>
              {report?.lines && report.lines.length > 0 ? (
                report.lines.map((line) => (
                  <tr key={line.budgetLineId} style={{ height: 42, borderBottom: '1px solid rgba(208, 174, 146, 0.2)', fontSize: 13 }}>
                    <td style={{ padding: '0 12px', fontWeight: 600, color: 'var(--brown-900)' }}>
                      {line.analyticAccountName}
                    </td>
                    <td style={{ padding: '0 12px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          background: 'rgba(235, 215, 190, 0.4)',
                          color: 'var(--brown-700)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {line.analyticType}
                      </span>
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <Money value={line.committedAmount} />
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right' }}>
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
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          transition: 'background 120ms ease',
                        }}
                        title="Click to drill down into source documents"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(95, 112, 82, 0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Money value={line.achievedAmount} />
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {(line.achievedPct || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <Money value={line.amountToAchieve} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--brown-500)', fontSize: 13 }}>
                    {isLoading ? 'Loading budget progress...' : 'No budget line records found.'}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr
                style={{
                  background: 'rgba(235, 215, 190, 0.25)',
                  height: 44,
                  fontWeight: 700,
                  borderTop: '1px solid var(--brown-900)',
                  borderBottom: '4px double var(--brown-900)',
                }}
              >
                <td colSpan={2} style={{ padding: '0 12px', fontSize: 12, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                  Total Budget Summary
                </td>
                <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <Money value={report?.totals?.committed || '0.00'} />
                </td>
                <td style={{ padding: '0 12px', textAlign: 'right', color: 'var(--posted)', fontFamily: 'var(--font-mono)' }}>
                  <Money value={report?.totals?.achieved || '0.00'} />
                </td>
                <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {(report?.totals?.achievedPct || 0).toFixed(1)}%
                </td>
                <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <Money value={report?.totals?.toAchieve || '0.00'} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Drill-Down Document Inspection Modal ── */}
      {drillDownLineId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(74, 58, 52, 0.45)',
            backdropFilter: 'blur(3px)',
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
              borderRadius: 'var(--radius-md)',
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
