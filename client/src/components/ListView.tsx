import React, { useState } from 'react';
import { Search, Plus, Archive, Filter } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface ListViewProps<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onNew?: () => void;
  includeArchived: boolean;
  onToggleArchived: (val: boolean) => void;
  filterSlot?: React.ReactNode;
  extraControls?: React.ReactNode;
  searchPlaceholder?: string;
}

export function ListView<T extends { id?: number; is_archived?: boolean }>({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  onRowClick,
  onNew,
  includeArchived,
  onToggleArchived,
  filterSlot,
  extraControls,
  searchPlaceholder = 'Search records...',
}: ListViewProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const values = Object.values(item as any).join(' ').toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-cream p-6 max-w-7xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b border-brown-200">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brown-900">{title}</h1>
          {subtitle && <p className="text-sm text-brown-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {extraControls}
          {onNew && (
            <button
              onClick={onNew}
              className="inline-flex items-center gap-2 bg-brown-700 hover:bg-brown-800 text-cream px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Filter and search row */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {filterSlot}

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-brown-700 bg-surface px-3 py-2 rounded-lg border border-brown-200 hover:bg-brown-50">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => onToggleArchived(e.target.checked)}
              className="rounded text-brown-700 focus:ring-brown-500 w-4 h-4"
            />
            <Archive className="w-4 h-4 text-brown-500" />
            <span>Show Archived</span>
          </label>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-surface rounded-xl border border-brown-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brown-100/70 border-b border-brown-200 text-xs font-semibold text-brown-700 uppercase tracking-wider">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-brown-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-brown-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr
                    key={(row as any).id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-brown-50/80 transition-colors h-[44px] cursor-pointer ${
                      row.is_archived ? 'opacity-60 bg-gray-50/50' : ''
                    }`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`py-2.5 px-4 ${
                          col.align === 'right'
                            ? 'text-right font-mono tabular-nums'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
