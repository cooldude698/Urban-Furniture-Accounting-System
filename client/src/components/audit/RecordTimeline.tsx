import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { AuditApi, AuditRow } from '../../api/audit.api';
import { actionMeta, clockTime, relativeTime } from '../../lib/audit';

/** Friendly recordType -> audit_log.table_name */
const TYPE_TO_TABLE: Record<string, string> = {
  contact: 'contacts',
  product: 'products',
  account: 'accounts',
  journal: 'journals',
  analytic: 'analytic_accounts',
  analytic_account: 'analytic_accounts',
  po: 'purchase_orders',
  purchase_order: 'purchase_orders',
  bill: 'vendor_bills',
  vendor_bill: 'vendor_bills',
  so: 'sales_orders',
  sales_order: 'sales_orders',
  invoice: 'customer_invoices',
  customer_invoice: 'customer_invoices',
  payment: 'payments',
  budget: 'budgets',
  journal_entry: 'journal_entries',
  je: 'journal_entries',
};

const RELATED_DOC = (row: AuditRow): { label: string; href?: string } | null => {
  const d = (row.after_data ?? {}) as Record<string, any>;
  if (row.table_name === 'payments' && d.number) return { label: String(d.number) };
  if (d.journalEntryId) return { label: `JE #${d.journalEntryId}`, href: `/account/journal-entries/${d.journalEntryId}` };
  if (d.revisedId) return { label: `→ Budget #${d.revisedId}`, href: `/account/budgets/${d.revisedId}` };
  if (d.number) return { label: String(d.number) };
  return null;
};

export default function RecordTimeline({
  recordType,
  recordId,
  compact = false,
}: {
  recordType: string;
  recordId?: number | string;
  compact?: boolean;
}) {
  const table = TYPE_TO_TABLE[recordType] ?? recordType;
  const id = typeof recordId === 'string' ? parseInt(recordId, 10) : recordId;
  const enabled = Boolean(id && !Number.isNaN(id));

  const { data, isLoading } = useQuery<AuditRow[]>({
    queryKey: ['audit-timeline', table, id],
    queryFn: () => AuditApi.recordTimeline(table, id as number),
    enabled,
    refetchOnWindowFocus: false,
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  void now;

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--brown-300)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '12px 14px' : '16px 18px',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <History size={15} color="var(--brown-700)" />
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--brown-900)',
          }}
        >
          History
        </h3>
      </header>

      {!enabled || (data && data.length === 0) ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--brown-700)' }}>No activity recorded yet.</p>
      ) : isLoading ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--brown-700)' }}>Loading…</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
          {(data ?? []).map((row, i) => {
            const meta = actionMeta(row.action);
            const Icon = meta.icon;
            const rel = RELATED_DOC(row);
            const last = i === (data?.length ?? 0) - 1;
            return (
              <li key={row.id} style={{ display: 'flex', gap: 12, paddingBottom: last ? 0 : 16, position: 'relative' }}>
                {/* rail */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--cream)',
                      border: `1px solid ${meta.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={13} color={meta.color} />
                  </span>
                  {!last && <span style={{ flex: 1, width: 1, background: 'var(--brown-300)', marginTop: 2 }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: 'var(--brown-900)' }}>{meta.label}</strong>
                    <span style={{ fontSize: 13, color: 'var(--brown-900)' }}>
                      {row.user_name || row.user_login || 'System'}
                    </span>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brown-700)' }}
                      title={new Date(row.created_at).toLocaleString()}
                    >
                      {clockTime(row.created_at)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--brown-700)' }}>· {relativeTime(row.created_at)}</span>
                    {rel &&
                      (rel.href ? (
                        <a
                          href={rel.href}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brown-700)', textDecoration: 'underline' }}
                        >
                          {rel.label}
                        </a>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brown-700)' }}>{rel.label}</span>
                      ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
