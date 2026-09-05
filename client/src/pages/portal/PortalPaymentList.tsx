import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Decimal from 'decimal.js';
import { formatINRCompact, formatINR } from '../../lib/money';
import api from '../../lib/axios';

export interface PaymentAllocationItem {
  allocationId: number;
  invoiceId: number | null;
  invoiceNumber: string | null;
  billId: number | null;
  billNumber: string | null;
  amount: string;
}

export interface PortalPaymentListItem {
  id: number;
  number: string;
  paymentDate: string;
  method: 'cash' | 'bank';
  direction: 'inbound' | 'outbound';
  amount: string;
  createdAt: string;
  allocations: PaymentAllocationItem[];
}

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  accent?: string;
}

function SummaryCard({ label, value, subtext, accent }: SummaryCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(208, 174, 146, 0.40)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px 24px',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--brown-600)',
          margin: '0 0 8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '24px',
          fontWeight: 600,
          color: accent ?? 'var(--brown-900)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      {subtext && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--brown-500)',
            marginTop: '4px',
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}

export const PortalPaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PortalPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/api/portal/payments')
      .then(res => {
        if (res.data?.data) {
          setPayments(res.data.data);
        } else if (res.data?.error) {
          setError(res.data.error.message);
        }
      })
      .catch(err => setError(err?.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = payments.length;

  const totalSettled = payments
    .reduce((acc, p) => acc.plus(new Decimal(p.amount || '0')), new Decimal(0))
    .toFixed(2);

  const latestPayment = payments.length > 0 ? payments[0].paymentDate : '—';

  const filteredPayments = payments.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesNumber = p.number.toLowerCase().includes(q);
    const matchesMethod = p.method.toLowerCase().includes(q);
    const matchesDate = p.paymentDate.toLowerCase().includes(q);
    const matchesAlloc = p.allocations.some(a => 
      (a.invoiceNumber && a.invoiceNumber.toLowerCase().includes(q)) ||
      (a.billNumber && a.billNumber.toLowerCase().includes(q))
    );
    return matchesNumber || matchesMethod || matchesDate || matchesAlloc;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'var(--font-body)' }}>
      {/* ── Page heading ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              color: 'var(--brown-900)',
              margin: 0,
            }}
          >
            Payment History & Logs
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--brown-600)', marginTop: '4px' }}>
            Real-time audit log of all payments reconciled against your invoices and posted to the General Ledger
          </p>
        </div>
        <Link
          to="/portal/invoices"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#77574A',
            color: '#FBF9F5',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5c4033')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#77574A')}
        >
          <span>⚡</span>
          <span>View Invoices & Pay Online</span>
        </Link>
      </div>

      {/* ── Error notification ── */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Summary KPI cards ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SummaryCard
          label="Total Payments Recorded"
          value={String(totalCount)}
          subtext={loading ? 'Loading…' : `${totalCount} verified ledger transactions`}
        />
        <SummaryCard
          label="Total Settled Amount"
          value={loading ? '—' : formatINRCompact(totalSettled)}
          subtext={loading ? undefined : `Full: ${formatINR(totalSettled)}`}
          accent="var(--posted)"
        />
        <SummaryCard
          label="Latest Transaction"
          value={loading ? '—' : latestPayment}
          subtext={loading ? undefined : 'Most recent ledger receipt'}
        />
      </div>

      {/* ── Search & Filter bar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(208, 174, 146, 0.40)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ position: 'relative', flex: '1', maxWidth: '380px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by payment #, invoice #, date, method…"
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              border: '1px solid rgba(208, 174, 146, 0.60)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--cream)',
              color: 'var(--brown-900)',
              outline: 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              opacity: 0.5,
            }}
          >
            🔍
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--brown-600)', fontFamily: 'var(--font-mono)' }}>
          Showing {filteredPayments.length} of {payments.length} payments
        </span>
      </div>

      {/* ── Payment table ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(208, 174, 146, 0.40)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--brown-100)',
                  borderBottom: '1px solid rgba(208, 174, 146, 0.60)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--brown-800)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <th style={{ padding: '12px 16px' }}>Payment #</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Method</th>
                <th style={{ padding: '12px 16px' }}>Allocated Documents</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ledger Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--brown-600)', fontStyle: 'italic' }}>
                    Loading payment transaction logs…
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--brown-600)' }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>No payment records found.</p>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--brown-500)' }}>
                      When you settle an invoice via Razorpay or Bank Transfer, the transaction logs will automatically appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => {
                  const isBank = payment.method === 'bank';
                  return (
                    <tr
                      key={payment.id}
                      style={{
                        borderBottom: '1px solid rgba(208, 174, 146, 0.25)',
                        transition: 'background 100ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(208, 174, 146, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Payment Number */}
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brown-900)' }}>
                        {payment.number}
                      </td>

                      {/* Payment Date */}
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brown-700)' }}>
                        {payment.paymentDate}
                      </td>

                      {/* Method Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            backgroundColor: isBank ? 'rgba(56, 102, 65, 0.12)' : 'rgba(208, 174, 146, 0.30)',
                            color: isBank ? 'var(--posted)' : 'var(--brown-800)',
                            border: `1px solid ${isBank ? 'rgba(56, 102, 65, 0.30)' : 'rgba(208, 174, 146, 0.60)'}`,
                          }}
                        >
                          <span>{isBank ? '⚡' : '💵'}</span>
                          <span>{isBank ? 'Razorpay / Bank' : 'Cash'}</span>
                        </span>
                      </td>

                      {/* Allocations */}
                      <td style={{ padding: '12px 16px' }}>
                        {payment.allocations.length === 0 ? (
                          <span style={{ color: 'var(--brown-400)', fontSize: '12px' }}>Unallocated</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {payment.allocations.map(alloc => (
                              <span
                                key={alloc.allocationId}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--cream)',
                                  border: '1px solid rgba(208, 174, 146, 0.50)',
                                  fontSize: '12px',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {alloc.invoiceId ? (
                                  <Link
                                    to={`/portal/invoices/${alloc.invoiceId}`}
                                    style={{
                                      color: 'var(--brown-900)',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                                  >
                                    {alloc.invoiceNumber || `Inv #${alloc.invoiceId}`}
                                  </Link>
                                ) : (
                                  <span style={{ color: 'var(--brown-700)' }}>
                                    {alloc.billNumber || `Bill #${alloc.billId}`}
                                  </span>
                                )}
                                <span style={{ color: 'var(--brown-500)', fontSize: '11px' }}>
                                  ({formatINR(alloc.amount)})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'var(--posted)',
                        }}
                      >
                        {formatINR(payment.amount)}
                      </td>

                      {/* Ledger Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(56, 102, 65, 0.10)',
                            color: 'var(--posted)',
                            border: '1px solid rgba(56, 102, 65, 0.25)',
                          }}
                        >
                          <span>✓</span>
                          <span>Posted & Reconciled</span>
                        </span>
                      </td>

                      {/* Action / Receipt */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {payment.allocations[0]?.invoiceId ? (
                          <a
                            href={`/api/portal/invoices/${payment.allocations[0].invoiceId}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '4px',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--brown-800)',
                              border: '1px solid rgba(208, 174, 146, 0.60)',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              transition: 'background 120ms ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-100)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                            title="Download invoice receipt PDF"
                          >
                            <span>📄</span>
                            <span>Receipt PDF</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--brown-400)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortalPaymentList;
