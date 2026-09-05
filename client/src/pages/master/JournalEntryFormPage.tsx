import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AccountsApi } from '../../api/accounts.api';
import { ContactsApi } from '../../api/contacts.api';
import { Account, Journal } from '@shared/schemas/account.schema';
import { Contact } from '@shared/schemas/contact.schema';
import { ChevronDown, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Decimal from 'decimal.js';

interface JournalLineItem {
  id?: number;
  account_id: number | '';
  partner_id?: number | '';
  debit: string;
  credit: string;
}

interface JournalEntryFormPageProps {
  entryId?: number | null;
  onBack?: () => void;
  onSaved?: (id: number) => void;
}

export const JournalEntryFormPage: React.FC<JournalEntryFormPageProps> = ({
  entryId: propEntryId,
  onBack,
  onSaved,
}) => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const entryId = propEntryId || (params.id && params.id !== 'new' ? parseInt(params.id, 10) : null);
  const isNew = !entryId;

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [journalId, setJournalId] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLineItem[]>([
    { account_id: '', partner_id: '', debit: '', credit: '' },
    { account_id: '', partner_id: '', debit: '', credit: '' },
  ]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Fetch CoA, Journals, and Contacts
  useEffect(() => {
    AccountsApi.getAll(false).then(setAccounts).catch(console.error);
    AccountsApi.getAllJournals(false).then(j => {
      setJournals(j);
      if (isNew && j.length > 0 && journalId === '') {
        setJournalId(j[0].id!);
      }
    }).catch(console.error);
    ContactsApi.getAll(false).then(setContacts).catch(console.error);

    if (entryId) {
      setLoading(true);
      fetch(`/api/journal-entries/${entryId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            const data = json.data;
            setEntryDate(data.entryDate || data.entry_date || '');
            setJournalId(data.journalId || data.journal_id || '');
            setReference(data.reference || '');
            if (data.lines && data.lines.length > 0) {
              setLines(
                data.lines.map((l: any) => ({
                  account_id: l.accountId || l.account_id || '',
                  partner_id: l.partnerId || l.partner_id || '',
                  debit: l.debit || '0.00',
                  credit: l.credit || '0.00',
                }))
              );
            }
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [entryId]);

  // Calculate totals and balance check
  const calculateTotals = () => {
    let debTotal = new Decimal(0);
    let credTotal = new Decimal(0);

    lines.forEach(line => {
      try {
        if (line.debit && !isNaN(Number(line.debit))) {
          debTotal = debTotal.plus(new Decimal(line.debit));
        }
        if (line.credit && !isNaN(Number(line.credit))) {
          credTotal = credTotal.plus(new Decimal(line.credit));
        }
      } catch {
        // ignore parsing
      }
    });

    const isBalanced = debTotal.greaterThan(0) && debTotal.equals(credTotal);
    const hasAmounts = debTotal.greaterThan(0) || credTotal.greaterThan(0);
    const isMismatch = hasAmounts && !debTotal.equals(credTotal);

    return {
      debitTotal: debTotal.toFixed(2),
      creditTotal: credTotal.toFixed(2),
      isBalanced,
      isMismatch,
    };
  };

  const { debitTotal, creditTotal, isBalanced, isMismatch } = calculateTotals();

  const handleAddLine = () => {
    setLines(prev => [...prev, { account_id: '', partner_id: '', debit: '', credit: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalLineItem, value: any) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // If debit entered, clear credit and vice versa
      if (field === 'debit' && value) {
        updated[index].credit = '';
      } else if (field === 'credit' && value) {
        updated[index].debit = '';
      }
      return updated;
    });
  };

  const handlePost = async () => {
    setError(null);
    if (!journalId) {
      setError('Journal selection is required');
      return;
    }
    if (!entryDate) {
      setError('Accounting Date is required');
      return;
    }

    // Blocking warning if debit != credit
    if (!isBalanced) {
      setError("Blocking warning: Debit and credit amounts don't match. You cannot post an unbalanced journal entry.");
      return;
    }

    // Validate accounts selected
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const d = parseFloat(l.debit || '0');
      const c = parseFloat(l.credit || '0');
      if ((d > 0 || c > 0) && !l.account_id) {
        setError(`Please select an account for line ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);

      const validLines = lines
        .filter(l => (parseFloat(l.debit || '0') > 0 || parseFloat(l.credit || '0') > 0))
        .map(l => ({
          account_id: Number(l.account_id),
          partner_id: l.partner_id ? Number(l.partner_id) : null,
          debit: parseFloat(l.debit || '0').toFixed(2),
          credit: parseFloat(l.credit || '0').toFixed(2),
        }));

      if (validLines.length < 2) {
        setError('Journal entry must have at least 2 valid lines with amounts');
        return;
      }

      const payload = {
        journal_id: Number(journalId),
        entry_date: entryDate,
        reference: reference.trim() || undefined,
        lines: validLines,
      };

      // 1. Create Entry
      const createRes = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const createJson = await createRes.json();

      if (createJson.error) {
        throw new Error(createJson.error.message || 'Failed to create journal entry');
      }

      const createdId = createJson.data.id;

      // 2. Post Entry
      const postRes = await fetch(`/api/journal-entries/${createdId}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const postJson = await postRes.json();

      if (postJson.error) {
        throw new Error(postJson.error.message || 'Failed to post journal entry');
      }

      if (onSaved) {
        onSaved(createdId);
      } else {
        navigate('/account/journal-entries');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onBack) onBack();
    else navigate('/account/journal-entries');
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/account/journal-entries');
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
        {/* Wireframe Header */}
        <h1 style={styles.heading}>Journal Entries (Form View)</h1>

        {/* Outer Card */}
        <div style={styles.card}>
          {/* Top Bar: [Post] ... [Cancel] [Back] */}
          <div style={styles.topBar}>
            <button
              type="button"
              onClick={handlePost}
              disabled={loading || !isBalanced}
              onMouseEnter={() => setHoveredBtn('post')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.postBtn,
                ...(hoveredBtn === 'post' && isBalanced && !loading ? styles.postBtnHover : {}),
                opacity: loading || !isBalanced ? 0.55 : 1,
                cursor: loading || !isBalanced ? 'not-allowed' : 'pointer',
              }}
              title={!isBalanced ? 'Debit and credit must match to post' : 'Post journal entry'}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>

            <div style={styles.rightBtnGroup}>
              <button
                type="button"
                onClick={handleCancel}
                onMouseEnter={() => setHoveredBtn('cancel')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'cancel' ? styles.wireframeBtnHover : {}),
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBack}
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
          </div>

          {/* Form Header Fields: Accounting Date & Journal */}
          <div style={styles.headerFields}>
            {/* Accounting Date */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Accounting Date</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  style={styles.underlineInput}
                />
              </div>
            </div>

            {/* Journal */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Journal</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={journalId}
                    onChange={e => setJournalId(e.target.value ? Number(e.target.value) : '')}
                    style={styles.underlineSelect}
                  >
                    <option value="" disabled>
                      Selection (From journals Many to one)
                    </option>
                    {journals.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* Reference */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Reference</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. Reference / Memo"
                  style={styles.underlineInput}
                />
              </div>
            </div>
          </div>

          {/* Lines Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{ ...styles.th, textAlign: 'left', width: '38%' }}>Account</th>
                  <th style={{ ...styles.th, textAlign: 'left', width: '28%' }}>Partner</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '16%' }}>Debit</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '16%' }}>Credit</th>
                  <th style={{ ...styles.th, width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} style={styles.bodyRow}>
                    {/* Account Dropdown (Many to one from CoA) */}
                    <td style={styles.td}>
                      <select
                        value={line.account_id}
                        onChange={e =>
                          handleLineChange(idx, 'account_id', e.target.value ? Number(e.target.value) : '')
                        }
                        style={styles.tableSelect}
                      >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {formatAccountName(acc)}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Partner Dropdown (Selection from contact master) */}
                    <td style={styles.td}>
                      <select
                        value={line.partner_id || ''}
                        onChange={e =>
                          handleLineChange(idx, 'partner_id', e.target.value ? Number(e.target.value) : '')
                        }
                        style={styles.tableSelect}
                      >
                        <option value="">Select Partner</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Debit Input */}
                    <td style={styles.td}>
                      <div
                        style={{
                          ...styles.amountInputWrap,
                          background: line.debit ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                          borderColor: line.debit ? '#77574A' : '#D2B79F',
                        }}
                      >
                        {line.debit ? <span style={styles.currencyPrefix}>Rs.</span> : null}
                        <input
                          type="number"
                          step="0.01"
                          placeholder=""
                          value={line.debit}
                          onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                          style={styles.tableAmountInput}
                        />
                      </div>
                    </td>

                    {/* Credit Input */}
                    <td style={styles.td}>
                      <div
                        style={{
                          ...styles.amountInputWrap,
                          background: line.credit ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                          borderColor: line.credit ? '#77574A' : '#D2B79F',
                        }}
                      >
                        {line.credit ? <span style={styles.currencyPrefix}>Rs.</span> : null}
                        <input
                          type="number"
                          step="0.01"
                          placeholder=""
                          value={line.credit}
                          onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                          style={styles.tableAmountInput}
                        />
                      </div>
                    </td>

                    {/* Remove Line Action */}
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          style={styles.deleteRowBtn}
                          title="Remove line"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={styles.totalRow}>
                  <td colSpan={2} style={styles.tdTotalLabel}>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      style={styles.addLineBtn}
                    >
                      <Plus size={14} />
                      <span>Add Line</span>
                    </button>
                  </td>
                  <td style={styles.tdTotalValue}>Rs. {debitTotal}</td>
                  <td style={styles.tdTotalValue}>Rs. {creditTotal}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Blocking warning if debit and credit don't match */}
          {isMismatch && (
            <div style={styles.blockingWarningBox}>
              <AlertTriangle size={18} color="#C53030" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', color: '#9B2C2C' }}>
                  Blocking warning if the debit and credit amount don&apos;t match
                </strong>
                <span>
                  Total Debit (Rs. {debitTotal}) does not equal Total Credit (Rs. {creditTotal}). The entry cannot be posted until debits equal credits.
                </span>
              </div>
            </div>
          )}

          {isBalanced && (
            <div style={styles.balancedBox}>
              <CheckCircle2 size={16} color="#22543D" />
              <span>Balanced: Total Debit and Credit equal Rs. {debitTotal}</span>
            </div>
          )}

          {error && !isMismatch && (
            <div style={styles.errorBox}>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Wireframe Field Explanation Box */}
        <div style={styles.explanationBox}>
          <div style={styles.explanationHeader}>Field Explanation</div>
          <div style={styles.explanationItem}>
            <span style={styles.explanationKeyAccount}>Account</span>
            <span style={styles.explanationSep}>-</span>
            <span style={styles.explanationVal}>Selection From Chart of Accounts (Many to one)</span>
          </div>
          <div style={styles.explanationItem}>
            <span style={styles.explanationKeyPartner}>Partner</span>
            <span style={styles.explanationSep}>-</span>
            <span style={styles.explanationVal}>Selection from contact master</span>
          </div>
          <div style={styles.explanationFooter}>
            The Transaction would be connected through Chart of Accounts
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
    maxWidth: 820,
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
    gap: 16,
    marginBottom: 30,
  } as React.CSSProperties,

  postBtn: {
    padding: '7px 28px',
    border: '1.5px solid #5A4050',
    borderRadius: 12,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#FFFFFF',
    background: '#5F4655',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(95, 70, 85, 0.25)',
  } as React.CSSProperties,

  postBtnHover: {
    background: '#483441',
  } as React.CSSProperties,

  rightBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,

  wireframeBtn: {
    padding: '6px 22px',
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

  headerFields: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    marginBottom: 28,
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

  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
    marginBottom: 20,
  } as React.CSSProperties,

  table: {
    width: '100%',
    tableLayout: 'fixed' as const,
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
    color: '#382A24',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  bodyRow: {
    borderBottom: '1px solid #E4D5C7',
  } as React.CSSProperties,

  td: {
    padding: '10px 10px',
    fontSize: 13.5,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  tableSelect: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #D2B79F',
    background: '#FFFFFF',
    fontSize: 13.5,
    color: '#382A24',
    outline: 'none',
  } as React.CSSProperties,

  amountInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    border: '1px solid #D2B79F',
    borderRadius: 8,
    padding: '4px 8px',
    background: '#FFFFFF',
  } as React.CSSProperties,

  currencyPrefix: {
    fontSize: 12,
    color: '#77574A',
    fontWeight: 600,
  } as React.CSSProperties,

  tableAmountInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    textAlign: 'right' as const,
    fontSize: 13.5,
    color: '#382A24',
    fontFamily: '"DM Sans", monospace',
    background: 'transparent',
  } as React.CSSProperties,

  deleteRowBtn: {
    border: 'none',
    background: 'transparent',
    color: '#C53030',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  totalRow: {
    borderTop: '1.5px solid #77574A',
  } as React.CSSProperties,

  tdTotalLabel: {
    padding: '12px 10px',
  } as React.CSSProperties,

  addLineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 8,
    border: '1px dashed #77574A',
    background: 'rgba(235, 215, 190, 0.3)',
    color: '#4A3A34',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  tdTotalValue: {
    padding: '12px 14px',
    textAlign: 'right' as const,
    fontWeight: 700,
    fontSize: 14,
    color: '#382A24',
    fontFamily: '"DM Sans", monospace',
  } as React.CSSProperties,

  blockingWarningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 12,
    background: '#FFF5F5',
    border: '1.5px solid #E53E3E',
    fontSize: 13,
    color: '#742A2A',
    lineHeight: 1.4,
    marginTop: 14,
  } as React.CSSProperties,

  balancedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 10,
    background: '#F0FFF4',
    border: '1px solid #9AE6B4',
    fontSize: 13,
    color: '#22543D',
    fontWeight: 600,
    marginTop: 14,
  } as React.CSSProperties,

  errorBox: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#FFF5F5',
    border: '1px solid #FEB2B2',
    fontSize: 13,
    color: '#9B2C2C',
    marginTop: 14,
  } as React.CSSProperties,

  explanationBox: {
    marginTop: 28,
    background: '#FFFFFF',
    borderRadius: 18,
    border: '1.5px solid #77574A',
    boxShadow: '0 4px 14px rgba(74, 58, 52, 0.05)',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as React.CSSProperties,

  explanationHeader: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 16,
    color: '#382A24',
    textAlign: 'center' as const,
    marginBottom: 4,
  } as React.CSSProperties,

  explanationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    padding: '2px 0',
  } as React.CSSProperties,

  explanationKeyAccount: {
    fontWeight: 700,
    color: '#9B2C2C',
    minWidth: 70,
  } as React.CSSProperties,

  explanationKeyPartner: {
    fontWeight: 700,
    color: '#9B2C2C',
    minWidth: 70,
  } as React.CSSProperties,

  explanationSep: {
    color: '#77574A',
  } as React.CSSProperties,

  explanationVal: {
    color: '#2B6CB0',
    fontWeight: 500,
  } as React.CSSProperties,

  explanationFooter: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#9B2C2C',
    textAlign: 'center' as const,
  } as React.CSSProperties,
};
