import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ListView';
import { ProductsApi } from '../../api/products.api';
import { Product, ProductType } from '@shared/schemas/product.schema';
import { StatusBadge } from '../../components/StatusBadge';
import { Money } from '../../components/Money';
import { Package, Wrench, Layers, List, LayoutGrid } from 'lucide-react';
import { ProductKanbanPage } from './ProductKanbanPage';

interface ProductListPageProps {
  onSelectProduct: (id: number) => void;
  onNewProduct: () => void;
  initialViewMode?: 'list' | 'kanban';
}

export const ProductListPage: React.FC<ProductListPageProps> = ({
  onSelectProduct,
  onNewProduct,
  initialViewMode = 'list',
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(initialViewMode);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductsApi.getAll(includeArchived, categoryFilter, typeFilter);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [includeArchived, typeFilter, categoryFilter]);

  if (viewMode === 'kanban') {
    return (
      <ProductKanbanPage
        onSelectProduct={onSelectProduct}
        onNewProduct={onNewProduct}
        onToggleViewMode={() => setViewMode('list')}
      />
    );
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      className: 'font-mono text-xs font-semibold text-brown-700',
    },
    {
      key: 'name',
      header: 'Product Name',
      render: p => (
        <div>
          <div className="font-medium text-brown-900">{p.name}</div>
          <div className="text-xs text-brown-400">{p.category}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: p => (
        <span
          className={`inline-flex items-center gap-1.5 capitalize text-xs px-2.5 py-0.5 rounded-full font-medium ${
            p.type === 'combo'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : p.type === 'service'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {p.type === 'combo' ? (
            <Layers className="w-3 h-3 text-purple-600" />
          ) : p.type === 'service' ? (
            <Wrench className="w-3 h-3 text-blue-600" />
          ) : (
            <Package className="w-3 h-3 text-amber-600" />
          )}
          {p.type}
        </span>
      ),
    },
    {
      key: 'sales_price',
      header: 'Sales Price',
      align: 'right',
      render: p => <Money amount={p.sales_price} className="font-medium text-brown-900" />,
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      align: 'right',
      render: p => <Money amount={p.cost_price} className="text-brown-600" />,
    },
    {
      key: 'stock_qty',
      header: 'Stock',
      align: 'center',
      render: p => {
        if (p.type === 'service') return <span className="text-xs text-brown-400">N/A</span>;
        const qty = p.stock_qty || 0;
        const isLow = qty <= (p.min_stock_threshold ?? 5);
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
              isLow
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {qty} units {isLow && '⚠️'}
          </span>
        );
      },
    },
    {
      key: 'tax_rate',
      header: 'Tax %',
      align: 'right',
      render: p => <span className="font-mono text-xs text-brown-600">{p.tax_rate}%</span>,
    },
    {
      key: 'is_archived',
      header: 'Status',
      align: 'center',
      render: p => <StatusBadge status={p.is_archived ? 'archived' : 'active'} />,
    },
  ];

  return (
    <ListView
      title="Products & Services"
      subtitle="Goods, assembly services, and bundled combos"
      columns={columns}
      data={products}
      loading={loading}
      onRowClick={p => p.id && onSelectProduct(p.id)}
      onNew={onNewProduct}
      includeArchived={includeArchived}
      onToggleArchived={setIncludeArchived}
      extraControls={
        <div className="flex items-center bg-brown-100/70 p-1 rounded-lg border border-brown-200">
          <button
            type="button"
            className="p-1.5 rounded bg-surface text-brown-900 shadow-xs font-medium"
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className="p-1.5 rounded text-brown-600 hover:text-brown-900 transition-colors"
            title="Kanban View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      }
      filterSlot={
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-surface border border-brown-200 rounded-lg px-3 py-2 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
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
              className="bg-surface border border-brown-200 rounded-lg px-3 py-2 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      }
    />
  );
};
