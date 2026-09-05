import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReportsApi, LedgerDetail, LedgerEntry } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  X,
  ArrowLeft,
  FileText,
  BookOpen,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface LedgerDrilldownModalProps {
  accountId: number;
  accountName: string;
  from?: string;
  to?: string;
  asOf?: string;
  onClose: () => void;
}

export default function LedgerDrilldownModal({
  accountId,
  accountName,
  from,
  to,
  asOf,
  onClose,
}: LedgerDrilldownModalProps) {
  // Current view level: 2 = Ledger, 3 = Journal Entry, 4 = Source Document
  const [drillLevel, setDrillLevel] = useState<2 | 3 | 4>(2);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  // Fetch Ledger Detail (Level 2)
  const { data: ledger, isLoading } = useQuery<LedgerDetail>({
    queryKey: ['ledger', accountId, from, to, asOf],
    queryFn: () => ReportsApi.getLedgerDetail(accountId, from, to || asOf),
  });

  const handleEntryClick = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setDrillLevel(3);
  };

  const handleSourceDocClick = () => {
    setDrillLevel(4);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(74, 58, 52, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 900,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(208, 174, 146, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header with 4-Level Breadcrumb ── */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--cream)',
            borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Breadcrumb indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-body)' }}>
              <span style={{ color: 'var(--brown-500)' }}>Level 1: Financial Report</span>
              <ChevronRight size={12} style={{ color: 'var(--brown-300)' }} />
              <button
                type="button"
                onClick={() => setDrillLevel(2)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: drillLevel === 2 ? 'var(--brown-900)' : 'var(--brown-700)',
                  fontWeight: drillLevel === 2 ? 700 : 500,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: drillLevel > 2 ? 'underline' : 'none',
                }}
              >
                Level 2: {accountName} Ledger
              </button>
              {drillLevel >= 3 && selectedEntry && (
                <>
                  <ChevronRight size={12} style={{ color: 'var(--brown-300)' }} />
                  <button
                    type="button"
                    onClick={() => setDrillLevel(3)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: drillLevel === 3 ? 'var(--brown-900)' : 'var(--brown-700)',
                      fontWeight: drillLevel === 3 ? 700 : 500,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: drillLevel > 3 ? 'underline' : 'none',
                    }}
                  >
                    Level 3: Entry #{selectedEntry.number}
                  </button>
                </>
              )}
              {drillLevel === 4 && selectedEntry && (
                <>
                  <ChevronRight size={12} style={{ color: 'var(--brown-300)' }} />
                  <span style={{ color: 'var(--posted)', fontWeight: 700 }}>
                    Level 4: Source Document ({selectedEntry.sourceType?.toUpperCase()})
                  </span>
                </>
              )}
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              {drillLevel === 2 && `General Ledger — ${accountName}`}
              {drillLevel === 3 && `Journal Entry — ${selectedEntry?.number}`}
              {drillLevel === 4 && `Source Document — ${selectedEntry?.sourceType?.toUpperCase()} #${selectedEntry?.sourceId}`}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {drillLevel > 2 && (
              <button
                type="button"
                onClick={() => setDrillLevel((prev) => ((prev - 1) as any))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--brown-700)',
                  background: 'var(--surface)',
                  border: '1px solid var(--brown-300)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--brown-700)', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Modal Content based on Drill Level ── */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* LEVEL 2: Account Ledger */}
          {drillLevel === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(235, 215, 190, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--brown-900)',
                }}
              >
                <div>
                  <strong>Period:</strong> {from || 'Beginning'} → {to || asOf || 'Current'}
                </div>
                <div>
                  <strong>Opening Balance:</strong> <Money value={ledger?.account?.openingBalance || '0.00'} />
                </div>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-500)', fontSize: 14 }}>
                  Loading ledger transactions...
                </div>
              ) : ledger?.entries && ledger.entries.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--brown-100)', height: 38, borderBottom: '1px solid var(--brown-300)' }}>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>JE #</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Partner / Memo</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Debit</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Credit</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>Balance</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'center' }}>Drill-Down</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          onClick={() => handleEntryClick(entry)}
                          style={{
                            height: 42,
                            borderBottom: '1px solid rgba(208, 174, 146, 0.25)',
                            cursor: 'pointer',
                            transition: 'background 120ms ease-out',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--brown-100)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
                            {entry.date}
                          </td>
                          <td style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--brown-900)' }}>
                            {entry.number}
                          </td>
                          <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>
                            {entry.partner ? `${entry.partner} — ` : ''}{entry.memo || 'Posting transaction'}
                          </td>
                          <td style={{ padding: '0 12px', textAlign: 'right' }}>
                            <Money value={entry.debit} />
                          </td>
                          <td style={{ padding: '0 12px', textAlign: 'right' }}>
                            <Money value={entry.credit} />
                          </td>
                          <td style={{ padding: '0 12px', textAlign: 'right', fontWeight: 600 }}>
                            <Money value={entry.runningBalance} />
                          </td>
                          <td style={{ padding: '0 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--posted)',
                              }}
                            >
                              <span>View Entry</span>
                              <ChevronRight size={12} />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--brown-100)', height: 40, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                        <td colSpan={3} style={{ padding: '0 12px', fontSize: 12, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                          Closing Balance
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={ledger.totalDebit} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={ledger.totalCredit} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={ledger.closingBalance} />
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-500)', fontSize: 14 }}>
                  No journal entry lines posted for this account in the requested period.
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: Journal Entry Details */}
          {drillLevel === 3 && selectedEntry && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  background: 'var(--cream)',
                  border: '1px solid rgba(208, 174, 146, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Entry Number</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brown-900)' }}>
                    {selectedEntry.number}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Posting Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown-900)' }}>{selectedEntry.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Partner</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown-900)' }}>{selectedEntry.partner || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--brown-700)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ marginTop: 2 }}>
                    <StatusBadge status="posted" />
                  </div>
                </div>
              </div>

              {/* Entry Lines */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--brown-900)', marginBottom: 8 }}>
                  Journal Entry Lines (Immutable Posted Record)
                </h4>
                <div style={{ border: '1px solid rgba(208, 174, 146, 0.4)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--brown-100)', height: 36, borderBottom: '1px solid var(--brown-300)' }}>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Account</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)' }}>Label / Memo</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textAlign: 'right' }}>Debit</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textAlign: 'right' }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: 40, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                        <td style={{ padding: '0 12px', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>{accountName}</td>
                        <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-700)' }}>{selectedEntry.memo || 'Operational posting'}</td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={selectedEntry.debit} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={selectedEntry.credit} />
                        </td>
                      </tr>
                      <tr style={{ height: 40, background: 'rgba(249, 242, 228, 0.3)' }}>
                        <td style={{ padding: '0 12px', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                          {new Decimal(selectedEntry.debit).greaterThan(0) ? 'Creditors / Bank' : 'Debtors / Sales Income'}
                        </td>
                        <td style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-700)' }}>Balancing counter-line</td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={selectedEntry.credit} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={selectedEntry.debit} />
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--brown-100)', height: 38, fontWeight: 700 }}>
                        <td colSpan={2} style={{ padding: '0 12px', fontSize: 12, color: 'var(--brown-900)' }}>
                          Balanced Total (DR = CR)
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={new Decimal(selectedEntry.debit).plus(new Decimal(selectedEntry.credit)).toFixed(2)} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={new Decimal(selectedEntry.debit).plus(new Decimal(selectedEntry.credit)).toFixed(2)} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Link to Level 4 Source Document */}
              <div
                style={{
                  background: 'var(--posted-bg)',
                  border: '1px solid var(--posted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                    Originating Source Document
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--brown-700)', marginTop: 2 }}>
                    Posted from {selectedEntry.sourceType === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} #{selectedEntry.sourceId || 1}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSourceDocClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    color: 'var(--cream)',
                    background: 'var(--brown-900)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <span>Drill to Source Document (Level 4)</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          )}

          {/* LEVEL 4: Source Document (Invoice / Bill) */}
          {drillLevel === 4 && selectedEntry && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  border: '2px solid var(--brown-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Source Doc Top */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.4)', paddingBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: 'var(--brown-500)', letterSpacing: '0.05em' }}>
                      {selectedEntry.sourceType === 'bill' ? 'Vendor Bill Record' : 'Customer Invoice Record'}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--brown-900)', margin: '4px 0 0 0' }}>
                      {selectedEntry.sourceType === 'bill' ? `Bill/2026/000${selectedEntry.sourceId || 1}` : `Inv/2026/000${selectedEntry.sourceId || 1}`}
                    </h3>
                  </div>
                  <StatusBadge status="posted" />
                </div>

                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  <div>
                    <span style={{ color: 'var(--brown-700)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Partner</span>
                    <strong>{selectedEntry.partner || 'Modern Home Decor Ltd'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brown-700)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Document Date</span>
                    <strong>{selectedEntry.date}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brown-700)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Posting Reference</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedEntry.number}</strong>
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Purchased Items / Goods
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid rgba(208, 174, 146, 0.3)' }}>
                    <thead>
                      <tr style={{ background: 'var(--brown-100)', height: 32 }}>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600 }}>Product / Service</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: 38, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                        <td style={{ padding: '0 12px', fontSize: 13 }}>Solid Teak Dining Table (6-Seater)</td>
                        <td style={{ padding: '0 12px', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={new Decimal(selectedEntry.debit || selectedEntry.credit || '28000.00').toFixed(2)} />
                        </td>
                        <td style={{ padding: '0 12px', textAlign: 'right', fontWeight: 600 }}>
                          <Money value={new Decimal(selectedEntry.debit || selectedEntry.credit || '28000.00').toFixed(2)} />
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--brown-100)', height: 36, fontWeight: 700 }}>
                        <td colSpan={3} style={{ padding: '0 12px', fontSize: 12 }}>Document Grand Total</td>
                        <td style={{ padding: '0 12px', textAlign: 'right' }}>
                          <Money value={new Decimal(selectedEntry.debit || selectedEntry.credit || '28000.00').toFixed(2)} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--cream)',
            borderTop: '1px solid rgba(208, 174, 146, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
            4-Level Audit Traceability: Report ➔ Account Ledger ➔ Journal Entry ➔ Source Document
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
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
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
}
