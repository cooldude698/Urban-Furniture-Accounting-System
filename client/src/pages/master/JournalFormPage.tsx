import React, { useState, useEffect } from 'react';
import { AccountsApi } from '../../api/accounts.api';
import { Journal, CreateJournalInput, JournalType, Account } from '@shared/schemas/account.schema';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface JournalFormPageProps {
  journalId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome?: () => void;
  onNew?: () => void;
}

export const JournalFormPage: React.FC<JournalFormPageProps> = ({
  journalId,
  onBack,
  onSaved,
}) => {
  const isNew = !journalId;

  const [name, setName] = useState('');
  const [type, setType] = useState<JournalType>('sales');
  const [defaultAccountId, setDefaultAccountId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Load accounts for many-to-one selection
  useEffect(() => {
    AccountsApi.getAll(false)
      .then(accs => {
        setAccounts(accs);
        if (isNew && accs.length > 0 && defaultAccountId === '') {
          // Default to first matching or first account
          const defaultAcc = accs.find(a => a.type === 'income' || a.name.toLowerCase().includes('sales')) || accs[0];
          setDefaultAccountId(defaultAcc.id!);
        }
      })
      .catch(console.error);

    if (journalId) {
      setLoading(true);
      AccountsApi.getJournalById(journalId)
        .then(j => {
          setName(j.name);
          setType(j.type);
          setDefaultAccountId(j.default_account_id);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setType('sales');
      setError(null);
    }
  }, [journalId]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Journal Name is required');
      return;
    }
    if (!defaultAccountId) {
      setError('Default Account is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: CreateJournalInput = {
        name: name.trim(),
        type,
        default_account_id: Number(defaultAccountId),
        is_archived: false,
      };

      let saved: Journal;
      if (isNew) {
        saved = await AccountsApi.createJournal(payload);
      } else {
        saved = await AccountsApi.updateJournal(journalId!, payload);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save journal');
    } finally {
      setLoading(false);
    }
  };

  const formatAccountName = (acc: Account): string => {
    if (acc.name.endsWith('A/c') || acc.name.endsWith('a/c') || acc.name.endsWith('Account')) {
      return acc.name;
    }
    return `${acc.name} A/c`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Wireframe Header Title */}
        <h1 style={styles.heading}>Journals (Form View)</h1>

        {/* Outer Card */}
        <div style={styles.card}>
          {/* Top Bar: [Confirm] ... [Back] */}
          <div style={styles.topBar}>
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

          {/* Form Content */}
          <div style={styles.formContent}>
            {/* Field 1: Journal Name */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Journal Name</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name"
                  style={styles.underlineInput}
                />
              </div>
            </div>

            {/* Field 2: Journal Type (Selection from Sales, Purchase, Bank, Cash) */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Journal Type</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as JournalType)}
                    style={styles.underlineSelect}
                  >
                    <option value="sales">Sales</option>
                    <option value="purchase">Purchase</option>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* Field 3: Default Account (Many-to-one from Chart of Accounts) */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Default Account</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={defaultAccountId}
                    onChange={e => setDefaultAccountId(e.target.value ? Number(e.target.value) : '')}
                    style={styles.underlineSelect}
                  >
                    <option value="" disabled>
                      Selection
                    </option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {formatAccountName(acc)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
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
    maxWidth: 680,
  } as React.CSSProperties,

  heading: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 21,
    color: '#382A24',
    textAlign: 'center' as const,
    marginBottom: 18,
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
    marginBottom: 36,
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

  formContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 28,
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
    color: '#382A24',
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
};
