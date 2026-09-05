import { useRef, useCallback, type KeyboardEvent } from 'react';
import Decimal from 'decimal.js';

export interface GridColumn {
  key: string;
  label: string;
  type: 'text' | 'money' | 'number' | 'select' | 'readonly';
  options?: { value: string; label: string }[];
  width?: string | number;
}

export type GridRow = Record<string, string>;

interface LineItemGridProps {
  columns: GridColumn[];
  rows: GridRow[];
  onChange: (rows: GridRow[]) => void;
  readOnly?: boolean;
  /** keys of qty and unitPrice columns for auto-computing row total */
  qtyKey?: string;
  unitPriceKey?: string;
  totalKey?: string;
}

function newEmptyRow(columns: GridColumn[]): GridRow {
  const row: GridRow = {};
  columns.forEach(c => { row[c.key] = ''; });
  return row;
}

/**
 * LineItemGrid — editable grid for purchase/sales line items.
 *
 * - Add row button below, remove (×) per row
 * - If qtyKey + unitPriceKey provided: totalKey auto-computed with decimal.js
 * - Tab moves to next cell, Enter adds a new row
 * - Money inputs: type="text", right-aligned mono
 * - NEVER parseFloat — decimal.js only
 * - Cell borders: 1px solid var(--brown-300)
 * - Totals row: sticky, brown-100, bold
 */
export default function LineItemGrid({
  columns,
  rows,
  onChange,
  readOnly = false,
  qtyKey,
  unitPriceKey,
  totalKey,
}: LineItemGridProps) {
  const gridRef = useRef<HTMLTableElement>(null);

  /* ── Row total computation ── */
  function computeRowTotal(row: GridRow): GridRow {
    if (!qtyKey || !unitPriceKey || !totalKey) return row;
    try {
      const qty = new Decimal(row[qtyKey] || '0');
      const price = new Decimal(row[unitPriceKey] || '0');
      return { ...row, [totalKey]: qty.mul(price).toFixed(2) };
    } catch {
      return { ...row, [totalKey]: '0.00' };
    }
  }

  /* ── Column totals ── */
  function columnTotal(key: string): string {
    try {
      return rows
        .reduce((acc, row) => acc.plus(new Decimal(row[key] || '0')), new Decimal('0'))
        .toFixed(2);
    } catch {
      return '0.00';
    }
  }

  /* ── Cell change ── */
  const handleCellChange = useCallback(
    (rowIdx: number, key: string, value: string) => {
      const updated = rows.map((r, i) => {
        if (i !== rowIdx) return r;
        const next = { ...r, [key]: value };
        return computeRowTotal(next);
      });
      onChange(updated);
    },
    [rows, onChange],
  );

  /* ── Add / remove row ── */
  const addRow = () => onChange([...rows, computeRowTotal(newEmptyRow(columns))]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  /* ── Keyboard: Tab → next cell, Enter → new row ── */
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    colIdx: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx === rows.length - 1) addRow();
      // Focus first cell of next row
      setTimeout(() => {
        const inputs = gridRef.current?.querySelectorAll<HTMLElement>(
          `[data-row="${rowIdx + 1}"][data-col="0"]`,
        );
        inputs?.[0]?.focus();
      }, 50);
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      // Natural tab handled by browser; let it flow
    }
  };

  const isMoneyOrNumber = (col: GridColumn) =>
    col.type === 'money' || col.type === 'number';

  return (
    <div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)' }}>
        <table
          ref={gridRef}
          style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          {/* Header */}
          <thead>
            <tr style={{ background: 'var(--brown-100)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    padding: '8px 10px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--brown-700)',
                    textAlign: isMoneyOrNumber(col) ? 'right' : 'left',
                    borderBottom: '1px solid var(--brown-300)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
              {!readOnly && (
                <th
                  style={{
                    width: 36,
                    borderBottom: '1px solid var(--brown-300)',
                    background: 'var(--brown-100)',
                  }}
                />
              )}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{ borderBottom: '1px solid var(--brown-300)' }}
              >
                {columns.map((col, colIdx) => {
                  const isReadonly = col.type === 'readonly' || readOnly;
                  const isMoney = isMoneyOrNumber(col);

                  return (
                    <td
                      key={col.key}
                      style={{ borderRight: '1px solid var(--brown-300)', padding: 0 }}
                    >
                      {col.type === 'select' && !readOnly ? (
                        <select
                          value={row[col.key] ?? ''}
                          onChange={e => handleCellChange(rowIdx, col.key, e.target.value)}
                          onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                          data-row={rowIdx}
                          data-col={colIdx}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 8px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 13,
                            color: 'var(--brown-900)',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">—</option>
                          {col.options?.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[col.key] ?? ''}
                          onChange={e => {
                            if (!isReadonly) handleCellChange(rowIdx, col.key, e.target.value);
                          }}
                          onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                          readOnly={isReadonly}
                          data-row={rowIdx}
                          data-col={colIdx}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 10px',
                            fontFamily: isMoney ? 'var(--font-mono)' : 'var(--font-body)',
                            fontVariantNumeric: isMoney ? 'tabular-nums' : undefined,
                            fontSize: 13,
                            color: 'var(--brown-900)',
                            background: isReadonly ? 'rgba(235,215,190,0.25)' : 'transparent',
                            border: 'none',
                            outline: 'none',
                            textAlign: isMoney ? 'right' : 'left',
                            cursor: isReadonly ? 'default' : 'text',
                          }}
                        />
                      )}
                    </td>
                  );
                })}
                {!readOnly && (
                  <td style={{ textAlign: 'center', padding: '0 4px' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      aria-label="Remove row"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--brown-500)',
                        fontSize: 16,
                        padding: '4px',
                        lineHeight: 1,
                        borderRadius: 4,
                      }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--danger)')}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--brown-500)')}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          {/* Totals row */}
          <tfoot>
            <tr style={{ background: 'var(--brown-100)', borderTop: '2px solid var(--brown-300)' }}>
              {columns.map((col, i) => {
                const isMoney = isMoneyOrNumber(col);
                return (
                  <td
                    key={col.key}
                    style={{
                      padding: '8px 10px',
                      fontFamily: isMoney ? 'var(--font-mono)' : 'var(--font-body)',
                      fontVariantNumeric: isMoney ? 'tabular-nums' : undefined,
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--brown-900)',
                      textAlign: isMoney ? 'right' : 'left',
                    }}
                  >
                    {i === 0 ? 'Total' : isMoney ? columnTotal(col.key) : ''}
                  </td>
                );
              })}
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add row */}
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--brown-700)',
            background: 'none',
            border: '1px dashed var(--brown-300)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + Add line
        </button>
      )}
    </div>
  );
}
