import { type ReactNode, useState } from 'react';
import Money from './Money';
import StatusBadge from './StatusBadge';

type ColumnType = 'text' | 'money' | 'badge' | 'date';

export interface ListColumn<T> {
  label: string;
  key: keyof T;
  type?: ColumnType;
  width?: string | number;
}

interface ListViewProps<T extends Record<string, unknown>> {
  columns: ListColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  filterSlot?: ReactNode;
  /** Key to use for row identity (defaults to 'id') */
  rowKey?: keyof T;
  loading?: boolean;
  emptyText?: string;
}

function formatDate(val: unknown): string {
  if (!val) return '—';
  const d = new Date(String(val));
  return isNaN(d.getTime())
    ? String(val)
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderCell<T extends Record<string, unknown>>(
  col: ListColumn<T>,
  row: T,
): ReactNode {
  const val = row[col.key];
  switch (col.type) {
    case 'money':
      return <Money value={String(val ?? '0.00')} />;
    case 'badge':
      return <StatusBadge status={val as Parameters<typeof StatusBadge>[0]['status']} />;
    case 'date':
      return formatDate(val);
    default:
      return val == null ? '—' : String(val);
  }
}

/**
 * Generic list / table view.
 * - Header row: --brown-100 background
 * - Row height: 44px, full row clickable
 * - Row hover: --brown-100
 * - Money columns: mono, right-aligned, tabular-nums
 * - Search box top-right (searches all text-type columns)
 */
export default function ListView<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  searchable = false,
  filterSlot,
  rowKey = 'id' as keyof T,
  loading = false,
  emptyText = 'No records found.',
}: ListViewProps<T>) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? data.filter(row =>
        columns
          .filter(c => !c.type || c.type === 'text' || c.type === 'date')
          .some(c => String(row[c.key] ?? '').toLowerCase().includes(query.toLowerCase())),
      )
    : data;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Toolbar */}
      {(searchable || filterSlot) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(208,174,146,0.4)',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filterSlot}
          </div>
          {searchable && (
            <input
              type="search"
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '6px 12px',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                color: 'var(--brown-900)',
                outline: 'none',
                width: 220,
              }}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--brown-100)' }}>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={{
                    width: col.width,
                    padding: '0 16px',
                    height: 40,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--brown-700)',
                    textAlign: col.type === 'money' ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid rgba(208,174,146,0.4)',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height: 44,
                    textAlign: 'center',
                    color: 'var(--brown-500)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    padding: '0 16px',
                  }}
                >
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height: 44,
                    textAlign: 'center',
                    color: 'var(--brown-500)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    padding: '0 16px',
                  }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={String(row[rowKey] ?? i)}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    height: 44,
                    cursor: onRowClick ? 'pointer' : 'default',
                    background: 'var(--surface)',
                    transition: 'background 100ms ease-out',
                    borderBottom: '1px solid rgba(208,174,146,0.25)',
                  }}
                  onMouseEnter={e => {
                    if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brown-100)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface)';
                  }}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      style={{
                        padding: '0 16px',
                        fontFamily: col.type === 'money' ? 'var(--font-mono)' : 'var(--font-body)',
                        fontVariantNumeric: col.type === 'money' ? 'tabular-nums' : undefined,
                        fontSize: 13,
                        color: 'var(--brown-900)',
                        textAlign: col.type === 'money' ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {renderCell(col, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
