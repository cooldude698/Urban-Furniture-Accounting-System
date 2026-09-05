import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { ListView } from '../../components/ui/ListView';
import type { ListColumn } from '../../components/ui/ListView';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatINRCompact, formatINR } from '../../lib/money';

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
];

/* ── main component ─────────────────────────────────────────────────────── */
export const PortalInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<PortalInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/portal/invoices')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setInvoices(json.data);
        } else if (json.error) {
          setError(json.error.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
          View, inspect, and settle all invoices billed to your account
        </p>
      </div>

      {/* ── Error ── */}
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
