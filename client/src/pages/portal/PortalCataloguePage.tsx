import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Eye,
  Sparkles,
  Search,
  Layers,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Check,
  X,
  Compass,
  ArrowUpDown,
  Armchair,
  Bed,
  Utensils,
  Package,
  Lamp,
  Palette,
} from 'lucide-react';
import { formatINR } from '../../lib/money';
import api from '../../lib/axios';

export interface CatalogueProduct {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  sales_price: string;
  mrp: string | null;
  tax_rate: string;
  stock_qty: string;
  model_url: string | null;
  image_url: string | null;
}

const CATEGORIES = [
  { id: 'All', label: 'All Pieces', icon: Layers },
  { id: 'Seating', label: 'Seating', icon: Armchair },
  { id: 'Tables', label: 'Tables & Desks', icon: Utensils },
  { id: 'Storage', label: 'Storage & TV', icon: Package },
  { id: 'Beds', label: 'Beds & Suites', icon: Bed },
  { id: 'Lighting', label: 'Lighting', icon: Lamp },
  { id: 'Decor', label: 'Rugs & Decor', icon: Palette },
] as const;

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export const PortalCataloguePage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (!['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/api/portal/catalogue')
      .then((res) => {
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || err.message || 'Error loading catalogue');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter & Sort Pipeline
  const filteredAndSorted = useMemo(() => {
    let list = products.filter((p) => {
      // 1. Category
      if (activeCategory !== 'All' && p.category?.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      // 3. In stock
      if (onlyInStock) {
        const stock = parseFloat(p.stock_qty) || 0;
        if (stock <= 0) return false;
      }
      return true;
    });

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => parseFloat(a.sales_price) - parseFloat(b.sales_price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => parseFloat(b.sales_price) - parseFloat(a.sales_price));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, activeCategory, searchQuery, onlyInStock, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      const c = p.category || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
      {/* ── 1. Showroom Header Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          borderBottom: '1px solid rgba(208, 174, 146, 0.3)',
          paddingBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--brown-600)',
                fontFamily: 'var(--font-display)',
              }}
            >
              ARCHITECTURAL SHOWROOM
            </span>
            <span style={{ color: 'var(--brown-300)' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--posted)',
                backgroundColor: 'var(--posted-bg)',
                padding: '2px 9px',
                borderRadius: 999,
              }}
            >
              <Sparkles size={11} />
              {products.length ? `${products.length} Curated Masterpieces` : 'Curated Masterpieces'}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--brown-900)',
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
            }}
          >
            Furniture Catalogue
          </h1>

          <p style={{ margin: 0, fontSize: 15, color: 'var(--brown-700)', maxWidth: 640, lineHeight: 1.5 }}>
            Solid teak, oak, walnut, and organic linens designed for calm Japandi architecture. Every piece is backed by our verified double-entry ledger.
          </p>
        </div>

        {/* Action Button to Launch 3D Studio */}
        <button
          onClick={() => navigate('/portal/studio')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: 'var(--brown-900)',
            color: 'var(--cream)',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(74, 58, 52, 0.18)',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(74, 58, 52, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 58, 52, 0.18)';
          }}
        >
          <Compass size={16} />
          <span>Launch 3D Room Planner</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* ── 2. Category Selector Pills ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const Icon = cat.icon;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 15px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: isSelected ? 700 : 500,
                fontFamily: 'var(--font-display)',
                backgroundColor: isSelected ? 'var(--brown-900)' : 'rgba(255, 255, 255, 0.85)',
                color: isSelected ? 'var(--cream)' : 'var(--brown-900)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--brown-900)' : 'rgba(208, 174, 146, 0.45)',
                boxShadow: isSelected ? '0 2px 8px rgba(74, 58, 52, 0.18)' : '0 1px 3px rgba(74, 58, 52, 0.03)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--brown-700)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.45)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                }
              }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(208, 174, 146, 0.25)',
                  color: isSelected ? 'var(--cream)' : 'var(--brown-700)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Search & Filter Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid rgba(208, 174, 146, 0.4)',
          boxShadow: '0 2px 8px rgba(74, 58, 52, 0.04)',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FAF7F2',
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(208, 174, 146, 0.45)',
            flex: '1 1 280px',
            maxWidth: 420,
          }}
        >
          <Search size={15} color="var(--brown-600)" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by piece name, wood species, SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: 'var(--brown-900)',
              width: '100%',
            }}
          />
          {!searchQuery ? (
            <kbd
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(208, 174, 146, 0.25)',
                color: 'var(--brown-600)',
                padding: '2px 5px',
                borderRadius: 4,
                border: '1px solid rgba(208, 174, 146, 0.4)',
                userSelect: 'none',
              }}
            >
              ⌘K
            </kbd>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'var(--brown-600)',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right controls: In-Stock Toggle & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* In Stock toggle */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              color: 'var(--brown-900)',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => {
                setOnlyInStock(e.target.checked);
                setCurrentPage(1);
              }}
              style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
            />
            <span>In Stock Only</span>
          </label>

          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(208, 174, 146, 0.4)' }} />

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={13} color="var(--brown-600)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                border: '1px solid rgba(208, 174, 146, 0.45)',
                borderRadius: 8,
                padding: '6px 10px',
                backgroundColor: '#FAF7F2',
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--brown-900)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="default">Curated Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical (A–Z)</option>
            </select>
          </div>

          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--brown-600)' }}>
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>
      </div>

      {/* ── 4. Product Cards Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--brown-600)' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Loading architectural showroom...</div>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 20,
            padding: '64px 32px',
            textAlign: 'center',
            border: '1px solid rgba(208, 174, 146, 0.35)',
          }}
        >
          <Box size={36} color="var(--brown-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--brown-900)', margin: '0 0 6px' }}>
            No furniture pieces match your filter
          </h3>
          <p style={{ fontSize: 13, color: 'var(--brown-600)', margin: '0 0 16px' }}>
            Try resetting your search query or selecting "All Pieces".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
              setOnlyInStock(false);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 22,
          }}
        >
          {paginatedProducts.map((product) => {
            const price = parseFloat(product.sales_price);
            const mrp = product.mrp ? parseFloat(product.mrp) : null;
            const hasSavings = mrp && mrp > price;
            const stock = parseFloat(product.stock_qty) || 0;
            const isStocked = stock > 0;

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/portal/catalogue/${product.id}`)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid rgba(208, 174, 146, 0.35)',
                  boxShadow: '0 4px 16px rgba(74, 58, 52, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(74, 58, 52, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--brown-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 58, 52, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.35)';
                }}
              >
                {/* Image Container with Smooth Zoom */}
                <div
                  style={{
                    position: 'relative',
                    height: 220,
                    overflow: 'hidden',
                    backgroundColor: '#F7F3EC',
                  }}
                >
                  <img
                    src={product.image_url || '/images/products/aspen-lounge-sofa.jpg'}
                    alt={product.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 360ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1.0)';
                    }}
                  />

                  {/* 3D Available Badge */}
                  {product.model_url && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(74, 58, 52, 0.92)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--cream)',
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        padding: '4px 9px',
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <Box size={11} />
                      <span>3D Model</span>
                    </div>
                  )}

                  {/* Category tag */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      backdropFilter: 'blur(8px)',
                      color: 'var(--brown-900)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {product.category || 'Furniture'}
                  </div>
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* SKU */}
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--brown-500)',
                        marginBottom: 4,
                      }}
                    >
                      {product.sku || 'UF-PIECE'}
                    </div>

                    {/* Product Name */}
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--brown-900)',
                        margin: '0 0 10px',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div>
                    {/* Price & Savings */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 18,
                          fontWeight: 800,
                          color: 'var(--brown-900)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatINR(product.sales_price)}
                      </span>

                      {hasSavings && (
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brown-500)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatINR(product.mrp!)}
                        </span>
                      )}
                    </div>

                    {/* Footer Row: Stock Badge & Inspect CTA */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 10,
                        borderTop: '1px solid rgba(208, 174, 146, 0.25)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                          color: isStocked ? 'var(--posted)' : 'var(--brown-600)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isStocked ? 'var(--posted)' : 'var(--brown-400)',
                          }}
                        />
                        <span>{isStocked ? `${Math.round(stock)} in stock` : 'Made to order'}</span>
                      </span>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          color: 'var(--brown-900)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        View <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Pagination Bar ── */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(208, 174, 146, 0.45)',
              backgroundColor: currentPage === 1 ? 'transparent' : 'var(--surface)',
              color: currentPage === 1 ? 'var(--brown-400)' : 'var(--brown-900)',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous
          </button>

          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--brown-700)',
              padding: '0 8px',
            }}
          >
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(208, 174, 146, 0.45)',
              backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--surface)',
              color: currentPage === totalPages ? 'var(--brown-400)' : 'var(--brown-900)',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PortalCataloguePage;
