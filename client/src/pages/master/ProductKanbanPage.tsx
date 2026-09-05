import React, { useState, useEffect } from 'react';
import { ProductsApi } from '../../api/products.api';
import { Product } from '@shared/schemas/product.schema';
import { Money } from '../../components/Money';
import { StatusBadge } from '../../components/StatusBadge';
import { Package, Wrench, Layers, Plus, List, LayoutGrid, Search } from 'lucide-react';

interface ProductKanbanPageProps {
  onSelectProduct: (id: number) => void;
  onNewProduct: () => void;
  onToggleViewMode: () => void;
}

export const ProductKanbanPage: React.FC<ProductKanbanPageProps> = ({
  onSelectProduct,
  onNewProduct,
  onToggleViewMode,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    setLoading(true);
    ProductsApi.getAll(includeArchived, categoryFilter, typeFilter)
      .then(data => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [includeArchived, typeFilter, categoryFilter]);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-900">Products & Services</h1>
          <p className="text-sm text-brown-500">Kanban gallery view of inventory and service items</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-brown-100/70 p-1 rounded-lg border border-brown-200">
            <button
              type="button"
              onClick={onToggleViewMode}
              className="p-1.5 rounded text-brown-600 hover:text-brown-900 transition-colors"
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded bg-surface text-brown-900 shadow-xs font-medium"
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewProduct}
            className="inline-flex items-center gap-1.5 bg-brown-700 hover:bg-brown-800 text-cream px-3.5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-brown-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, or category..."
            className="w-full pl-9 pr-4 py-1.5 bg-brown-50/50 border border-brown-200 rounded-lg text-xs text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
          >
            <option value="all">All Types</option>
            <option value="goods">Goods</option>
            <option value="service">Services</option>
            <option value="combo">Combo Packages</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-surface border border-brown-200 rounded-lg px-2.5 py-1.5 text-xs text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-1.5 text-xs text-brown-600 cursor-pointer pl-2">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
              className="rounded text-brown-600 focus:ring-brown-500"
            />
            Archived
          </label>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-brown-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-700"></div>
          <span className="ml-3 text-sm font-medium">Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-surface border border-brown-200 rounded-2xl p-12 text-center text-brown-500">
          <Package className="w-12 h-12 mx-auto text-brown-300 mb-3" />
          <p className="font-medium text-brown-800">No products found</p>
          <p className="text-xs text-brown-400 mt-1">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => p.id && onSelectProduct(p.id)}
              className={`bg-surface border rounded-xl p-4.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                p.is_archived
                  ? 'border-brown-200 bg-brown-50/40 opacity-75'
                  : 'border-brown-200 hover:border-brown-400'
              }`}
            >
              <div>
                {/* Header: SKU + Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-brown-500 group-hover:text-brown-800">
                    {p.sku}
                  </span>
                  <StatusBadge status={p.is_archived ? 'archived' : 'active'} />
                </div>

                {/* Name */}
                <h3 className="font-heading font-bold text-brown-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-brown-700">
                  {p.name}
                </h3>

                {/* Category & Type Tag */}
                <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                  <span className="text-[11px] bg-brown-100/80 text-brown-700 px-2 py-0.5 rounded font-medium">
                    {p.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 capitalize text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      p.type === 'combo'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : p.type === 'service'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {p.type === 'combo' ? (
                      <Layers className="w-2.5 h-2.5 text-purple-600" />
                    ) : p.type === 'service' ? (
                      <Wrench className="w-2.5 h-2.5 text-blue-600" />
                    ) : (
                      <Package className="w-2.5 h-2.5 text-amber-600" />
                    )}
                    {p.type}
                  </span>
                </div>
              </div>

              {/* Price & Cost Footer */}
              <div className="border-t border-brown-100 pt-3 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-brown-400 uppercase tracking-tight block">Sales Price</span>
                  <Money amount={p.sales_price} className="text-sm font-heading font-bold text-brown-900" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-brown-400 uppercase tracking-tight block">Cost / Tax</span>
                  <div className="flex items-center gap-1 text-xs text-brown-600">
                    <Money amount={p.cost_price} />
                    <span className="text-[10px] text-brown-400">({p.tax_rate}%)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
