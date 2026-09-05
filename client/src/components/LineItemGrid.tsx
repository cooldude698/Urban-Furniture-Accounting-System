import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Money } from './Money';
import { Product } from '@shared/schemas/product.schema';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';
import Decimal from 'decimal.js';

export interface EditableLineItem {
  id?: number;
  sr_no: number;
  product_id: number;
  analytic_account_id?: number | null;
  qty: number;
  unit_price: string;
  total?: string;
}

interface LineItemGridProps {
  lines: EditableLineItem[];
  onChange: (lines: EditableLineItem[]) => void;
  products: Product[];
  analytics: AnalyticAccount[];
  disabled?: boolean;
}

export const LineItemGrid: React.FC<LineItemGridProps> = ({
  lines,
  onChange,
  products,
  analytics,
  disabled = false,
}) => {
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    const unitPrice = product ? product.cost_price || product.sales_price : '0.00';
    const newLines = [...lines];
    const qty = newLines[index].qty || 1;
    const total = new Decimal(qty).times(new Decimal(unitPrice)).toFixed(2);

    newLines[index] = {
      ...newLines[index],
      product_id: productId,
      unit_price: unitPrice,
      total,
    };
    onChange(newLines);
  };

  const handleQtyChange = (index: number, qtyVal: number) => {
    const newLines = [...lines];
    const qty = Math.max(1, qtyVal || 1);
    const unitPrice = newLines[index].unit_price || '0.00';
    const total = new Decimal(qty).times(new Decimal(unitPrice)).toFixed(2);

    newLines[index] = {
      ...newLines[index],
      qty,
      total,
    };
    onChange(newLines);
  };

  const handlePriceChange = (index: number, priceStr: string) => {
    const newLines = [...lines];
    const qty = newLines[index].qty || 1;
    let total = '0.00';
    try {
      total = new Decimal(qty).times(new Decimal(priceStr || '0')).toFixed(2);
    } catch {
      total = '0.00';
    }

    newLines[index] = {
      ...newLines[index],
      unit_price: priceStr,
      total,
    };
    onChange(newLines);
  };

  const handleAnalyticChange = (index: number, analyticId: number | null) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      analytic_account_id: analyticId || null,
    };
    onChange(newLines);
  };

  const handleAddRow = () => {
    if (disabled || products.length === 0) return;
    const firstProduct = products[0];
    const unitPrice = firstProduct.cost_price || '0.00';
    const newRow: EditableLineItem = {
      sr_no: lines.length + 1,
      product_id: firstProduct.id!,
      analytic_account_id: null,
      qty: 1,
      unit_price: unitPrice,
      total: unitPrice,
    };
    onChange([...lines, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (disabled || lines.length <= 1) return;
    const updated = lines
      .filter((_, i) => i !== index)
      .map((row, idx) => ({ ...row, sr_no: idx + 1 }));
    onChange(updated);
  };

  const grandTotal = lines.reduce((acc, row) => {
    try {
      return acc.plus(new Decimal(row.total || '0'));
    } catch {
      return acc;
    }
  }, new Decimal('0')).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="border border-brown-200 rounded-xl overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brown-100/70 border-b border-brown-200 text-xs font-semibold text-brown-700 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">Sr</th>
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-3">Budget Analytics</th>
              <th className="py-2.5 px-3 w-24 text-right">Qty</th>
              <th className="py-2.5 px-3 w-36 text-right">Unit Price</th>
              <th className="py-2.5 px-3 w-36 text-right">Total</th>
              {!disabled && <th className="py-2.5 px-3 w-12 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-100 text-sm">
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-brown-50/50">
                <td className="py-2.5 px-3 text-center text-xs font-mono text-brown-400">
                  {line.sr_no}
                </td>
                <td className="py-2.5 px-3">
                  {disabled ? (
                    <span className="font-medium text-brown-900">
                      {products.find(p => p.id === line.product_id)?.name || 'Product'}
                    </span>
                  ) : (
                    <select
                      value={line.product_id}
                      onChange={e => handleProductChange(idx, parseInt(e.target.value, 10))}
                      className="w-full bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {disabled ? (
                    <span className="text-xs font-medium text-brown-700">
                      {analytics.find(a => a.id === line.analytic_account_id)?.name || '—'}
                    </span>
                  ) : (
                    <select
                      value={line.analytic_account_id || ''}
                      onChange={e => handleAnalyticChange(idx, e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="w-full bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                    >
                      <option value="">None (General)</option>
                      {analytics.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {disabled ? (
                    <span className="font-mono">{line.qty}</span>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={line.qty}
                      onChange={e => handleQtyChange(idx, parseInt(e.target.value, 10))}
                      className="w-20 bg-surface border border-brown-200 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                    />
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {disabled ? (
                    <Money amount={line.unit_price} />
                  ) : (
                    <input
                      type="text"
                      value={line.unit_price}
                      onChange={e => handlePriceChange(idx, e.target.value)}
                      className="w-28 bg-surface border border-brown-200 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                    />
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Money amount={line.total || '0.00'} className="font-semibold text-brown-900" />
                </td>
                {!disabled && (
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      className="text-brown-400 hover:text-danger disabled:opacity-30 p-1 rounded transition-colors"
                      title="Delete line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-brown-50/80 border-t-2 border-brown-200 font-bold text-brown-900">
              <td colSpan={disabled ? 4 : 5} className="py-3 px-4 text-right uppercase text-xs tracking-wider text-brown-700">
                Grand Total:
              </td>
              <td className="py-3 px-3 text-right">
                <Money amount={grandTotal} className="text-base font-bold text-brown-900" />
              </td>
              {!disabled && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brown-700 bg-brown-100 hover:bg-brown-200 px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item Line
        </button>
      )}
    </div>
  );
};
