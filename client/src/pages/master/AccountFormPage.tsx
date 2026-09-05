import React, { useState, useEffect } from 'react';
import { AccountsApi } from '../../api/accounts.api';
import { Account, CreateAccountInput, AccountType } from '@shared/schemas/account.schema';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface AccountFormPageProps {
  accountId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome?: () => void;
  onNew?: () => void;
}

export const AccountFormPage: React.FC<AccountFormPageProps> = ({
  accountId,
  onBack,
  onSaved,
}) => {
  const isNew = !accountId;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('asset');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      setLoading(true);
      AccountsApi.getById(accountId)
        .then(data => {
          setName(data.name);
          setType(data.type);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setType('asset');
      setError(null);
    }
  }, [accountId]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Account Name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: CreateAccountInput = {
        name: name.trim(),
        type,
        is_archived: false,
      };

      let saved: Account;
      if (isNew) {
        saved = await AccountsApi.create(payload);
      } else {
        saved = await AccountsApi.update(accountId!, payload);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Wireframe Header Title */}
        <h1 style={styles.heading}>Chart of Accounts (Form View)</h1>

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
            {/* Account Name */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Account Name</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Office Equipment A/c"
                  style={styles.underlineInput}
                />
              </div>
            </div>

            {/* Type with Dropdown Categories: Balancesheet & Profit and Loss */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Type</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    style={styles.underlineSelect}
                  >
                    <optgroup label="Balancesheet">
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="bank">Bank</option>
                      <option value="capital">Capital</option>
                      <option value="cash">Cash</option>
                    </optgroup>
                    <optgroup label="Profit and Loss">
                      <option value="income">Income</option>
                      <option value="expense">Expenses</option>
                      <option value="other_expense">Other Expenses</option>
                    </optgroup>
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* Note text matching the wireframe */}
            <div style={styles.noteBox}>
              <p style={styles.noteText}>
                Each account is assigned an Account Type, which would further be used for how the account to be treated and where it appears in reports.
              </p>
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
    width: 150,
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

  noteBox: {
    marginTop: 10,
    padding: '12px 16px',
    borderRadius: 12,
    background: '#FAF7F4',
    border: '1px dashed #D2B79F',
  } as React.CSSProperties,

  noteText: {
    margin: 0,
    fontSize: 13,
    color: '#6B4E3D',
    lineHeight: 1.5,
    fontStyle: 'italic',
  } as React.CSSProperties,
};
