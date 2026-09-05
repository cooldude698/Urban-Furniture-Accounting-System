import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { ListView } from '../../components/ui/ListView';
import type { ListColumn } from '../../components/ui/ListView';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatINRCompact, formatINR } from '../../lib/money';
import { loadRazorpayScript } from '../../lib/razorpay';
import api from '../../lib/axios';

export interface PortalInvoiceListItem {
  id: number;
  number: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
}

/* ── KPI summary card ─────────────────────────────────────────────────── */
interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  accent?: string; /* var(--token) for the value text */
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

/* ── main component ─────────────────────────────────────────────────────── */
export const PortalInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<PortalInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    api.get('/api/portal/invoices')
      .then(res => {
        if (res.data?.data) {
          setInvoices(res.data.data);
        } else if (res.data?.error) {
          setError(res.data.error.message);
        }
      })
      .catch(err => setError(err?.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleInitiateRazorpay = async (row: PortalInvoiceListItem) => {
    setPayingId(row.id);
    setActionError(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load Razorpay Payment Gateway SDK');
      }

      const orderRes = await api.post(`/api/portal/invoices/${row.id}/razorpay/create-order`, {
        amount: new Decimal(row.amountDue).toFixed(2),
      });
      const order = orderRes.data?.data;
      if (!order) {
        throw new Error(orderRes.data?.error?.message || 'Failed to create Razorpay payment order');
      }

      const rzpKey = (window as any).__VITE_RAZORPAY_KEY_ID__ || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TYL9FJAZxMYoFc';

      const orderId = order.orderId || order.id;

      const rzp = new (window as any).Razorpay({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Urban Furniture',
        description: `Payment for Invoice ${row.number}`,
        order_id: orderId,
        theme: { color: '#77574A' },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post(`/api/portal/invoices/${row.id}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: new Decimal(row.amountDue).toFixed(2),
            });
            if (verifyRes.data?.error) {
              throw new Error(verifyRes.data.error.message || 'Payment signature verification failed');
            }

            setSuccessNotice(`Payment ${response.razorpay_payment_id} verified & posted to General Ledger! PDF receipt dispatched.`);
            fetchInvoices();
          } catch (vErr: any) {
            setActionError(vErr?.response?.data?.error?.message || vErr.message || 'Signature verification failed');
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingId(null);
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setActionError(err.message || 'Razorpay initialization failed');
      setPayingId(null);
    }
  };

  /* ── column definition ─────────────────────────────────────────────────── */
  const columns: ListColumn<PortalInvoiceListItem>[] = [
    {
      key: 'number',
      label: 'Invoice #',
      type: 'text',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
          {row.number}
        </span>
      ),
    },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      type: 'date',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      type: 'text',
      render: (row) => (
        <StatusBadge
          status={
            row.paymentStatus === 'paid'
              ? 'paid'
              : row.paymentStatus === 'partial'
                ? 'partial'
                : 'not_paid'
          }
        />
      ),
    },
    {
      key: 'total',
      label: 'Total',
      type: 'money',
      align: 'right',
    },
    {
      key: 'amountPaid',
      label: 'Paid',
      type: 'money',
      align: 'right',
      render: (row) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 13,
            color: 'var(--posted)',
          }}
        >
          {formatINR(row.amountPaid)}
        </span>
      ),
    },
    {
      key: 'amountDue',
      label: 'Outstanding',
      type: 'money',
      align: 'right',
      render: (row) => {
        const due = new Decimal(row.amountDue || '0');
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 13,
              fontWeight: due.gt(0) ? 700 : 400,
              color: due.gt(0) ? 'var(--danger)' : 'var(--brown-500)',
            }}
          >
            {formatINR(row.amountDue)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions & Settle',
      type: 'text',
      align: 'right',
      render: (row) => {
        const due = new Decimal(row.amountDue || '0');
        const isPaying = payingId === row.id;
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'flex-end',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {due.gt(0) ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInitiateRazorpay(row);
                }}
                disabled={isPaying}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: '#77574A',
                  color: '#FBF9F5',
                  border: 'none',
                  cursor: isPaying ? 'wait' : 'pointer',
                  opacity: isPaying ? 0.7 : 1,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 120ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isPaying) e.currentTarget.style.backgroundColor = '#5c4033';
                }}
                onMouseLeave={(e) => {
                  if (!isPaying) e.currentTarget.style.backgroundColor = '#77574A';
                }}
                title={`Pay ${formatINR(row.amountDue)} instantly via Razorpay Online`}
              >
                <span>⚡</span>
                <span>{isPaying ? 'Processing…' : 'Pay via Razorpay'}</span>
              </button>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--posted)',
                  backgroundColor: 'rgba(56, 102, 65, 0.10)',
                  border: '1px solid rgba(56, 102, 65, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>✓</span> Settled
              </span>
            )}

            <a
              href={`/api/portal/invoices/${row.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'var(--surface)',
                color: 'var(--brown-800)',
                border: '1px solid rgba(208, 174, 146, 0.60)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
              title="Download official PDF invoice"
            >
              <span>📄</span>
              <span>PDF</span>
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/portal/invoices/${row.id}`);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'transparent',
                color: 'var(--brown-700)',
                border: '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              Details →
            </button>
          </div>
        );
      },
    },
  ];

  /* ── derived KPIs ── */
  const totalCount = invoices.length;

  const amountOutstanding = invoices
    .filter(i => i.paymentStatus !== 'paid')
    .reduce((acc, i) => acc.plus(new Decimal(i.amountDue || '0')), new Decimal(0))
    .toFixed(2);

  const amountPaidTotal = invoices
    .reduce((acc, i) => acc.plus(new Decimal(i.amountPaid || '0')), new Decimal(0))
    .toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'var(--font-body)' }}>

      {/* ── Page heading ── */}
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
          Your Invoices
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--brown-600)', marginTop: '4px' }}>
          View, inspect, and settle all invoices billed to your account with instant Razorpay online checkout
        </p>
      </div>

      {/* ── Success Banner ── */}
      {successNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(56, 102, 65, 0.12)',
            border: '1px solid var(--posted)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--posted)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✅ {successNotice}</span>
          <button
            onClick={() => setSuccessNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--posted)',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Action Error ── */}
      {actionError && (
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {actionError}</span>
          <button
            onClick={() => setActionError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--danger)',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Fetch Error ── */}
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

      {/* ── Three summary KPI cards ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SummaryCard
          label="Total Invoices"
          value={String(totalCount)}
          subtext={loading ? 'Loading…' : totalCount === 1 ? '1 invoice on record' : `${totalCount} invoices on record`}
        />
        <SummaryCard
          label="Amount Outstanding"
          value={loading ? '—' : formatINRCompact(amountOutstanding)}
          subtext={loading ? undefined : `Full: ${formatINR(amountOutstanding)}`}
          accent="var(--danger)"
        />
        <SummaryCard
          label="Amount Paid"
          value={loading ? '—' : formatINRCompact(amountPaidTotal)}
          subtext={loading ? undefined : `Full: ${formatINR(amountPaidTotal)}`}
          accent="var(--posted)"
        />
      </div>

      {/* ── Invoice table via ListView ── */}
      <ListView<PortalInvoiceListItem>
        columns={columns}
        data={invoices}
        loading={loading}
        rowKey="id"
        searchable
        searchPlaceholder="Search by invoice #, date…"
        emptyText="No invoices recorded for your account."
        onRowClick={row => navigate(`/portal/invoices/${row.id}`)}
      />
    </div>
  );
};

export default PortalInvoiceList;

