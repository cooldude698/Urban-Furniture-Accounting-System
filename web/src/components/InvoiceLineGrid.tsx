import React from 'react';
import { calculateLineTax } from '../../../shared/schemas/money';

export interface InvoiceGridLine {
  productId: number;
  accountId: number;
  analyticAccountId: number | null;
  qty: string;
  unitPrice: string;
  taxRate: string;
  subtotal?: string;
  taxAmount?: string;
  total?: string;
}

interface InvoiceLineGridProps {
  lines: InvoiceGridLine[];
  products: Array<{ id: number; name: string; sku: string; sales_price: string; tax_rate: string }>;
  accounts: Array<{ id: number; name: string; type: string }>;
  analytics: Array<{ id: number; name: string }>;
  onChange: (lines: InvoiceGridLine[]) => void;
  disabled?: boolean;
}

export const InvoiceLineGrid: React.FC<InvoiceLineGridProps> = ({
  lines,
  products,
  accounts,
  analytics,
  onChange,
  disabled = false,
}) => {
  const defaultIncomeAccount = accounts.find(a => a.name === 'Sales Income' || a.type === 'income');

  const handleLineChange = (index: number, field: keyof InvoiceGridLine, value: any) => {
    const updated = [...lines];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        current.unitPrice = String(prod.sales_price || '0.00');
        current.taxRate = String(prod.tax_rate || '18.00');
      }
    }

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
        accountId: defaultIncomeAccount ? defaultIncomeAccount.id : 0,
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

  return (
    <div className="w-full bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-brown-100/70 border-b border-brown-300 text-brown-900 font-semibold">
              <th className="p-3 w-12 text-center">Sr</th>
              <th className="p-3 min-w-[200px]">Product</th>
              <th className="p-3 min-w-[160px]">Chart of Account</th>
              <th className="p-3 min-w-[160px]">Budget Analytics</th>
              <th className="p-3 w-20 text-right">Qty</th>
              <th className="p-3 w-28 text-right">Unit Price</th>
              <th className="p-3 w-20 text-right">Tax (%)</th>
              <th className="p-3 w-32 text-right font-mono-num">Total</th>
              {!disabled && <th className="p-3 w-10 text-center"></th>}
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
                      className="w-full bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-brown-900 text-xs focus:ring-2 focus:ring-brown-700 outline-none"
                    >
                      <option value={0} disabled>Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Chart of Account */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={line.accountId}
                      onChange={e => handleLineChange(idx, 'accountId', Number(e.target.value))}
                      className="w-full bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-brown-900 text-xs focus:ring-2 focus:ring-brown-700 outline-none"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Budget Analytics */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={line.analyticAccountId || ''}
                      onChange={e => handleLineChange(idx, 'analyticAccountId', e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-brown-900 text-xs focus:ring-2 focus:ring-brown-700 outline-none"
                    >
                      <option value="">No Analytic</option>
                      {analytics.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
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
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brown-700"
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
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brown-700"
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
                      className="w-full text-right font-mono-num bg-surface border border-brown-300/80 rounded-[6px] px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brown-700"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="p-3 text-right font-mono-num font-semibold text-brown-900">
                    ₹{calcs.total}
                  </td>

                  {!disabled && (
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={lines.length <= 1}
                        className="text-brown-500 hover:text-danger disabled:opacity-30 px-1 py-0.5"
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

      {!disabled && (
        <div className="p-3 bg-brown-100/30 border-t border-brown-300">
          <button
            type="button"
            onClick={addRow}
            className="text-xs font-semibold text-brown-700 hover:text-brown-900 px-3 py-1.5 rounded border border-dashed border-brown-300 hover:border-brown-700 bg-surface transition-colors"
          >
            + Add Line Item
          </button>
        </div>
      )}
    </div>
  );
};
