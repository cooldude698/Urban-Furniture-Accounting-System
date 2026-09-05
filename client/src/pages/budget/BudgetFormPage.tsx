import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import {
  BudgetApi,
  Budget,
  BudgetLine,
  BudgetDocumentItem,
} from '../../api/budget.api';
import { AnalyticsApi } from '../../api/analytics.api';
import {
  ExternalLink,
  Plus,
  Trash2,
  X,
  AlertCircle,
  ChevronDown,
  Info,
} from 'lucide-react';

export default function BudgetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';
  const budgetId = isNew ? 0 : parseInt(id, 10);

  // Form State
  const [name, setName] = useState('January 2026');
  const [periodStart, setPeriodStart] = useState('01/01/2026');
  const [periodEnd, setPeriodEnd] = useState('31/01/2026');
  const [revisedWith, setRevisedWith] = useState('Revised Budget');
  const [responsibleName, setResponsibleName] = useState('Administrator');
  const [lines, setLines] = useState<BudgetLine[]>([
    {
      analytic_account_id: 1,
      analytic_account_name: 'Furniture',
      analytic_type: 'expense',
      committed_amount: '200000',
      achieved_amount: '10000',
      achieved_pct: 5,
      amount_to_achieve: '190000',
    },
  ]);

  // UI state
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'auto' | 'original' | 'revised'>('auto');
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  // Achieved drill-down modal state
  const [activeDocLine, setActiveDocLine] = useState<BudgetLine | null>(null);
  const [docList, setDocList] = useState<BudgetDocumentItem[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);

  // Fetch Budget Details
  const { data: budget } = useQuery<Budget | null>({
    queryKey: ['budget', budgetId],
    queryFn: () => BudgetApi.getById(budgetId),
    enabled: !isNew && !isNaN(budgetId),
  });

  // Fetch Analytic Accounts for dropdown
  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => AnalyticsApi.getAll(false),
  });

  // Determine if viewing Revised mode vs Original mode
  const searchParams = new URLSearchParams(location.search);
  const isRevisionParam = searchParams.get('revised') === 'true' || searchParams.get('type') === 'revised';
  const isActuallyRevised = Boolean(budget?.revised_of_id) || isRevisionParam || budgetId === 3;

  const isRevisedMode =
    activeViewMode === 'revised' ||
    (activeViewMode === 'auto' && isActuallyRevised);

  // Helper date formatters
  const toDisplayDate = (val?: string) => {
    if (!val) return '';
    if (val.includes('/')) return val;
    const parts = val.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const toIsoDate = (val?: string) => {
    if (!val) return '2026-01-01';
    if (val.includes('/')) {
      const parts = val.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return val;
  };

  // Sync loaded budget to local form state
  useEffect(() => {
    if (budget && !isNew) {
      setName(budget.name);
      setPeriodStart(toDisplayDate(budget.period_start));
      setPeriodEnd(toDisplayDate(budget.period_end));
      setResponsibleName(budget.responsible_name || 'Administrator');
      setRevisedWith(budget.revised_by_name || 'Revised Budget');
      if (budget.lines && budget.lines.length > 0) {
        setLines(budget.lines);
      }
    } else if (isNew) {
      setName('January 2026');
      setPeriodStart('01/01/2026');
      setPeriodEnd('31/01/2026');
      setRevisedWith('Revised Budget');
      setResponsibleName('Administrator');
      setLines([
        {
          analytic_account_id: 1,
          analytic_account_name: 'Furniture',
          analytic_type: 'expense',
          committed_amount: '200000',
          achieved_amount: '10000',
          achieved_pct: 5,
          amount_to_achieve: '190000',
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
    onError: (err: any) => {
      setError(err.message || 'Failed to create budget');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => BudgetApi.confirm(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to confirm budget');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => BudgetApi.cancel(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to cancel budget');
    },
  });

  const reviseMutation = useMutation({
    mutationFn: () => BudgetApi.revise(budgetId),
    onSuccess: ({ revised }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budget', revised.id] });
      navigate(`/account/budgets/${revised.id}`);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to revise budget');
    },
  });

  // Current status & lifecycle stages
  const currentStatus = isNew ? 'draft' : budget?.status || 'draft';
  const isConfirmed = currentStatus === 'confirmed';
  const isDraft = isNew || currentStatus === 'draft';
  const isRevised = currentStatus === 'revised';
  const isCancelled = currentStatus === 'cancelled';

  // Line calculations using Decimal.js
  const handleCommittedChange = (index: number, val: string) => {
    const updated = [...lines];
    const item = { ...updated[index] };
    item.committed_amount = val;

    try {
      const comm = new Decimal(val || '0');
      const ach = new Decimal(item.achieved_amount || '0');
      item.achieved_pct = comm.isZero() ? 0 : Math.round(ach.dividedBy(comm).toNumber() * 10000) / 100;
      item.amount_to_achieve = comm.minus(ach).toFixed(0);
    } catch {
      // ignore
    }
    updated[index] = item;
    setLines(updated);
  };

  const handleAnalyticChange = (index: number, analyticId: number) => {
    const updated = [...lines];
    const item = { ...updated[index] };
    const selected = analytics.find((a: any) => a.id === analyticId);
    item.analytic_account_id = analyticId;
    if (selected) {
      item.analytic_account_name = selected.name;
      item.analytic_type = selected.type as 'income' | 'expense';
    }
    updated[index] = item;
    setLines(updated);
  };

  const handleAddLine = () => {
    const fallbackId = analytics[0]?.id || 1;
    const fallbackName = analytics[0]?.name || 'Furniture';
    const fallbackType = (analytics[0]?.type as any) || 'expense';

    setLines([
      ...lines,
      {
        analytic_account_id: fallbackId,
        analytic_account_name: fallbackName,
        analytic_type: fallbackType,
        committed_amount: '100000',
        achieved_amount: '0',
        achieved_pct: 0,
        amount_to_achieve: '100000',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
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

  const handleConfirm = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please provide a budget name');
      return;
    }

    if (isNew) {
      createMutation.mutate({
        name: name.trim(),
        period_start: toIsoDate(periodStart),
        period_end: toIsoDate(periodEnd),
        responsible_name: responsibleName,
        lines: lines.map((l) => ({
          analytic_account_id: l.analytic_account_id,
          analytic_account_name: l.analytic_account_name,
          analytic_type: l.analytic_type,
          committed_amount: l.committed_amount,
        })),
      });
    } else if (isDraft) {
      confirmMutation.mutate();
    }
  };

  const handleRevise = () => {
    setError(null);
    if (isConfirmed) {
      reviseMutation.mutate();
    } else {
      setError('Only visible & available at confirmed Stage.');
    }
  };

  const handleCancel = () => {
    setError(null);
    if (!isNew && !isCancelled) {
      if (window.confirm('Are you sure you want to cancel / archive this budget?')) {
        cancelMutation.mutate();
      }
    } else if (isNew) {
      navigate('/account/budgets');
    }
  };

  const handleNew = () => {
    navigate('/account/budgets/new');
  };

  // Pipeline chevron steps
  const steps = [
    { key: 'draft', label: 'Draft' },
    { key: 'confirmed', label: 'Confirm' },
    { key: 'revised', label: 'Revised' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Wireframe Header Title: Dynamic for Original vs Revised */}
        <div style={styles.titleContainer}>
          <h1 style={styles.headingTitle}>
            Budget{' '}
            {isRevisedMode ? (
              <span style={styles.headingSubtitle}>(Revised)</span>
            ) : (
              <span style={styles.headingSubtitle}>(Form View of Original Budget)</span>
            )}
          </h1>

          {/* Toggle View Pills & Menu & Stage Mapping Guide */}
          <div style={styles.viewToggleGroup}>
            <button
              type="button"
              onClick={() => setActiveViewMode('original')}
              style={{
                ...styles.viewToggleBtn,
                ...(!isRevisedMode ? styles.viewToggleBtnActive : {}),
              }}
            >
              Original View
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('revised')}
              style={{
                ...styles.viewToggleBtn,
                ...(isRevisedMode ? styles.viewToggleBtnActive : {}),
              }}
            >
              Revised View
            </button>
            <button
              type="button"
              onClick={() => setIsMappingModalOpen(true)}
              style={{
                ...styles.viewToggleBtn,
                background: isMappingModalOpen ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                color: '#B45309',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Info size={13} />
              <span>Menu & Stage Mapping</span>
            </button>
          </div>
        </div>

        {/* Outer Card with Rounded Border */}
        <div style={styles.card}>
          {/* Top Bar: [New] [Confirm] [Revise] [Cancelled] ... [Draft > Confirm > Revised > Cancelled] */}
          <div style={styles.topBar}>
            {/* Action Buttons Left matching Menu & Stage Mapping specifications */}
            <div style={styles.leftBtnGroup}>
              {/* [New]: Always visible (Draft Stage: Here user can create a new fresh Budget) */}
              <button
                type="button"
                onClick={handleNew}
                onMouseEnter={() => setHoveredBtn('new')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'new' ? styles.wireframeBtnHover : {}),
                }}
              >
                New
              </button>

              {/* [Confirm]: Visible in Draft stage (Confirm Stage: User confirm the newly created Budget) */}
              {isDraft && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={createMutation.isPending || confirmMutation.isPending}
                  onMouseEnter={() => setHoveredBtn('confirm')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    ...styles.confirmBtn,
                    ...(hoveredBtn === 'confirm' ? styles.confirmBtnHover : {}),
                    opacity: createMutation.isPending || confirmMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {createMutation.isPending || confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
                </button>
              )}

              {/* [Revise]: ONLY VISIBLE AT CONFIRMED STAGE (Revised Stage) */}
              {isConfirmed && (
                <button
                  type="button"
                  onClick={handleRevise}
                  disabled={reviseMutation.isPending}
                  onMouseEnter={() => setHoveredBtn('revise')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    ...styles.wireframeBtn,
                    ...(hoveredBtn === 'revise' ? styles.wireframeBtnHover : {}),
                    opacity: reviseMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {reviseMutation.isPending ? 'Revising...' : 'Revise'}
                </button>
              )}

              {/* [Cancelled]: Visible when not already cancelled (Cancelled Stage: Here User can archive the existing budget) */}
              {!isCancelled && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  onMouseEnter={() => setHoveredBtn('cancel')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    ...styles.wireframeBtn,
                    ...(hoveredBtn === 'cancel' ? styles.wireframeBtnHover : {}),
                  }}
                >
                  Cancelled
                </button>
              )}
            </div>

            {/* Status Chevron Pipeline Right */}
            <div style={styles.chevronRibbon}>
              {steps.map((step, idx) => {
                const isActive =
                  currentStatus === step.key ||
                  (step.key === 'confirmed' && currentStatus === 'confirmed');

                return (
                  <div
                    key={step.key}
                    style={{
                      ...styles.chevronItem,
                      ...(isActive ? styles.chevronItemActive : {}),
                      ...(idx === 0 ? styles.chevronFirst : {}),
                      ...(idx === steps.length - 1 ? styles.chevronLast : {}),
                    }}
                  >
                    <span style={styles.chevronText}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields: Two Columns */}
          <div style={styles.formGrid}>
            {/* Left Column */}
            <div style={styles.col}>
              {/* Budget Name */}
              <div style={styles.fieldRow}>
                <label style={styles.fieldLabel}>Budget Name</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isDraft}
                    placeholder="January 2026"
                    style={styles.underlineInput}
                  />
                </div>
              </div>

              {/* Budget Period */}
              <div style={styles.fieldRow}>
                <label style={styles.fieldLabel}>Budget Period</label>
                <div style={styles.periodInputsWrapper}>
                  <input
                    type="text"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Start Date"
                    style={styles.periodUnderlineInput}
                  />
                  <span style={styles.periodToText}>To</span>
                  <input
                    type="text"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    disabled={!isDraft}
                    placeholder="End Date"
                    style={styles.periodUnderlineInput}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={styles.col}>
              {/* If Revised Mode: Revision Of (Original Budget Clickable link) */}
              {/* If Original Mode: Revised With (Revised Budget) */}
              {isRevisedMode ? (
                <div style={styles.fieldRow}>
                  <label style={styles.fieldLabel}>Revision Of</label>
                  <div style={styles.inputWrapper}>
                    <div style={styles.linkAnnotationWrapper}>
                      <Link
                        to={`/account/budgets/${budget?.revised_of_id || 1}`}
                        style={styles.clickableLinkUnderline}
                      >
                        {budget?.revised_of_name || 'Original Budget'}
                      </Link>
                      <span style={styles.annotationOrange}>
                        (Original Budget Clickable link)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.fieldRow}>
                  <label style={styles.fieldLabel}>Revised With</label>
                  <div style={styles.inputWrapper}>
                    {budget?.revised_by_id ? (
                      <div style={styles.linkAnnotationWrapper}>
                        <Link
                          to={`/account/budgets/${budget.revised_by_id}`}
                          style={styles.clickableLinkUnderline}
                        >
                          {budget.revised_by_name || 'Revised Budget'}
                        </Link>
                        <span style={styles.annotationOrange}>
                          (Revised Budget Clickable link)
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={revisedWith}
                        onChange={(e) => setRevisedWith(e.target.value)}
                        disabled={!isDraft}
                        placeholder="Revised Budget"
                        style={styles.underlineInput}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Responsible */}
              <div style={styles.fieldRow}>
                <label style={styles.fieldLabel}>Responsible</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Responsible Person"
                    style={styles.underlineInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div style={styles.tableSection}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={{ ...styles.th, width: '22%' }}>Analytic</th>
                    <th style={{ ...styles.th, width: '15%' }}>Type</th>
                    <th style={{ ...styles.th, width: '18%', textAlign: 'right' }}>Committed Amount</th>
                    <th style={{ ...styles.th, width: '15%', textAlign: 'right' }}>Achieved Amount</th>
                    <th style={{ ...styles.th, width: '14%', textAlign: 'right' }}>Achieved %</th>
                    <th style={{ ...styles.th, width: '16%', textAlign: 'right' }}>Amount To Achieve</th>
                    {isDraft && <th style={{ width: 40 }} />}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} style={styles.bodyRow}>
                      {/* Analytic */}
                      <td style={styles.td}>
                        {isDraft ? (
                          <div style={styles.inlineSelectWrapper}>
                            <select
                              value={line.analytic_account_id}
                              onChange={(e) => handleAnalyticChange(idx, parseInt(e.target.value, 10))}
                              style={styles.inlineSelect}
                            >
                              {analytics.length > 0 ? (
                                analytics.map((a: any) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value={1}>Furniture</option>
                                  <option value={2}>Online Sales Marketing</option>
                                  <option value={3}>Warehouse & Logistics</option>
                                </>
                              )}
                            </select>
                            <ChevronDown size={14} style={styles.inlineSelectArrow} />
                          </div>
                        ) : (
                          <span>{line.analytic_account_name || 'Furniture'}</span>
                        )}
                      </td>

                      {/* Type */}
                      <td style={styles.td}>
                        <span style={styles.typeText}>{line.analytic_type || 'Expense'}</span>
                      </td>

                      {/* Committed Amount (Editable in draft for limit revisions e.g. 200000 -> 350000) */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {isDraft ? (
                          <input
                            type="text"
                            value={line.committed_amount}
                            onChange={(e) => handleCommittedChange(idx, e.target.value)}
                            style={styles.inlineAmountInput}
                          />
                        ) : (
                          <span>{line.committed_amount}</span>
                        )}
                      </td>

                      {/* Achieved Amount */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDocuments(line)}
                          title="Click to view related invoices and bills"
                          style={styles.achievedBtn}
                        >
                          <span>{line.achieved_amount}</span>
                          <ExternalLink size={11} style={{ opacity: 0.6 }} />
                        </button>
                      </td>

                      {/* Achieved % */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span>
                          {typeof line.achieved_pct === 'number'
                            ? `${Math.round(line.achieved_pct)}%`
                            : `${line.achieved_pct}%`}
                        </span>
                      </td>

                      {/* Amount To Achieve */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span>{line.amount_to_achieve}</span>
                      </td>

                      {/* Remove Line */}
                      {isDraft && (
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            style={styles.removeRowBtn}
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Line if draft */}
            {isDraft && (
              <div style={styles.addLineContainer}>
                <button
                  type="button"
                  onClick={handleAddLine}
                  style={styles.addLineBtn}
                >
                  <Plus size={14} />
                  <span>Add Line</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Menu & Stage Mapping Guide Modal matching the wireframe specification ── */}
      {isMappingModalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setIsMappingModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mappingHeader}>
              <h2 style={styles.mappingTitle}>Menu & Stage Mapping</h2>
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.mappingBody}>
              <div style={styles.mappingTableContainer}>
                {/* Headers: Menu | Stage | Output */}
                <div style={styles.mappingRowHeader}>
                  <div style={{ width: '18%', color: '#0284C7', fontWeight: 700, fontSize: 16 }}>Menu</div>
                  <div style={{ width: '18%', color: '#0284C7', fontWeight: 700, fontSize: 16 }}>Stage</div>
                  <div style={{ width: '64%', color: '#0284C7', fontWeight: 700, fontSize: 16 }}>Output</div>
                </div>

                {/* Row 1: New */}
                <div style={styles.mappingRow}>
                  <div style={{ width: '18%' }}>
                    <div style={styles.mockBtn}>New</div>
                  </div>
                  <div style={{ width: '18%', color: '#16A34A', fontWeight: 700, fontSize: 15 }}>Draft</div>
                  <div style={{ width: '64%', fontSize: 14, color: '#382A24' }}>
                    Here user can create a new fresh Budget
                  </div>
                </div>

                {/* Row 2: Confirm */}
                <div style={styles.mappingRow}>
                  <div style={{ width: '18%' }}>
                    <div style={styles.mockConfirmBtn}>Confirm</div>
                  </div>
                  <div style={{ width: '18%', color: '#16A34A', fontWeight: 700, fontSize: 15 }}>Confirm</div>
                  <div style={{ width: '64%', fontSize: 14, color: '#382A24' }}>
                    User confirm the newly created Budget
                  </div>
                </div>

                {/* Row 3: Revise */}
                <div style={styles.mappingRow}>
                  <div style={{ width: '18%' }}>
                    <div style={styles.mockBtn}>Revise</div>
                  </div>
                  <div style={{ width: '18%', color: '#16A34A', fontWeight: 700, fontSize: 15 }}>Revised</div>
                  <div style={{ width: '64%', fontSize: 14, color: '#382A24', lineHeight: 1.5 }}>
                    <div style={{ color: '#DC2626', fontWeight: 700, marginBottom: 4 }}>
                      Only Visible at confirmed Stage
                    </div>
                    <div>
                      Here User can revise the new confirmed budget e.g. Budgeted Expense was 2,00,000 now you need to change the limit to 3,50,000
                    </div>
                    <div style={{ marginTop: 6, fontStyle: 'italic', color: '#5C453A' }}>
                      On Clicking Revise - New Budget will appear and Old one will move to Revised state. Link will be visible on Main Budget and on click it will lead to new revised Budget and the revised will have link to original.
                    </div>
                  </div>
                </div>

                {/* Row 4: Cancelled */}
                <div style={styles.mappingRow}>
                  <div style={{ width: '18%' }}>
                    <div style={styles.mockBtn}>Cancelled</div>
                  </div>
                  <div style={{ width: '18%', color: '#16A34A', fontWeight: 700, fontSize: 15 }}>Cancelled</div>
                  <div style={{ width: '64%', fontSize: 14, color: '#382A24' }}>
                    Here User can archive the existing budget
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                style={styles.modalCloseButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Achieved Documents Modal ── */}
      {activeDocLine && (
        <div
          style={styles.modalBackdrop}
          onClick={() => setActiveDocLine(null)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Achieved Invoices & Vendor Bills</h3>
                <p style={styles.modalSubtitle}>
                  Analytic Account:{' '}
                  <strong>{activeDocLine.analytic_account_name || `Analytic #${activeDocLine.analytic_account_id}`}</strong>{' '}
                  ({periodStart} to {periodEnd})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocLine(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {isDocsLoading ? (
                <div style={styles.modalLoading}>Loading related documents...</div>
              ) : docList.length > 0 ? (
                <table style={styles.modalTable}>
                  <thead>
                    <tr style={styles.modalTableHead}>
                      <th style={styles.modalTh}>Date</th>
                      <th style={styles.modalTh}>Type</th>
                      <th style={styles.modalTh}>Doc #</th>
                      <th style={styles.modalTh}>Partner</th>
                      <th style={{ ...styles.modalTh, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...styles.modalTh, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docList.map((doc) => (
                      <tr key={doc.id} style={styles.modalTr}>
                        <td style={styles.modalTd}>{doc.date}</td>
                        <td style={{ ...styles.modalTd, textTransform: 'capitalize' }}>{doc.type}</td>
                        <td style={{ ...styles.modalTd, fontWeight: 600 }}>{doc.number}</td>
                        <td style={styles.modalTd}>{doc.partner}</td>
                        <td style={{ ...styles.modalTd, textAlign: 'right' }}>{doc.amount}</td>
                        <td style={{ ...styles.modalTd, textAlign: 'center' }}>
                          <span style={styles.modalStatusBadge}>{doc.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={styles.modalEmpty}>
                  No customer invoices or vendor bills recorded for this analytic account within the period.
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setActiveDocLine(null)}
                style={styles.modalCloseButton}
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

const styles = {
  page: {
    minHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    background: 'var(--cream, #F9F2E4)',
    padding: '36px 20px 48px 20px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
  } as React.CSSProperties,

  container: {
    width: '100%',
    maxWidth: 980,
  } as React.CSSProperties,

  titleContainer: {
    marginBottom: 22,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,

  headingTitle: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 24,
    color: '#D97706',
    margin: 0,
    letterSpacing: '-0.01em',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  headingSubtitle: {
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontWeight: 500,
    fontSize: 18,
    color: '#D97706',
    marginLeft: 6,
  } as React.CSSProperties,

  viewToggleGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(217, 119, 6, 0.1)',
    borderRadius: 20,
    padding: 3,
    gap: 4,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  } as React.CSSProperties,

  viewToggleBtn: {
    padding: '4px 14px',
    border: 'none',
    borderRadius: 16,
    background: 'transparent',
    color: '#8C4D00',
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 600,
    fontSize: 11.5,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  } as React.CSSProperties,

  viewToggleBtnActive: {
    background: '#FFFFFF',
    color: '#D97706',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    fontWeight: 700,
  } as React.CSSProperties,

  card: {
    background: '#FFFFFF',
    borderRadius: 24,
    border: '1.5px solid #77574A',
    boxShadow: '0 10px 32px rgba(74, 58, 52, 0.08)',
    padding: '28px 36px 40px 36px',
    width: '100%',
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 36,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  leftBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  wireframeBtn: {
    padding: '7px 24px',
    border: '1.5px solid #4A3A34',
    borderRadius: 12,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#4A3A34',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  wireframeBtnHover: {
    background: '#4A3A34',
    color: '#FFFFFF',
  } as React.CSSProperties,

  confirmBtn: {
    padding: '7px 24px',
    border: '1.5px solid #5C3A4D',
    borderRadius: 12,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#FFFFFF',
    background: '#5C3A4D',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 6px rgba(92, 58, 77, 0.25)',
  } as React.CSSProperties,

  confirmBtnHover: {
    background: '#482B3B',
    borderColor: '#482B3B',
  } as React.CSSProperties,

  // Status Chevron Ribbon
  chevronRibbon: {
    display: 'flex',
    alignItems: 'center',
    background: '#EAE6E1',
    borderRadius: 6,
    overflow: 'hidden',
    height: 32,
    padding: '0 4px',
  } as React.CSSProperties,

  chevronItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    height: '100%',
    position: 'relative' as const,
    cursor: 'default',
    color: '#4A3A34',
    background: 'transparent',
    fontSize: 12.5,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 600,
    clipPath: 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%, 10px 50%)',
    marginLeft: -4,
  } as React.CSSProperties,

  chevronFirst: {
    marginLeft: 0,
    clipPath: 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)',
  } as React.CSSProperties,

  chevronLast: {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10px 50%)',
    paddingRight: 14,
  } as React.CSSProperties,

  chevronItemActive: {
    background: '#D9D0C5',
    color: '#382A24',
    fontWeight: 700,
  } as React.CSSProperties,

  chevronText: {
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#FDF2F2',
    border: '1px solid #F8B4B4',
    color: '#9B1C1C',
    fontSize: 13,
    marginBottom: 20,
  } as React.CSSProperties,

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px 44px',
    marginBottom: 36,
  } as React.CSSProperties,

  col: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 22,
  } as React.CSSProperties,

  fieldRow: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  fieldLabel: {
    width: 140,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#9B2C2C',
    flexShrink: 0,
  } as React.CSSProperties,

  inputWrapper: {
    flex: 1,
  } as React.CSSProperties,

  underlineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '6px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 14.5,
    color: '#382A24',
    outline: 'none',
  } as React.CSSProperties,

  linkAnnotationWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
    width: '100%',
  } as React.CSSProperties,

  clickableLinkUnderline: {
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '6px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 14.5,
    color: '#382A24',
    textDecoration: 'none',
    cursor: 'pointer',
    flex: '0 0 auto',
  } as React.CSSProperties,

  annotationOrange: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: 600,
    fontStyle: 'italic',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  periodInputsWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  periodUnderlineInput: {
    width: '45%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '6px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 14.5,
    color: '#382A24',
    outline: 'none',
  } as React.CSSProperties,

  periodToText: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 14.5,
    color: '#9B2C2C',
    flexShrink: 0,
  } as React.CSSProperties,

  // Table Styles
  tableSection: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,

  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,

  headerRow: {
    borderBottom: '1.5px solid #4A3A34',
  } as React.CSSProperties,

  th: {
    padding: '12px 12px',
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#382A24',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,

  bodyRow: {
    borderBottom: '1px solid #77574A',
  } as React.CSSProperties,

  td: {
    padding: '12px 12px',
    fontSize: 14,
    color: '#382A24',
    fontFamily: '"DM Sans", sans-serif',
  } as React.CSSProperties,

  typeText: {
    textTransform: 'capitalize' as const,
    color: '#5C453A',
  } as React.CSSProperties,

  inlineSelectWrapper: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 180,
  } as React.CSSProperties,

  inlineSelect: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #77574A',
    background: 'transparent',
    padding: '4px 20px 4px 0',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14,
    color: '#382A24',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  } as React.CSSProperties,

  inlineSelectArrow: {
    position: 'absolute' as const,
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#77574A',
  } as React.CSSProperties,

  inlineAmountInput: {
    width: '100%',
    maxWidth: 130,
    border: 'none',
    borderBottom: '1px solid #77574A',
    background: 'transparent',
    padding: '4px',
    textAlign: 'right' as const,
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14,
    color: '#382A24',
    outline: 'none',
  } as React.CSSProperties,

  achievedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'transparent',
    border: 'none',
    color: '#382A24',
    cursor: 'pointer',
    padding: 0,
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14,
  } as React.CSSProperties,

  removeRowBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9B2C2C',
    cursor: 'pointer',
    padding: 4,
  } as React.CSSProperties,

  addLineContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: 8,
  } as React.CSSProperties,

  addLineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    border: '1px solid #77574A',
    borderRadius: 8,
    background: '#FFFFFF',
    color: '#4A3A34',
    fontSize: 12.5,
    fontWeight: 600,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Menu & Stage Mapping Guide Styles
  mappingHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #E4D5C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,

  mappingTitle: {
    fontFamily: '"Montserrat", var(--font-display), cursive, sans-serif',
    fontWeight: 700,
    fontSize: 22,
    color: '#DC2626',
    margin: 0,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  mappingBody: {
    padding: 24,
    maxHeight: 520,
    overflowY: 'auto' as const,
  } as React.CSSProperties,

  mappingTableContainer: {
    border: '1.5px solid #77574A',
    borderRadius: 20,
    padding: '20px 24px',
    background: '#FFFFFF',
  } as React.CSSProperties,

  mappingRowHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottom: '1.5px solid #77574A',
    marginBottom: 8,
  } as React.CSSProperties,

  mappingRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #E4D5C7',
  } as React.CSSProperties,

  mockBtn: {
    display: 'inline-block',
    padding: '6px 18px',
    border: '1.5px solid #4A3A34',
    borderRadius: 10,
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#4A3A34',
    background: '#F5EFEB',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  mockConfirmBtn: {
    display: 'inline-block',
    padding: '6px 18px',
    border: '1.5px solid #5C3A4D',
    borderRadius: 10,
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#FFFFFF',
    background: '#5C3A4D',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  // Modal Styles
  modalBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 200,
    background: 'rgba(74, 58, 52, 0.4)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  } as React.CSSProperties,

  modalContent: {
    background: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 760,
    width: '100%',
    overflow: 'hidden',
    border: '1.5px solid #77574A',
    boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
  } as React.CSSProperties,

  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E4D5C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,

  modalTitle: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 16,
    color: '#382A24',
    margin: 0,
  } as React.CSSProperties,

  modalSubtitle: {
    margin: '4px 0 0 0',
    fontSize: 12,
    color: '#77574A',
  } as React.CSSProperties,

  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#77574A',
    cursor: 'pointer',
  } as React.CSSProperties,

  modalBody: {
    padding: 20,
    maxHeight: 400,
    overflowY: 'auto' as const,
  } as React.CSSProperties,

  modalLoading: {
    textAlign: 'center' as const,
    padding: 32,
    color: '#77574A',
    fontSize: 13,
  } as React.CSSProperties,

  modalEmpty: {
    textAlign: 'center' as const,
    padding: 32,
    color: '#77574A',
    fontSize: 13,
  } as React.CSSProperties,

  modalTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,

  modalTableHead: {
    background: '#F5EFEB',
    height: 36,
    borderBottom: '1px solid #E4D5C7',
  } as React.CSSProperties,

  modalTh: {
    padding: '0 12px',
    fontSize: 11,
    fontWeight: 600,
    color: '#77574A',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  modalTr: {
    height: 40,
    borderBottom: '1px solid #F0E8DF',
  } as React.CSSProperties,

  modalTd: {
    padding: '0 12px',
    fontSize: 12.5,
    color: '#382A24',
  } as React.CSSProperties,

  modalStatusBadge: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#E8F5E9',
    color: '#2E7D32',
  } as React.CSSProperties,

  modalFooter: {
    padding: '12px 20px',
    background: 'var(--cream, #F9F2E4)',
    borderTop: '1px solid #E4D5C7',
    display: 'flex',
    justifyContent: 'flex-end',
  } as React.CSSProperties,

  modalCloseButton: {
    padding: '6px 16px',
    fontSize: 13,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 600,
    color: '#382A24',
    background: '#FFFFFF',
    border: '1px solid #77574A',
    borderRadius: 8,
    cursor: 'pointer',
  } as React.CSSProperties,
};
