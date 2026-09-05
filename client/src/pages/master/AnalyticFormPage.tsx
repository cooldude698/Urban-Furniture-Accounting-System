import React, { useState, useEffect } from 'react';
import { AnalyticsApi } from '../../api/analytics.api';
import { BudgetApi, Budget } from '../../api/budget.api';
import { AnalyticAccount, CreateAnalyticAccountInput, AnalyticType } from '@shared/schemas/analytic.schema';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface AnalyticFormPageProps {
  analyticId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome?: () => void;
  onNew?: () => void;
}

interface LinkedBudgetRow {
  budgetName: string;
  startDate: string;
  endDate: string;
  committed: string | number;
  achieved: string | number;
}

export const AnalyticFormPage: React.FC<AnalyticFormPageProps> = ({
  analyticId,
  onBack,
  onSaved,
  onNew,
}) => {
  const isNew = !analyticId;

  const [name, setName] = useState('');
  const [type, setType] = useState<AnalyticType>('expense');
  const [linkedBudgets, setLinkedBudgets] = useState<LinkedBudgetRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0';
    return Math.round(num).toString();
  };

  useEffect(() => {
    if (!analyticId) {
      setLinkedBudgets([]);
      return;
    }

    // Fetch budgets to filter lines matching this analytic account
    BudgetApi.getAll()
      .then(budgets => {
        const rows: LinkedBudgetRow[] = [];
        budgets.forEach(b => {
          const matchingLines = (b.lines || []).filter(l => l.analytic_account_id === analyticId);
          matchingLines.forEach(l => {
            rows.push({
              budgetName: b.name,
              startDate: formatDate(b.period_start),
              endDate: formatDate(b.period_end),
              committed: formatAmount(l.committed_amount),
              achieved: formatAmount(l.achieved_amount),
            });
          });
        });
        setLinkedBudgets(rows);
      })
      .catch(console.error);

    if (analyticId) {
      setLoading(true);
      AnalyticsApi.getById(analyticId)
        .then(data => {
          setName(data.name);
          setType(data.type);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setType('expense');
      setError(null);
    }
  }, [analyticId]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Analytic Account name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: CreateAnalyticAccountInput = {
        name: name.trim(),
        type,
        is_archived: false,
      };

      let saved: AnalyticAccount;
      if (isNew) {
        saved = await AnalyticsApi.create(payload);
      } else {
        saved = await AnalyticsApi.update(analyticId!, payload);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save analytic account');
    } finally {
      setLoading(false);
    }
  };

  const handleNewClick = () => {
    if (onNew) {
      onNew();
    } else {
      setName('');
      setType('expense');
      setError(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Wireframe Header Title: Analyticals Form View */}
        <h1 style={styles.heading}>Analyticals Form View</h1>

        {/* Outer Wireframe Card */}
        <div style={styles.card}>
          {/* Top Bar: [New] [Confirm] ... [Back] */}
          <div style={styles.topBar}>
            <div style={styles.leftBtnGroup}>
              <button
                type="button"
                onClick={handleNewClick}
                onMouseEnter={() => setHoveredBtn('new')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'new' ? styles.wireframeBtnHover : {}),
                }}
              >
                New
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                onMouseEnter={() => setHoveredBtn('confirm')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'confirm' ? styles.wireframeBtnHover : {}),
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>

            <button
              type="button"
              onClick={onBack}
              onMouseEnter={() => setHoveredBtn('back')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.wireframeBtn,
                ...(hoveredBtn === 'back' ? styles.wireframeBtnHover : {}),
              }}
            >
              Back
            </button>
          </div>

          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Header Fields: Analytic Account & Type */}
          <div style={styles.formFields}>
            {/* Field 1: Analytic Account */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Analytic Account</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Living Room Furniture Project"
                  style={styles.underlineInput}
                />
              </div>
            </div>

            {/* Field 2: Type (Dropdown selection: Income, Expense) */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Type</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AnalyticType)}
                    style={styles.underlineSelect}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
            </div>
          </div>

          {/* Table: All the Budget List where the Analytic Account is used */}
          <div style={styles.tableSection}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={{ ...styles.th, textAlign: 'left', width: '28%' }}>Budget</th>
                    <th style={{ ...styles.th, textAlign: 'center', width: '20%' }}>Start Date</th>
                    <th style={{ ...styles.th, textAlign: 'center', width: '20%' }}>End Date</th>
                    <th style={{ ...styles.th, textAlign: 'right', width: '16%' }}>Committed</th>
                    <th style={{ ...styles.th, textAlign: 'right', width: '16%' }}>Achieved</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedBudgets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: 'center',
                          padding: '28px 12px',
                          color: '#77574A',
                          fontStyle: 'italic',
                          fontSize: 13.5,
                        }}
                      >
                        No budgets are currently linked to this Analytic Account.
                      </td>
                    </tr>
                  ) : (
                    linkedBudgets.map((row, idx) => (
                      <tr key={idx} style={styles.bodyRow}>
                        <td style={styles.tdBudgetName}>{row.budgetName}</td>
                        <td style={styles.tdDate}>{row.startDate}</td>
                        <td style={styles.tdDate}>{row.endDate}</td>
                        <td style={styles.tdAmount}>{row.committed}</td>
                        <td style={styles.tdAmount}>{row.achieved}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Wireframe Annotation */}
            <div style={styles.annotationNote}>
              <span>All the Budget List where the Analytic Account is used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    maxWidth: 780,
  } as React.CSSProperties,

  heading: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 22,
    color: '#D97706',
    textAlign: 'center' as const,
    marginBottom: 20,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  card: {
    background: '#FFFFFF',
    borderRadius: 24,
    border: '1.5px solid #77574A',
    boxShadow: '0 10px 32px rgba(74, 58, 52, 0.08)',
    padding: '28px 36px 36px 36px',
    width: '100%',
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 34,
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

  formFields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
    marginBottom: 36,
  } as React.CSSProperties,

  fieldRow: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  fieldLabel: {
    width: 170,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 15.5,
    color: '#9B2C2C',
    flexShrink: 0,
  } as React.CSSProperties,

  inputUnderlineWrapper: {
    flex: 1,
    position: 'relative' as const,
  } as React.CSSProperties,

  underlineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '8px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 15,
    color: '#382A24',
    outline: 'none',
  } as React.CSSProperties,

  selectWrapper: {
    position: 'relative' as const,
    width: '100%',
  } as React.CSSProperties,

  underlineSelect: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '8px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 15,
    color: '#382A24',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    cursor: 'pointer',
  } as React.CSSProperties,

  selectArrow: {
    position: 'absolute' as const,
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#77574A',
  } as React.CSSProperties,

  tableSection: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
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
    borderBottom: '1.5px solid #77574A',
  } as React.CSSProperties,

  th: {
    padding: '12px 14px',
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#9B2C2C',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  bodyRow: {
    borderBottom: '1px solid #E4D5C7',
    transition: 'background 120ms ease',
  } as React.CSSProperties,

  tdBudgetName: {
    padding: '12px 14px',
    fontSize: 13.5,
    color: '#5C453A',
    fontFamily: '"DM Sans", sans-serif',
  } as React.CSSProperties,

  tdDate: {
    padding: '12px 14px',
    fontSize: 13.5,
    color: '#382A24',
    textAlign: 'center' as const,
    fontFamily: '"DM Sans", sans-serif',
  } as React.CSSProperties,

  tdAmount: {
    padding: '12px 14px',
    fontSize: 13.5,
    color: '#382A24',
    textAlign: 'right' as const,
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 500,
  } as React.CSSProperties,

  annotationNote: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: '#9B2C2C',
    fontStyle: 'italic',
    paddingLeft: 4,
  } as React.CSSProperties,
};
