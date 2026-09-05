import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/FormView';
import { ProductsApi } from '../../api/products.api';
import { Product, CreateProductInput, ProductType } from '@shared/schemas/product.schema';
import { NonBlockingWarning } from '../../components/NonBlockingWarning';
import { Package, Layers, Wrench, IndianRupee, Tag, Barcode, Sparkles, AlertTriangle } from 'lucide-react';
import Decimal from 'decimal.js';

interface ProductFormPageProps {
  productId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onNew?: () => void;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId, onBack, onSaved, onHome, onNew }) => {
  const isNew = !productId;

  const [formData, setFormData] = useState<CreateProductInput>({
    sku: '',
    name: '',
    type: 'goods',
    category: '',
    sales_price: '0.00',
    cost_price: '0.00',
    mrp: '0.00',
    tax_rate: '18.00',
    min_stock_threshold: 5,
    is_archived: false,
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingSku, setGeneratingSku] = useState(false);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      ProductsApi.getById(productId)
        .then(data => {
          setProduct(data);
          setFormData({
            sku: data.sku,
            name: data.name,
            type: data.type,
            category: data.category,
            sales_price: data.sales_price,
            cost_price: data.cost_price,
            mrp: data.mrp,
            tax_rate: data.tax_rate,
            min_stock_threshold: data.min_stock_threshold ?? 5,
            is_archived: data.is_archived,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setProduct(null);
      setFormData({
        sku: '',
        name: '',
        type: 'goods',
        category: '',
        sales_price: '0.00',
        cost_price: '0.00',
        mrp: '0.00',
        tax_rate: '18.00',
        min_stock_threshold: 5,
        is_archived: false,
      });
      setError(null);
    }
  }, [productId]);

  const handleGenerateSku = async () => {
    try {
      setGeneratingSku(true);
      const res = await ProductsApi.generateSku(formData.category || 'FURN', formData.name || 'ITEM');
      setFormData(prev => ({ ...prev, sku: res.sku }));
    } catch (err: any) {
      console.error('Failed to generate SKU', err);
    } finally {
      setGeneratingSku(false);
    }
  };

  // Real-time pricing validation warning
  const getPricingWarning = (): string | null => {
    try {
      const sales = new Decimal(formData.sales_price || '0');
      const cost = new Decimal(formData.cost_price || '0');
      const mrp = new Decimal(formData.mrp || '0');

      if (sales.greaterThan(0) && cost.greaterThan(0) && sales.lessThan(cost)) {
        return `⚠️ Below-Cost Warning: Sales price (₹${sales.toFixed(2)}) is lower than product cost price (₹${cost.toFixed(2)}).`;
      }
      if (sales.greaterThan(0) && mrp.greaterThan(0) && sales.greaterThan(mrp)) {
        return `⚠️ MRP Ceiling Warning: Sales price (₹${sales.toFixed(2)}) exceeds Maximum Retail Price ceiling (₹${mrp.toFixed(2)}).`;
      }
    } catch {
      // Ignore parse errors during active editing
    }
    return null;
  };

  const pricingWarning = getPricingWarning();

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let saved: Product;
      if (isNew) {
        saved = await ProductsApi.create(formData);
      } else {
        saved = await ProductsApi.update(productId!, formData);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!productId || !product) return;
    try {
      setLoading(true);
      const updated = await ProductsApi.archive(productId, !product.is_archived);
      setProduct(updated);
      setFormData(prev => ({ ...prev, is_archived: updated.is_archived }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormView
      title={isNew ? 'New Product / Service' : formData.name || 'Edit Product'}
      subtitle={isNew ? 'Configure product pricing, category, and tax' : `SKU: ${formData.sku}`}
      isNew={isNew}
      isArchived={formData.is_archived}
      onSave={handleSave}
      onNew={onNew}
      onArchiveToggle={!isNew ? handleArchiveToggle : undefined}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {pricingWarning && (
          <NonBlockingWarning message={pricingWarning} />
        )}

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-2">
            Product Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 'goods', label: 'Goods', desc: 'Physical furniture item', icon: Package },
              { type: 'service', label: 'Service', desc: 'Labor, assembly, polishing', icon: Wrench },
              { type: 'combo', label: 'Combo Package', desc: 'Bundled sets with special pricing', icon: Layers },
            ].map(({ type, label, desc, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type: type as ProductType })}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                  formData.type === type
                    ? 'border-brown-700 bg-brown-50/60 ring-2 ring-brown-700/20'
                    : 'border-brown-200 bg-surface hover:bg-brown-50/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${formData.type === type ? 'text-brown-800' : 'text-brown-500'}`} />
                  <span className="font-semibold text-sm text-brown-900">{label}</span>
                </div>
                <span className="text-xs text-brown-500">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Product / Service Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ergonomic Walnut Desk"
              className="w-full px-4 py-2.5 bg-surface border border-brown-200 rounded-lg text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider">
                SKU Code *
              </label>
              {isNew && (
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  disabled={generatingSku}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brown-700 hover:text-brown-900 underline"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Auto-Gen
                </button>
              )}
            </div>
            <div className="relative">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                type="text"
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="DESK-WALN-001"
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-brown-200 rounded-lg font-mono text-sm uppercase text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                type="text"
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Living Room, Dining, Office"
                className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              GST Tax Rate (%) *
            </label>
            <select
              value={formData.tax_rate}
              onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
            >
              <option value="0.00">0% (Nil / Exempted)</option>
              <option value="5.00">5% GST</option>
              <option value="12.00">12% GST</option>
              <option value="18.00">18% GST (Standard Furniture Rate)</option>
              <option value="28.00">28% GST</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Min Stock Threshold (Alerts)
            </label>
            <input
              type="number"
              min="0"
              value={formData.min_stock_threshold ?? 5}
              onChange={e => setFormData({ ...formData, min_stock_threshold: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="border-t border-brown-200 pt-6">
          <h3 className="text-sm font-bold font-heading text-brown-900 uppercase tracking-wider mb-4">
            Financial & Pricing Details (Decimal.js Compliant)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-brown-50/50 rounded-xl border border-brown-200">
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                Sales Price (ex-tax) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-brown-400">₹</span>
                <input
                  type="text"
                  required
                  value={formData.sales_price}
                  onChange={e => setFormData({ ...formData, sales_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-surface border border-brown-200 rounded-lg font-mono text-base font-semibold text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </div>
              <span className="text-[11px] text-brown-500 mt-1 block">Default selling price for invoices</span>
            </div>

            <div className="p-4 bg-brown-50/50 rounded-xl border border-brown-200">
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                Cost Price (ex-tax) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-brown-400">₹</span>
                <input
                  type="text"
                  required
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-surface border border-brown-200 rounded-lg font-mono text-base font-semibold text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </div>
              <span className="text-[11px] text-brown-500 mt-1 block">Purchase cost from vendor bills</span>
            </div>

            <div className="p-4 bg-brown-50/50 rounded-xl border border-brown-200">
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                MRP (Max Retail Price) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-brown-400">₹</span>
                <input
                  type="text"
                  required
                  value={formData.mrp}
                  onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-surface border border-brown-200 rounded-lg font-mono text-base font-semibold text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </div>
              <span className="text-[11px] text-brown-500 mt-1 block">Ceiling retail price banner check</span>
            </div>
          </div>
        </div>
      </div>
    </FormView>
  );
};
