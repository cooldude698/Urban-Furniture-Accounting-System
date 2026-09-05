import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/ui/FormView';
import { PurchaseOrdersApi } from '../../api/purchaseOrders.api';
import { ContactsApi } from '../../api/contacts.api';
import { ProductsApi } from '../../api/products.api';
import { AnalyticsApi } from '../../api/analytics.api';
import { PurchaseOrder, CreatePOInput } from '@shared/schemas/purchaseOrder.schema';
import { Contact } from '@shared/schemas/contact.schema';
import { Product } from '@shared/schemas/product.schema';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';
import { LineItemGrid, EditableLineItem } from '../../components/LineItemGrid';
import { NonBlockingWarning } from '../../components/NonBlockingWarning';
import { SmartButton } from '../../components/SmartButton';
import { VendorBillsApi } from '../../api/vendorBills.api';
import { CheckCircle2, FileText, Ban, ShoppingBag } from 'lucide-react';
import Decimal from 'decimal.js';


interface POFormPageProps {
  poId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onCreateBillSuccess?: (billId: number) => void;
}

export const POFormPage: React.FC<POFormPageProps> = ({
  poId,
  onBack,
  onSaved,
  onHome,
  onCreateBillSuccess,
}) => {
  const isNew = !poId;

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [vendors, setVendors] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticAccount[]>([]);

  const [vendorId, setVendorId] = useState<number>(0);
  const [poDate, setPoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<EditableLineItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [linkedBillsCount, setLinkedBillsCount] = useState<number>(0);
  const [firstLinkedBillId, setFirstLinkedBillId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch master dropdowns
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
            analytic_account_id: null,
            qty: 1,
            unit_price: data[0].cost_price || '0.00',
            total: data[0].cost_price || '0.00',
          },
        ]);
      }
    }).catch(console.error);

    AnalyticsApi.getAll(false).then(setAnalytics).catch(console.error);

    if (poId) {
      setLoading(true);
      PurchaseOrdersApi.getById(poId)
        .then(data => {
          setPo(data);
          setVendorId(data.vendor_id);
          setPoDate(data.po_date);
          setLines(
            data.lines.map(l => ({
              id: l.id,
              sr_no: l.sr_no,
              product_id: l.product_id,
              analytic_account_id: l.analytic_account_id,
              qty: l.qty,
              unit_price: l.unit_price,
              total: l.total,
            }))
          );
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));

      // Check linked vendor bills
      VendorBillsApi.getAll().then(allBills => {
        const matching = allBills.filter(b => (b.po_id || (b as any).poId) === poId);
        setLinkedBillsCount(matching.length);
        if (matching.length > 0) {
          setFirstLinkedBillId(matching[0].id!);
        }
      }).catch(console.error);
    }

  }, [poId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!vendorId) {
        setError('Please select a vendor');
        setLoading(false);
        return;
      }

      if (lines.length === 0) {
        setError('Please add at least one line item');
        setLoading(false);
        return;
      }

      const payload: CreatePOInput = {
        vendor_id: vendorId,
        po_date: poDate,
        lines: lines.map(l => ({
          product_id: l.product_id,
          analytic_account_id: l.analytic_account_id,
          qty: l.qty,
          unit_price: l.unit_price,
        })),
      };

      let saved: PurchaseOrder;
      if (isNew) {
        saved = await PurchaseOrdersApi.create(payload);
      } else {
        saved = await PurchaseOrdersApi.update(poId!, payload);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!poId) return;
    try {
      setLoading(true);
      setError(null);
      setWarningMessage(null);

      const result = await PurchaseOrdersApi.confirm(poId);
      setPo(result.po);

      if (result.warning) {
        setWarningMessage(result.warning);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!poId) return;
    try {
      setLoading(true);
      const updated = await PurchaseOrdersApi.cancel(poId);
      setPo(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!poId) return;
    try {
      setLoading(true);
      const bill = await PurchaseOrdersApi.createBill(poId);
      if (onCreateBillSuccess) {
        onCreateBillSuccess(bill.id);
      } else {
        alert(`Vendor Bill ${bill.number} generated successfully from PO!`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = po?.status === 'confirmed';
  const isCancelled = po?.status === 'cancelled';
  const isDraft = !po || po.status === 'draft';

  const linePriceWarnings = lines
    .map(l => {
      const prod = products.find(p => p.id === l.product_id);
      if (!prod) return null;
      try {
        const price = new Decimal(l.unit_price || '0');
        const cost = new Decimal(prod.cost_price || '0');
        const mrp = new Decimal(prod.mrp || '0');
        if (price.greaterThan(0) && cost.greaterThan(0) && price.lessThan(cost)) {
          return `⚠️ Below-Cost Warning: Line for "${prod.name}" unit price (₹${price.toFixed(2)}) is below standard cost (₹${cost.toFixed(2)}).`;
        }
        if (price.greaterThan(0) && mrp.greaterThan(0) && price.greaterThan(mrp)) {
          return `⚠️ MRP Ceiling Warning: Line for "${prod.name}" unit price (₹${price.toFixed(2)}) exceeds Maximum Retail Price (₹${mrp.toFixed(2)}).`;
        }
      } catch {}
      return null;
    })
    .filter(Boolean) as string[];

  const activeWarning = warningMessage || (linePriceWarnings.length > 0 ? linePriceWarnings.join(' | ') : null);

  return (
    <FormView
      title={isNew ? 'New Purchase Order' : `Purchase Order ${po?.number || ''}`}
      subtitle={isNew ? 'Draft commercial purchase order' : `Vendor: ${po?.vendor_name}`}
      isNew={isNew}
      status={po?.status || 'draft'}
      onSave={handleSave}
      onNew={() => onSaved(0)}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
      extraButtons={
        <div className="flex items-center gap-2">
          {/* Vendor Bills Smart Button */}
          <SmartButton
            label="Vendor Bills"
            count={linkedBillsCount > 0 ? String(linkedBillsCount) : undefined}
            icon={FileText}
            visible={Boolean(poId && linkedBillsCount > 0)}
            onClick={() => {
              if (firstLinkedBillId && onCreateBillSuccess) {
                onCreateBillSuccess(firstLinkedBillId);
              }
            }}
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
              Confirm
            </button>
          )}


          {/* Create Bill Button (Enabled ONLY when PO is Confirmed) */}
          {isConfirmed && (
            <button
              type="button"
              onClick={handleCreateBill}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-brown-800 hover:bg-brown-900 text-cream px-3.5 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Create Bill
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
        {/* Over-Budget / Price Warning Banner */}
        {activeWarning && (
          <NonBlockingWarning
            message={activeWarning}
            onDismiss={() => setWarningMessage(null)}
          />
        )}

        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brown-50/50 rounded-xl border border-brown-200">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              PO Number
            </label>
            <input
              type="text"
              readOnly
              value={po?.number || 'P00001 (Auto-generated)'}
              className="w-full px-3 py-2 bg-brown-100/60 border border-brown-200 rounded-lg text-sm font-mono text-brown-700 font-semibold cursor-not-allowed"
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
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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
              PO Date *
            </label>
            <input
              type="date"
              disabled={!isDraft}
              value={poDate}
              onChange={e => setPoDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* PO Line Items Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brown-700">
              Purchase Order Line Items
            </h3>
            <span className="text-xs text-brown-500">
              Select Budget Analytics to track departmental headroom
            </span>
          </div>

          <LineItemGrid
            lines={lines}
            onChange={setLines}
            products={products}
            analytics={analytics}
            disabled={!isDraft}
          />
        </div>
      </div>
    </FormView>
  );
};
