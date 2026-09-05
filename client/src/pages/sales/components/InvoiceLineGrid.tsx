import React from 'react';
import Decimal from 'decimal.js';
import { calculateLineTax } from '@shared/schemas/money';

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
        accountId: defaultIncomeAccount ? defaultIncomeAccount.id : 6,
        analyticAccountId: null,
        qty: '1',
        unitPrice,
        taxRate,
        subtotal: calcs.subtotal,
        taxAmount: calcs.taxAmount,
        total: calcs.total,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (disabled || lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  // Grand totals
  const grandSubtotal = lines.reduce((acc, l) => acc.plus(l.subtotal || '0'), new Decimal(0)).toFixed(2);
  const grandTax = lines.reduce((acc, l) => acc.plus(l.taxAmount || '0'), new Decimal(0)).toFixed(2);
  const grandTotal = lines.reduce((acc, l) => acc.plus(l.total || '0'), new Decimal(0)).toFixed(2);

  return (
    <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-brown-300 bg-brown-100/50 text-brown-900 font-semibold">
              <th className="p-3 w-12 text-center">Sr.</th>
              <th className="p-3 min-w-[200px]">Product *</th>
              <th className="p-3 min-w-[180px]">Chart of Account *</th>
              <th className="p-3 min-w-[160px]">Budget Analytics</th>
              <th className="p-3 w-24 text-right">Qty *</th>
              <th className="p-3 w-32 text-right">Unit Price *</th>
              <th className="p-3 w-24 text-right">Tax (%)</th>
              <th className="p-3 w-32 text-right font-mono-num">Line Total</th>
              {!disabled && <th className="p-3 w-12 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-100">
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-brown-100/30 transition-colors">
                <td className="p-3 text-center text-brown-500 font-mono text-xs">{idx + 1}</td>
                <td className="p-3">
                  <select
                    disabled={disabled}
                    value={line.productId}
                    onChange={e => handleLineChange(idx, 'productId', Number(e.target.value))}
                    className="w-full bg-surface border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                  >
                    <option value={0} disabled>Select product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <select
                    disabled={disabled}
                    value={line.accountId}
                    onChange={e => handleLineChange(idx, 'accountId', Number(e.target.value))}
                    className="w-full bg-surface border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <select
                    disabled={disabled}
                    value={line.analyticAccountId || ''}
                    onChange={e => handleLineChange(idx, 'analyticAccountId', e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-surface border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                  >
                    <option value="">No Analytic Distribution</option>
                    {analytics.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    disabled={disabled}
                    value={line.qty}
                    onChange={e => handleLineChange(idx, 'qty', e.target.value)}
                    className="w-full text-right bg-surface border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-brown-900 font-mono focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                  />
                </td>
                <td className="p-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-brown-500 text-xs">₹</span>
                    <input
                      type="text"
                      disabled={disabled}
                      value={line.unitPrice}
                      onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)}
                      className="w-full text-right pl-6 bg-surface border border-brown-300 rounded-[6px] px-2.5 py-1.5 text-brown-900 font-mono focus:ring-2 focus:ring-brown-700 outline-none text-sm"
                    />
                  </div>
                </td>
                <td className="p-3">
                  <select
                    disabled={disabled}
                    value={line.taxRate}
                    onChange={e => handleLineChange(idx, 'taxRate', e.target.value)}
                    className="w-full text-right bg-surface border border-brown-300 rounded-[6px] px-2 py-1.5 text-brown-900 font-mono text-sm focus:ring-2 focus:ring-brown-700 outline-none"
                  >
                    <option value="0.00">0%</option>
                    <option value="5.00">5%</option>
                    <option value="12.00">12%</option>
                    <option value="18.00">18%</option>
                    <option value="28.00">28%</option>
                  </select>
                </td>
                <td className="p-3 text-right font-mono font-bold text-brown-900">
                  ₹{line.total || '0.00'}
                </td>
                {!disabled && (
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={lines.length <= 1}
                      className="text-danger hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <div className="mt-4">
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 text-xs font-semibold text-brown-900 bg-brown-100 hover:bg-brown-300/60 rounded-[6px] transition-colors"
          >
            + Add Line Item
          </button>
        </div>
      )}

      {/* Footer Calculation */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 bg-brown-50 p-4 rounded-[8px] border border-brown-200 space-y-2 text-sm">
          <div className="flex justify-between text-brown-700">
            <span>Subtotal:</span>
            <span className="font-mono">₹{grandSubtotal}</span>
          </div>
          <div className="flex justify-between text-brown-700">
            <span>GST Tax:</span>
            <span className="font-mono">₹{grandTax}</span>
          </div>
          <div className="pt-2 border-t border-brown-300 flex justify-between font-bold text-brown-900 text-base">
            <span>Total:</span>
            <span className="font-mono">₹{grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
