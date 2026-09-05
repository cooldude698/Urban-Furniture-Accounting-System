import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import {
  BudgetApi,
  Budget,
  BudgetLine,
  BudgetDocumentItem,
} from '../../api/budget.api';
import { AnalyticsApi } from '../../api/analytics.api';
import FormView, { btnSecondary, btnDestructive } from '../../components/ui/FormView';
import Money from '../../components/ui/Money';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  GitBranch,
  ExternalLink,
  Plus,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function BudgetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';
  const budgetId = isNew ? 0 : parseInt(id, 10);

  // Form State
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');
  const [responsibleName, setResponsibleName] = useState('Administrator');
  const [lines, setLines] = useState<BudgetLine[]>([]);

  // Achieved drill-down modal state
  const [activeDocLine, setActiveDocLine] = useState<BudgetLine | null>(null);
  const [docList, setDocList] = useState<BudgetDocumentItem[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);

  // Fetch Budget Details
  const { data: budget, isLoading } = useQuery<Budget | null>({
    queryKey: ['budget', budgetId],
    queryFn: () => BudgetApi.getById(budgetId),
    enabled: !isNew && !isNaN(budgetId),
  });

  // Fetch Analytic Accounts for dropdown
  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => AnalyticsApi.getAll(false),
  });

  // Sync loaded budget to local form state
  useEffect(() => {
    if (budget && !isNew) {
      setName(budget.name);
      setPeriodStart(budget.period_start);
      setPeriodEnd(budget.period_end);
      setResponsibleName(budget.responsible_name || 'Administrator');
      setLines(budget.lines || []);
    } else if (isNew) {
      setName('');
      setPeriodStart('2026-01-01');
      setPeriodEnd('2026-12-31');
      setResponsibleName('Administrator');
      setLines([
        {
          analytic_account_id: 1,
          analytic_account_name: 'Showroom Operations',
          analytic_type: 'expense',
          committed_amount: '100000.00',
          achieved_amount: '0.00',
          achieved_pct: 0,
          amount_to_achieve: '100000.00',
        },
      ]);
    }
  }, [budget, isNew]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: BudgetApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      navigate(`/account/budgets/${created.id}`);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => BudgetApi.confirm(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => BudgetApi.cancel(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
    },
  });

  const reviseMutation = useMutation({
    mutationFn: () => BudgetApi.revise(budgetId),
    onSuccess: ({ revised }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budget', revised.id] });
      // Navigate to the revised copy
      navigate(`/account/budgets/${revised.id}`);
    },
  });

  // Line calculations using Decimal.js
  const handleCommittedChange = (index: number, val: string) => {
    const updated = [...lines];
    const item = updated[index];
    item.committed_amount = val;

    try {
      const comm = new Decimal(val || '0');
      const ach = new Decimal(item.achieved_amount || '0');
      item.achieved_pct = comm.isZero() ? 0 : Math.round(ach.dividedBy(comm).toNumber() * 10000) / 100;
      item.amount_to_achieve = comm.minus(ach).toFixed(2);
    } catch {
      // ignore parse err
    }
    setLines(updated);
  };

  const handleAnalyticChange = (index: number, analyticId: number) => {
    const updated = [...lines];
    const selected = analytics.find((a: any) => a.id === analyticId);
    updated[index].analytic_account_id = analyticId;
    if (selected) {
      updated[index].analytic_account_name = selected.name;
      updated[index].analytic_type = selected.type as 'income' | 'expense';
    }
    setLines(updated);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        analytic_account_id: analytics[0]?.id || 1,
        analytic_account_name: analytics[0]?.name || 'Showroom Operations',
        analytic_type: (analytics[0]?.type as any) || 'expense',
        committed_amount: '50000.00',
        achieved_amount: '0.00',
        achieved_pct: 0,
        amount_to_achieve: '50000.00',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Open drill-down modal for Achieved documents
  const handleOpenDocuments = async (line: BudgetLine) => {
    setActiveDocLine(line);
    setIsDocsLoading(true);
    try {
      const docs = await BudgetApi.getAchievedDocuments(line.analytic_account_id);
      setDocList(docs);
    } catch {
      setDocList([]);
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please provide a budget name.');
      return;
    }
    createMutation.mutate({
      name,
      period_start: periodStart,
      period_end: periodEnd,
      responsible_name: responsibleName,
      lines: lines.map((l) => ({
        analytic_account_id: l.analytic_account_id,
        analytic_account_name: l.analytic_account_name,
        analytic_type: l.analytic_type,
        committed_amount: l.committed_amount,
      })),
    });
  };

  const isConfirmed = budget?.status === 'confirmed';
  const isDraft = isNew || budget?.status === 'draft';
  const isRevised = budget?.status === 'revised';
  const isCancelled = budget?.status === 'cancelled';

  // Calculate overall totals
  const totalCommitted = lines
    .reduce((acc, l) => acc.plus(new Decimal(l.committed_amount || '0')), new Decimal(0))
    .toFixed(2);
  const totalAchieved = lines
    .reduce((acc, l) => acc.plus(new Decimal(l.achieved_amount || '0')), new Decimal(0))
    .toFixed(2);
  const totalAmountToAchieve = lines
    .reduce((acc, l) => acc.plus(new Decimal(l.amount_to_achieve || '0')), new Decimal(0))
    .toFixed(2);

  return (
    <div>
      <FormView
        title={isNew ? 'New Analytical Budget' : budget?.name || 'Budget'}
        onNew={() => navigate('/account/budgets/new')}
        onConfirm={isDraft ? (isNew ? handleSave : () => confirmMutation.mutate()) : undefined}
        onBack={() => navigate('/account/budgets')}
        onHome={() => navigate('/dashboard')}
        extraButtons={
          <>
            {/* Revise Button: Visible ONLY when status is confirmed */}
            {isConfirmed && (
              <button
                type="button"
                style={{
                  ...btnSecondary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderColor: 'var(--brown-700)',
                  fontWeight: 600,
                }}
                onClick={() => reviseMutation.mutate()}
                disabled={reviseMutation.isPending}
              >
                <GitBranch size={14} />
                <span>{reviseMutation.isPending ? 'Revising...' : 'Revise'}</span>
              </button>
            )}

            {/* Cancel Button */}
            {(isDraft || isConfirmed) && !isNew && (
              <button
                type="button"
                style={btnDestructive}
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this budget?')) {
                    cancelMutation.mutate();
                  }
                }}
              >
                Cancel
              </button>
            )}
          </>
        }
        smartButtons={
          !isNew && budget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={budget.status} />
            </div>
          ) : undefined
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* ── Two-Way Revision Lineage Banners ── */}
          {budget?.revised_of_id && (
            <div
              style={{
                background: 'var(--posted-bg)',
                border: '1px solid var(--posted)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={18} style={{ color: 'var(--posted)' }} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  This budget is a <strong>revision</strong> of an approved parent budget.
                </span>
              </div>
              <Link
                to={`/account/budgets/${budget.revised_of_id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--posted)',
                  textDecoration: 'none',
                }}
              >
                <span>View Original: {budget.revised_of_name || `Budget #${budget.revised_of_id}`}</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {budget?.revised_by_id && (
            <div
              style={{
                background: 'var(--warning-bg)',
                border: '1px dashed var(--warning)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--brown-900)' }}>
                  This budget has been superseded and <strong>revised</strong> by a new record.
                </span>
              </div>
              <Link
                to={`/account/budgets/${budget.revised_by_id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--brown-900)',
                  textDecoration: 'none',
                }}
              >
                <span>View Revision: {budget.revised_by_name || `Budget #${budget.revised_by_id}`}</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {/* ── Form Fields (Header) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
              background: 'var(--cream)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(208, 174, 146, 0.3)',
            }}
          >
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Budget Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isDraft}
                placeholder="e.g. FY2026 Showroom Budget"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brown-300)',
                  background: isDraft ? 'var(--surface)' : 'rgba(235, 215, 190, 0.4)',
                  color: 'var(--brown-900)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Responsible User */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Responsible
              </label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                disabled={!isDraft}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brown-300)',
                  background: isDraft ? 'var(--surface)' : 'rgba(235, 215, 190, 0.4)',
                  color: 'var(--brown-900)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Period Start */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Period Start *
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                disabled={!isDraft}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brown-300)',
                  background: isDraft ? 'var(--surface)' : 'rgba(235, 215, 190, 0.4)',
                  color: 'var(--brown-900)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Period End */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                Period End *
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                disabled={!isDraft}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brown-300)',
                  background: isDraft ? 'var(--surface)' : 'rgba(235, 215, 190, 0.4)',
                  color: 'var(--brown-900)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* ── Budget Line Grid ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--brown-900)', margin: 0 }}>
                Budget Lines & Progress
              </h3>
              {isDraft && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    color: 'var(--brown-900)',
                    background: 'var(--surface)',
                    border: '1px solid var(--brown-300)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>Add Line</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--brown-100)', height: 38, borderBottom: '1px solid var(--brown-300)' }}>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
                      Analytic
                    </th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', width: 90 }}>
                      Type
                    </th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', textAlign: 'right', width: 140 }}>
                      Committed
                    </th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', textAlign: 'right', width: 140 }}>
                      Achieved
                    </th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', textAlign: 'right', width: 110 }}>
                      Achieved %
                    </th>
                    <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', textAlign: 'right', width: 150 }}>
                      Amount to Achieve
                    </th>
                    {isDraft && <th style={{ width: 44 }} />}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr
                      key={idx}
                      style={{
                        height: 44,
                        borderBottom: '1px solid rgba(208, 174, 146, 0.25)',
                        background: idx % 2 === 1 ? 'rgba(249, 242, 228, 0.3)' : 'var(--surface)',
                      }}
                    >
                      {/* Analytic */}
                      <td style={{ padding: '0 12px' }}>
                        {isDraft ? (
                          <select
                            value={line.analytic_account_id}
                            onChange={(e) => handleAnalyticChange(idx, parseInt(e.target.value, 10))}
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 13,
                              padding: '5px 8px',
                              border: '1px solid var(--brown-300)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--surface)',
                              color: 'var(--brown-900)',
                              width: '100%',
                            }}
                          >
                            {analytics.length > 0 ? (
                              analytics.map((a: any) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.type})
                                </option>
                              ))
                            ) : (
                              <>
                                <option value={1}>Showroom Operations (expense)</option>
                                <option value={2}>Online Sales Marketing (income)</option>
                                <option value={3}>Warehouse & Logistics (expense)</option>
                                <option value={4}>Custom Interior Projects (income)</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>
                            {line.analytic_account_name || `Analytic #${line.analytic_account_id}`}
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-700)', textTransform: 'capitalize' }}>
                        {line.analytic_type}
                      </td>

                      {/* Committed Amount */}
                      <td style={{ padding: '0 12px', textAlign: 'right' }}>
                        {isDraft ? (
                          <input
                            type="text"
                            value={line.committed_amount}
                            onChange={(e) => handleCommittedChange(idx, e.target.value)}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 13,
                              textAlign: 'right',
                              padding: '4px 8px',
                              border: '1px solid var(--brown-300)',
                              borderRadius: 'var(--radius-sm)',
                              width: '100%',
                              background: 'var(--surface)',
                              color: 'var(--brown-900)',
                            }}
                          />
                        ) : (
                          <Money value={line.committed_amount} />
                        )}
                      </td>

                      {/* Achieved Amount: BUTTON that opens documents list */}
                      <td style={{ padding: '0 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDocuments(line)}
                          title="Click to view related invoices and bills in period"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(95, 112, 82, 0.1)',
                            border: '1px solid var(--posted)',
                            color: 'var(--posted)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            transition: 'background 150ms ease-out',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--posted-bg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(95, 112, 82, 0.1)';
                          }}
                        >
                          <Money value={line.achieved_amount} />
                          <ExternalLink size={11} />
                        </button>
                      </td>

                      {/* Achieved % */}
                      <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brown-900)' }}>
                        {line.achieved_pct.toFixed(2)}%
                      </td>

                      {/* Amount to Achieve */}
                      <td style={{ padding: '0 12px', textAlign: 'right' }}>
                        <Money value={line.amount_to_achieve} />
                      </td>

                      {/* Remove Row */}
                      {isDraft && (
                        <td style={{ padding: '0 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>

                {/* Totals Footer */}
                <tfoot>
                  <tr style={{ background: 'var(--brown-100)', height: 42, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                    <td colSpan={2} style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
                      Total
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right' }}>
                      <Money value={totalCommitted} />
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right' }}>
                      <Money value={totalAchieved} />
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {new Decimal(totalCommitted).isZero()
                        ? '0.00%'
                        : `${new Decimal(totalAchieved).dividedBy(new Decimal(totalCommitted)).times(100).toFixed(2)}%`}
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right' }}>
                      <Money value={totalAmountToAchieve} />
                    </td>
                    {isDraft && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </FormView>

      {/* ── Achieved Documents Modal ── */}
      {activeDocLine && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(74, 58, 52, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setActiveDocLine(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: 760,
              width: '100%',
              overflow: 'hidden',
              border: '1px solid rgba(208, 174, 146, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(208, 174, 146, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--cream)',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Achieved Invoices & Vendor Bills
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--brown-700)', marginTop: 2 }}>
                  Analytic Account:{' '}
                  <strong>{activeDocLine.analytic_account_name || `Analytic #${activeDocLine.analytic_account_id}`}</strong>{' '}
                  ({periodStart} to {periodEnd})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocLine(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--brown-700)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, maxHeight: 400, overflowY: 'auto' }}>
              {isDocsLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-500)', fontSize: 13 }}>
                  Loading related documents...
                </div>
              ) : docList.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--brown-100)', height: 36, borderBottom: '1px solid var(--brown-300)' }}>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Date</th>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Type</th>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Doc #</th>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Partner</th>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docList.map((doc) => (
                      <tr key={doc.id} style={{ height: 40, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                        <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-700)' }}>{doc.date}</td>
                        <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-900)', textTransform: 'capitalize' }}>
                          {doc.type}
                        </td>
                        <td style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {doc.number}
                        </td>
                        <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-900)' }}>{doc.partner}</td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={doc.amount} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--posted-bg)',
                              color: 'var(--posted)',
                            }}
                          >
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-500)', fontSize: 13 }}>
                  No customer invoices or vendor bills recorded for this analytic account within the period.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                background: 'var(--cream)',
                borderTop: '1px solid rgba(208, 174, 146, 0.3)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveDocLine(null)}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  color: 'var(--brown-900)',
                  background: 'var(--surface)',
                  border: '1px solid var(--brown-300)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
