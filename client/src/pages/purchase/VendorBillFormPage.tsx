import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/FormView';
import { VendorBillsApi } from '../../api/vendorBills.api';
import { ContactsApi } from '../../api/contacts.api';
import { ProductsApi } from '../../api/products.api';
import { AccountsApi } from '../../api/accounts.api';
import { AnalyticsApi } from '../../api/analytics.api';
import { VendorBill, CreateBillInput, BillLine } from '@shared/schemas/vendorBill.schema';
import { Contact } from '@shared/schemas/contact.schema';
import { Product } from '@shared/schemas/product.schema';
import { Account } from '@shared/schemas/account.schema';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';
import { SmartButton } from '../../components/SmartButton';
import { NonBlockingWarning } from '../../components/NonBlockingWarning';
import { Money } from '../../components/Money';
import { CheckCircle2, DollarSign, ShoppingCart, PieChart, Ban, Trash2, Plus } from 'lucide-react';
import Decimal from 'decimal.js';

interface VendorBillFormPageProps {
  billId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onViewPO?: (poId: number) => void;
}

export const VendorBillFormPage: React.FC<VendorBillFormPageProps> = ({
  billId,
  onBack,
  onSaved,
  onHome,
  onViewPO,
}) => {
  const isNew = !billId;

  const [bill, setBill] = useState<VendorBill | null>(null);
  const [vendors, setVendors] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticAccount[]>([]);

  const [vendorId, setVendorId] = useState<number>(0);
  const [billReference, setBillReference] = useState<string>('');
  const [poId, setPoId] = useState<number | null>(null);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [lines, setLines] = useState<BillLine[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    ContactsApi.getAll(false, 'vendor').then(data => {
      setVendors(data);
      if (isNew && data.length > 0) setVendorId(data[0].id!);
    }).catch(console.error);

    ProductsApi.getAll(false).then(data => {
      setProducts(data);
      if (isNew && data.length > 0 && lines.length === 0) {
        setLines([
          {
            sr_no: 1,
            product_id: data[0].id!,
            account_id: 6, // Purchase Expense
            analytic_account_id: null,
            qty: 1,
            unit_price: data[0].cost_price || '0.00',
            tax_rate: data[0].tax_rate || '18.00',
            subtotal: data[0].cost_price || '0.00',
            tax_amount: '0.00',
            total: data[0].cost_price || '0.00',
          },
        ]);
      }
    }).catch(console.error);

    AccountsApi.getAll(false).then(setAccounts).catch(console.error);
    AnalyticsApi.getAll(false).then(setAnalytics).catch(console.error);

    if (billId) {
      setLoading(true);
      VendorBillsApi.getById(billId)
        .then(data => {
          setBill(data);
          setVendorId(data.vendor_id);
          setBillReference(data.bill_reference || '');
          setPoId(data.po_id || null);
          setBillDate(data.bill_date);
          setDueDate(data.due_date);
          setLines(data.lines);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [billId]);

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    const unitPrice = product ? product.cost_price || '0.00' : '0.00';
    const taxRate = product ? product.tax_rate || '18.00' : '18.00';
    const newLines = [...lines];
    const qty = newLines[index].qty || 1;
    const subtotal = new Decimal(qty).times(new Decimal(unitPrice)).toFixed(2);
    const taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
    const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);

    newLines[index] = {
      ...newLines[index],
      product_id: productId,
      unit_price: unitPrice,
      tax_rate: taxRate,
      subtotal,
      tax_amount: taxAmount,
      total,
    };
    setLines(newLines);
  };

  const handleQtyChange = (index: number, qtyVal: number) => {
    const newLines = [...lines];
    const qty = Math.max(1, qtyVal || 1);
    const unitPrice = newLines[index].unit_price || '0.00';
    const taxRate = newLines[index].tax_rate || '18.00';
    const subtotal = new Decimal(qty).times(new Decimal(unitPrice)).toFixed(2);
    const taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
    const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);

    newLines[index] = { ...newLines[index], qty, subtotal, tax_amount: taxAmount, total };
    setLines(newLines);
  };

  const handlePriceChange = (index: number, priceStr: string) => {
    const newLines = [...lines];
    const qty = newLines[index].qty || 1;
    const taxRate = newLines[index].tax_rate || '18.00';
    let subtotal = '0.00';
    let taxAmount = '0.00';
    let total = '0.00';
    try {
      subtotal = new Decimal(qty).times(new Decimal(priceStr || '0')).toFixed(2);
      taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
      total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);
    } catch {
      // ignore
    }

    newLines[index] = { ...newLines[index], unit_price: priceStr, subtotal, tax_amount: taxAmount, total };
    setLines(newLines);
  };

  const handleAddRow = () => {
    if (products.length === 0) return;
    const p = products[0];
    const unitPrice = p.cost_price || '0.00';
    const taxRate = p.tax_rate || '18.00';
    const subtotal = unitPrice;
    const taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
    const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);

    setLines([
      ...lines,
      {
        sr_no: lines.length + 1,
        product_id: p.id!,
        account_id: 6,
        analytic_account_id: null,
        qty: 1,
        unit_price: unitPrice,
        tax_rate: taxRate,
        subtotal,
        tax_amount: taxAmount,
        total,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index).map((l, idx) => ({ ...l, sr_no: idx + 1 })));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!vendorId) {
        setError('Please select a vendor');
        setLoading(false);
        return;
      }

      const payload: CreateBillInput = {
        vendor_id: vendorId,
        bill_reference: billReference,
        po_id: poId,
        bill_date: billDate,
        due_date: dueDate,
        lines: lines.map(l => ({
          product_id: l.product_id,
          account_id: l.account_id,
          analytic_account_id: l.analytic_account_id,
          qty: l.qty,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
        })),
      };

      const saved = await VendorBillsApi.create(payload);
      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      setError(null);
      setWarningMessage(null);

      const result = await VendorBillsApi.confirm(billId);
      setBill(result.bill);

      if (result.warning) {
        setWarningMessage(result.warning);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm vendor bill');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      const updated = await VendorBillsApi.cancel(billId);
      setBill(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDraft = !bill || bill.status === 'draft';
  const isConfirmed = bill?.status === 'confirmed';
  const isCancelled = bill?.status === 'cancelled';

  const subtotalSum = lines.reduce((acc, l) => acc.plus(new Decimal(l.subtotal || '0')), new Decimal('0')).toFixed(2);
  const taxSum = lines.reduce((acc, l) => acc.plus(new Decimal(l.tax_amount || '0')), new Decimal('0')).toFixed(2);
  const grandTotal = new Decimal(subtotalSum).plus(new Decimal(taxSum)).toFixed(2);

  return (
    <FormView
      title={isNew ? 'New Vendor Bill' : `Vendor Bill ${bill?.number || ''}`}
      subtitle={isNew ? 'Record a vendor invoice' : `Vendor: ${bill?.vendor_name}`}
      isNew={isNew}
      status={bill?.status || 'draft'}
      onSave={handleSave}
      onNew={() => onSaved(0)}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
      extraButtons={
        <div className="flex items-center gap-2">
          {/* CRITICAL: PO Smart button appears ONLY if bill.po_id is not null */}
          <SmartButton
            label="PO Order"
            count={bill?.po_id ? `PO #${bill.po_id}` : undefined}
            icon={ShoppingCart}
            visible={Boolean(bill?.po_id)}
            onClick={() => bill?.po_id && onViewPO?.(bill.po_id)}
          />

          {/* Budget Smart button */}
          <SmartButton
            label="Budget Analysis"
            count="Active"
            icon={PieChart}
            visible={!isNew}
            onClick={() => alert(`Analytics linked: ${lines.filter(l => l.analytic_account_id).length} line items`)}
          />

          {/* Confirm Button */}
          {isDraft && !isNew && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-cream px-3.5 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Bill
            </button>
          )}

          {/* Pay Button */}
          {isConfirmed && (
            <button
              type="button"
              onClick={() => alert('Payment allocation registration modal')}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-brown-800 hover:bg-brown-900 text-cream px-3.5 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              Pay
            </button>
          )}

          {/* Cancel Button */}
          {!isCancelled && !isNew && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-danger bg-danger-bg hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
            >
              <Ban className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {warningMessage && (
          <NonBlockingWarning
            message={warningMessage}
            onDismiss={() => setWarningMessage(null)}
          />
        )}

        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-brown-50/50 rounded-xl border border-brown-200">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Vendor Bill No.
            </label>
            <input
              type="text"
              readOnly
              value={bill?.number || 'Bill/2026/0001 (Auto)'}
              className="w-full px-3 py-2 bg-brown-100/60 border border-brown-200 rounded-lg text-sm font-mono text-brown-700 font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Bill Reference (Vendor Ref)
            </label>
            <input
              type="text"
              disabled={!isDraft}
              value={billReference}
              onChange={e => setBillReference(e.target.value)}
              placeholder="e.g. ABC-26-001 (Vendor Invoice No)"
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Vendor *
            </label>
            <select
              value={vendorId}
              disabled={!isDraft}
              onChange={e => setVendorId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium disabled:opacity-60"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.city || 'Vendor'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Bill Date & Due Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                disabled={!isDraft}
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-surface border border-brown-200 rounded-lg text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 disabled:opacity-60"
              />
              <input
                type="date"
                disabled={!isDraft}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-surface border border-brown-200 rounded-lg text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Bill Lines Grid */}
        <div className="border border-brown-200 rounded-xl overflow-hidden bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brown-100/70 border-b border-brown-200 text-xs font-semibold text-brown-700 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Sr</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Chart of Account</th>
                <th className="py-2.5 px-3">Budget Analytics</th>
                <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                <th className="py-2.5 px-3 w-24 text-right">Tax %</th>
                <th className="py-2.5 px-3 w-32 text-right">Total</th>
                {isDraft && <th className="py-2.5 px-3 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100 text-sm">
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-brown-50/50">
                  <td className="py-2.5 px-3 text-center text-xs font-mono text-brown-400">
                    {line.sr_no}
                  </td>
                  <td className="py-2.5 px-3">
                    {isDraft ? (
                      <select
                        value={line.product_id}
                        onChange={e => handleProductChange(idx, parseInt(e.target.value, 10))}
                        className="w-full bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-brown-900">{line.product_name || 'Product'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {isDraft ? (
                      <select
                        value={line.account_id}
                        onChange={e => {
                          const updated = [...lines];
                          updated[idx].account_id = parseInt(e.target.value, 10);
                          setLines(updated);
                        }}
                        className="w-full bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                      >
                        {accounts.filter(a => a.type === 'expense' || a.type === 'other_expense' || a.type === 'asset').map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-brown-700">{line.account_name || 'Purchase Expense'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {isDraft ? (
                      <select
                        value={line.analytic_account_id || ''}
                        onChange={e => {
                          const updated = [...lines];
                          updated[idx].analytic_account_id = e.target.value ? parseInt(e.target.value, 10) : null;
                          setLines(updated);
                        }}
                        className="w-full bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                      >
                        <option value="">None (General)</option>
                        {analytics.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-brown-700">{line.analytic_account_name || '—'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isDraft ? (
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={e => handleQtyChange(idx, parseInt(e.target.value, 10))}
                        className="w-16 bg-surface border border-brown-200 rounded-lg px-2 py-1 text-xs text-right font-mono"
                      />
                    ) : (
                      <span className="font-mono">{line.qty}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isDraft ? (
                      <input
                        type="text"
                        value={line.unit_price}
                        onChange={e => handlePriceChange(idx, e.target.value)}
                        className="w-24 bg-surface border border-brown-200 rounded-lg px-2 py-1 text-xs text-right font-mono"
                      />
                    ) : (
                      <Money amount={line.unit_price} />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-mono text-xs">{line.tax_rate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Money amount={line.total || '0.00'} className="font-semibold text-brown-900" />
                  </td>
                  {isDraft && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        disabled={lines.length <= 1}
                        onClick={() => handleRemoveRow(idx)}
                        className="text-brown-400 hover:text-danger disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isDraft && (
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brown-700 bg-brown-100 hover:bg-brown-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item Line
          </button>
        )}

        {/* Footer Payment & Ledger Balance Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brown-200">
          <div className="p-4 bg-brown-50/50 rounded-xl border border-brown-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brown-700 mb-2">
              Payment & Settlement Status (View Derived)
            </h4>
            <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
              <span className="text-brown-600">Paid Via Cash:</span>
              <Money amount={bill?.paid_via_cash || '0.00'} />
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
              <span className="text-brown-600">Paid Via Bank:</span>
              <Money amount={bill?.paid_via_bank || '0.00'} />
            </div>
            <div className="flex justify-between text-sm font-bold text-amber-900 pt-1">
              <span>Amount Due:</span>
              <Money amount={bill?.amount_due || grandTotal} className="text-base font-bold text-amber-900" />
            </div>
          </div>

          <div className="p-4 bg-brown-50/50 rounded-xl border border-brown-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brown-700 mb-2">
              Financial Summary
            </h4>
            <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
              <span className="text-brown-600">Subtotal (Ex-Tax):</span>
              <Money amount={subtotalSum} />
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-brown-200/50">
              <span className="text-brown-600">Total Input GST:</span>
              <Money amount={taxSum} />
            </div>
            <div className="flex justify-between text-base font-bold text-brown-900 pt-1">
              <span>Grand Total:</span>
              <Money amount={grandTotal} className="text-lg font-bold text-brown-900" />
            </div>
          </div>
        </div>
      </div>
    </FormView>
  );
};
