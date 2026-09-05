import React from 'react';
import Decimal from 'decimal.js';
import { calculateLineTax } from '../../../shared/schemas/money';

export interface GridLine {
  productId: number;
  analyticAccountId: number | null;
  qty: string;
  unitPrice: string;
  taxRate: string;
  taxAmount?: string;
  subtotal?: string;
  total?: string;
}

interface LineItemGridProps {
  lines: GridLine[];
  products: Array<{ id: number; name: string; sku: string; sales_price: string; tax_rate: string }>;
  analytics: Array<{ id: number; name: string }>;
  onChange: (lines: GridLine[]) => void;
  disabled?: boolean;
}

export const LineItemGrid: React.FC<LineItemGridProps> = ({
  lines,
  products,
  analytics,
  onChange,
  disabled = false,
}) => {
  const handleLineChange = (index: number, field: keyof GridLine, value: any) => {
    const updated = [...lines];
    const current = { ...updated[index], [field]: value };

    // If product changed, update default unitPrice & taxRate
    if (field === 'productId') {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        current.unitPrice = String(prod.sales_price || '0.00');
        current.taxRate = String(prod.tax_rate || '18.00');
      }
    }

    // Recalculate line totals
    const calcs = calculateLineTax(current.qty || '1', current.unitPrice || '0.00', current.taxRate || '18.00');
    current.subtotal = calcs.subtotal;
    current.taxAmount = calcs.taxAmount;
    current.total = calcs.total;

    updated[index] = current;
    onChange(updated);
  };

  const addRow = () => {
    if (disabled) return;
    const defaultProduct = products[0];
    const unitPrice = defaultProduct ? String(defaultProduct.sales_price) : '0.00';
    const taxRate = defaultProduct ? String(defaultProduct.tax_rate) : '18.00';
    const calcs = calculateLineTax('1', unitPrice, taxRate);

    onChange([
      ...lines,
      {
        productId: defaultProduct ? defaultProduct.id : 0,
        analyticAccountId: null,
        qty: '1',
        unitPrice,
        taxRate,
        taxAmount: calcs.taxAmount,
        subtotal: calcs.subtotal,
        total: calcs.total,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (disabled || lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  // Compute footer totals
  let totalSub = new Decimal(0);
  let totalTax = new Decimal(0);
  lines.forEach(line => {
    const calcs = calculateLineTax(line.qty || '0', line.unitPrice || '0', line.taxRate || '0');
    totalSub = totalSub.plus(new Decimal(calcs.subtotal));
    totalTax = totalTax.plus(new Decimal(calcs.taxAmount));
  });
  const grandTotal = totalSub.plus(totalTax);

  return (
    <div className="w-full bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-brown-100/70 border-b border-brown-300 text-brown-900 font-semibold">
              <th className="p-3 w-12 text-center">Sr</th>
              <th className="p-3 min-w-[220px]">Product</th>
              <th className="p-3 min-w-[180px]">Budget Analytics</th>
              <th className="p-3 w-24 text-right">Qty</th>
              <th className="p-3 w-32 text-right">Unit Price</th>
              <th className="p-3 w-24 text-right">Tax (%)</th>
              <th className="p-3 w-36 text-right font-mono-num">Total</th>
              {!disabled && <th className="p-3 w-12 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-100">
            {lines.map((line, idx) => {
              const calcs = calculateLineTax(line.qty || '0', line.unitPrice || '0', line.taxRate || '0');
              return (
                <tr key={idx} className="hover:bg-cream/40 transition-colors">
                  <td className="p-3 text-center text-brown-500 font-mono text-xs">{idx + 1}</td>
                  
                  {/* Product */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={line.productId}
                      onChange={e => handleLineChange(idx, 'productId', Number(e.target.value))}
                      className="w-full bg-surface border border-brown-300/80 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    >
                      <option value={0} disabled>Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Budget Analytics */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={line.analyticAccountId || ''}
                      onChange={e => handleLineChange(idx, 'analyticAccountId', e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-surface border border-brown-300/80 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    >
                      <option value="">No Cost Center</option>
                      {analytics.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Qty */}
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      disabled={disabled}
                      value={line.qty}
                      onChange={e => handleLineChange(idx, 'qty', e.target.value)}
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                      value={line.unitPrice}
                      onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)}
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    />
                  </td>

                  {/* Tax Rate */}
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      disabled={disabled}
                      value={line.taxRate}
                      onChange={e => handleLineChange(idx, 'taxRate', e.target.value)}
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="p-3 text-right font-mono-num font-semibold text-brown-900">
                    ₹{calcs.total}
                  </td>

                  {/* Delete row */}
                  {!disabled && (
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={lines.length <= 1}
                        className="text-brown-500 hover:text-danger disabled:opacity-30 px-1 py-0.5 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-brown-100/30 border-t border-brown-300 flex flex-col md:flex-row items-center justify-between gap-4">
        {!disabled && (
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-semibold text-brown-700 hover:text-brown-900 px-3 py-1.5 rounded border border-dashed border-brown-300 hover:border-brown-700 bg-surface transition-colors"
          >
            + Add Line Item
          </button>
        )}

        <div className="ml-auto w-full md:w-80 space-y-2 text-sm bg-surface p-3.5 rounded-[8px] border border-brown-300/70 shadow-sm">
          <div className="flex justify-between text-brown-700">
            <span>Subtotal:</span>
            <span className="font-mono-num font-medium">₹{totalSub.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-brown-700">
            <span>Taxes (GST):</span>
            <span className="font-mono-num font-medium">₹{totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-brown-900 border-t border-brown-300 pt-2">
            <span>Grand Total:</span>
            <span className="font-mono-num text-brown-900">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
