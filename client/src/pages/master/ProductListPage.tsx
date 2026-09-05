import React, { useState, useEffect } from 'react';
import { ProductsApi } from '../../api/products.api';
import { Product } from '@shared/schemas/product.schema';
import { Money } from '../../components/Money';
import { Package, Wrench, Layers, List, LayoutGrid } from 'lucide-react';

interface ProductListPageProps {
  onSelectProduct: (id: number) => void;
  onNewProduct: () => void;
  onBack?: () => void;
  initialViewMode?: 'list' | 'kanban';
}

export const ProductListPage: React.FC<ProductListPageProps> = ({
  onSelectProduct,
  onNewProduct,
  onBack,
  initialViewMode = 'list',
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(initialViewMode);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductsApi.getAll(false, 'all', 'all');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id!).filter(Boolean));
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  const renderProductIcon = (type: string, size = 18) => {
    if (type === 'service') return <Wrench size={size} color="var(--brown-600, #8C6A58)" />;
    if (type === 'combo') return <Layers size={size} color="var(--brown-600, #8C6A58)" />;
    return <Package size={size} color="var(--brown-600, #8C6A58)" />;
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Title matching wireframe: Product List View / Product Kanban View */}
        <h1 style={styles.heading}>
          {viewMode === 'list' ? 'Product List View' : 'Product Kanban View'}
        </h1>

        {/* Outer Wireframe Card */}
        <div style={styles.card}>
          {/* Top Action Row */}
          <div style={styles.topBar}>
            {/* Left: New Button */}
            <button
              type="button"
              onClick={onNewProduct}
              onMouseEnter={() => setHoveredBtn('new')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.wireframeBtn,
                ...(hoveredBtn === 'new' ? styles.wireframeBtnHover : {}),
              }}
            >
              New
            </button>

            {/* Center: Search Input Bar */}
            <div style={styles.searchWrapper}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search"
                style={styles.searchInput}
              />
            </div>

            {/* Right: Back Button & View Switcher */}
            <div style={styles.rightGroup}>
              <button
                type="button"
                onClick={onBack || (() => window.history.back())}
                onMouseEnter={() => setHoveredBtn('back')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'back' ? styles.wireframeBtnHover : {}),
                }}
              >
                Back
              </button>

              {/* View Switcher Icons */}
              <div style={styles.switcherContainer}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Allow user to shift to List View"
                  style={{
                    ...styles.switchBtn,
                    ...(viewMode === 'list' ? styles.switchBtnActive : {}),
                  }}
                >
                  <List size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  title="Allow user to shift to Kanban View"
                  style={{
                    ...styles.switchBtn,
                    ...(viewMode === 'kanban' ? styles.switchBtnActive : {}),
                  }}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          {loading ? (
            <div style={styles.loadingContainer}>
              <span>Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyText}>No products found.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* ═════════════ LIST VIEW TABLE ═════════════ */
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={{ ...styles.th, width: 70, textAlign: 'center' }}>
                      <span style={{ display: 'block', marginBottom: 4 }}>Select</span>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        style={styles.checkbox}
                        aria-label="Select all products"
                      />
                    </th>
                    <th style={{ ...styles.th, width: 80, textAlign: 'center' }}>Image</th>
                    <th style={{ ...styles.th, textAlign: 'left' }}>Name</th>
                    <th style={{ ...styles.th, textAlign: 'left' }}>Sales Price</th>
                    <th style={{ ...styles.th, textAlign: 'left' }}>Category / SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isSelected = selectedIds.includes(p.id!);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => p.id && onSelectProduct(p.id)}
                        style={styles.bodyRow}
                      >
                        {/* Select Checkbox */}
                        <td
                          style={{ ...styles.td, textAlign: 'center' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => toggleSelect(p.id!, e as any)}
                            style={styles.checkbox}
                          />
                        </td>

                        {/* Image / Icon Thumbnail */}
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <div style={styles.avatarThumbnail}>
                            {renderProductIcon(p.type)}
                          </div>
                        </td>

                        {/* Name */}
                        <td style={{ ...styles.td, fontWeight: 600, color: 'var(--brown-900, #4A3A34)' }}>
                          {p.name}
                        </td>

                        {/* Sales Price */}
                        <td style={{ ...styles.td, color: 'var(--brown-900, #4A3A34)', fontWeight: 600 }}>
                          <Money amount={p.sales_price} />
                          {p.mrp && p.mrp !== '0.00' && (
                            <span style={{ fontSize: 11, color: 'var(--brown-500, #A8836C)', marginLeft: 6 }}>
                              (MRP: ₹{p.mrp})
                            </span>
                          )}
                        </td>

                        {/* Category / SKU */}
                        <td style={{ ...styles.td, color: 'var(--brown-700, #77574A)' }}>
                          <span>{p.category || 'General'}</span>
                          {p.sku && (
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--brown-500)', marginLeft: 6 }}>
                              [{p.sku}]
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ═════════════ KANBAN CARDS VIEW ═════════════ */
            <div style={styles.kanbanGrid}>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => p.id && onSelectProduct(p.id)}
                  style={styles.kanbanCard}
                >
                  {/* Left: Square Icon/Image */}
                  <div style={styles.kanbanImgBox}>
                    {renderProductIcon(p.type, 28)}
                  </div>

                  {/* Right: Details */}
                  <div style={styles.kanbanDetails}>
                    <div style={styles.kanbanName}>{p.name}</div>
                    <div style={styles.kanbanEmail}>
                      Sales: ₹{p.sales_price}
                      {p.mrp && p.mrp !== '0.00' ? ` | MRP: ₹${p.mrp}` : ''}
                    </div>
                    <div style={styles.kanbanPhone}>
                      {p.category || 'General'}
                      {p.type !== 'service' && ` • Stock: ${p.stock_qty || 0} units`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    background: 'var(--cream, #F9F2E4)',
    padding: '36px 20px 48px 20px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,

  container: {
    width: '100%',
    maxWidth: 960,
  } as React.CSSProperties,

  heading: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 22,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'center' as const,
    marginBottom: 18,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  card: {
    background: 'var(--surface, #FFFFFF)',
    borderRadius: 24,
    border: '1.5px solid var(--brown-400, #B8977E)',
    boxShadow: '0 8px 30px rgba(74, 58, 52, 0.07)',
    padding: '28px 36px 36px 36px',
    width: '100%',
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 28,
  } as React.CSSProperties,

  wireframeBtn: {
    padding: '7px 24px',
    border: '1.5px solid var(--brown-900, #4A3A34)',
    borderRadius: 12,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--brown-900, #4A3A34)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  wireframeBtnHover: {
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,

  searchWrapper: {
    flex: 1,
    maxWidth: 320,
    margin: '0 12px',
  } as React.CSSProperties,

  searchInput: {
    width: '100%',
    border: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 12,
    background: 'transparent',
    padding: '6px 16px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--brown-900, #4A3A34)',
    outline: 'none',
  } as React.CSSProperties,

  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  switcherContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px',
    borderRadius: 10,
    background: 'rgba(235, 215, 190, 0.35)',
    border: '1px solid var(--brown-300, #D2B79F)',
  } as React.CSSProperties,

  switchBtn: {
    padding: '5px 8px',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: 'var(--brown-700, #77574A)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 120ms ease',
  } as React.CSSProperties,

  switchBtnActive: {
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,

  loadingContainer: {
    padding: '48px 0',
    textAlign: 'center' as const,
    color: 'var(--brown-600, #8C6A58)',
    fontSize: 14,
  } as React.CSSProperties,

  emptyContainer: {
    padding: '48px 0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  emptyText: {
    color: 'var(--brown-500, #A8836C)',
    fontSize: 14,
  } as React.CSSProperties,

  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,

  headerRow: {
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
  } as React.CSSProperties,

  th: {
    padding: '12px 14px',
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--brown-900, #4A3A34)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  bodyRow: {
    borderBottom: '1px solid var(--brown-200, #E4D5C7)',
    cursor: 'pointer',
    transition: 'background 120ms ease',
  } as React.CSSProperties,

  td: {
    padding: '14px',
    fontSize: 13,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  checkbox: {
    accentColor: 'var(--brown-900, #4A3A34)',
    cursor: 'pointer',
    width: 16,
    height: 16,
  } as React.CSSProperties,

  avatarThumbnail: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--brown-300, #D2B79F)',
    background: 'rgba(235, 215, 190, 0.4)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as React.CSSProperties,

  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
    padding: '8px 0',
  } as React.CSSProperties,

  kanbanCard: {
    background: 'var(--surface, #FFFFFF)',
    border: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 18,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
    transition: 'transform 120ms ease, box-shadow 120ms ease',
  } as React.CSSProperties,

  kanbanImgBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    border: '1px solid var(--brown-300, #D2B79F)',
    background: 'rgba(235, 215, 190, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties,

  kanbanDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    overflow: 'hidden',
  } as React.CSSProperties,

  kanbanName: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,

  kanbanEmail: {
    fontSize: 12,
    color: 'var(--brown-700, #77574A)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,

  kanbanPhone: {
    fontSize: 12,
    color: 'var(--brown-600, #8C6A58)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
};

