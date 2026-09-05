import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Eye, Sparkles, Search, Layers, ArrowRight } from 'lucide-react';
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

const CATEGORIES = ['All', 'Seating', 'Tables', 'Storage', 'Beds'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

export const PortalCataloguePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
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

  const handleImageError = (id: number) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  const filteredProducts = products.filter((p) => {
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
    // 3. Price range
    const price = parseFloat(p.sales_price) || 0;
    if (price > maxPrice) {
      return false;
    }
    // 4. In stock
    if (onlyInStock) {
      const stock = parseFloat(p.stock_qty) || 0;
      if (stock <= 0) return false;
    }
    return true;
  });

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-body)' }}>
      {/* Header section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--brown-700)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Showroom Collection
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
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                <Sparkles size={11} />
                3D Interactive
              </span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                lineHeight: '40px',
                fontWeight: 700,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Furniture Catalogue
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--brown-700)' }}>
              Handcrafted architectural pieces designed for serene Japandi living.
            </p>
          </div>

          {/* Direct CTA to 3D Room Studio */}
          <button
            onClick={() => navigate('/portal/studio')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              borderRadius: 'var(--radius-sm, 6px)',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5c4033')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-900)')}
          >
            <Layers size={16} />
            <span>Open 3D Room Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* ── Category Filter Pills & Search Bar ── */}
        <div
          style={{
            marginTop: 24,
            backgroundColor: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.40)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Top row: Category pills & Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Category pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: 'var(--font-display)',
                      backgroundColor: isActive ? 'var(--brown-900)' : 'transparent',
                      color: isActive ? 'var(--cream)' : 'var(--brown-800)',
                      border: isActive ? '1px solid var(--brown-900)' : '1px solid rgba(208, 174, 146, 0.4)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--brown-600)',
                }}
              />
              <input
                type="text"
                placeholder="Search collection or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(208, 174, 146, 0.5)',
                  backgroundColor: 'var(--cream)',
                  fontSize: 13,
                  color: 'var(--brown-900)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          {/* Bottom row: Filter stats, price slider, and in-stock checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              paddingTop: 12,
              borderTop: '1px solid rgba(208, 174, 146, 0.25)',
              fontSize: 12,
              color: 'var(--brown-700)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* Max price slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Max Price:</span>
                <input
                  type="range"
                  min={1000}
                  max={150000}
                  step={2000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ accentColor: 'var(--brown-900)', cursor: 'pointer', width: 110 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brown-900)' }}>
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {/* In-Stock filter */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  style={{ accentColor: 'var(--brown-900)', cursor: 'pointer' }}
                />
                <span>In Stock only</span>
              </label>
            </div>

            <div>
              Showing <strong style={{ color: 'var(--brown-900)' }}>{filteredProducts.length}</strong> of {products.length} pieces
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            gap: 12,
            color: 'var(--brown-600)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--brown-200)',
              borderTopColor: 'var(--brown-900)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Loading furniture collection...</span>
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(158, 74, 56, 0.25)',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(208, 174, 146, 0.3)',
            color: 'var(--brown-700)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brown-900)', marginBottom: 6 }}>
            No pieces match your filters
          </div>
          <p style={{ fontSize: 13, margin: '0 0 16px' }}>
            Try adjusting your category filter, price limit, or search keyword.
          </p>
          <button
            onClick={() => {
              setActiveCategory('All');
              setSearchQuery('');
              setMaxPrice(100000);
              setOnlyInStock(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {filteredProducts.map((p) => {
            const stock = parseFloat(p.stock_qty) || 0;
            const hasMrpDiff = p.mrp && p.mrp !== p.sales_price;
            const hasImage = p.image_url && !imageErrors[p.id];
            const hasModel = !!p.model_url;

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid rgba(208, 174, 146, 0.35)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Image / Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 10',
                    backgroundColor: 'var(--brown-100)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {hasImage ? (
                    <img
                      src={p.image_url!}
                      alt={p.name}
                      onError={() => handleImageError(p.id)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#E6D5C3',
                        color: 'var(--brown-800)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.05em',
                          opacity: 0.8,
                        }}
                      >
                        {getInitials(p.name)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginTop: 4 }}>
                        {p.category || 'Furniture'}
                      </span>
                    </div>
                  )}

                  {/* 3D badge overlay */}
                  {hasModel && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(74, 58, 52, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Box size={13} />
                      3D
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div
                  style={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  {/* Category pill & SKU */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        backgroundColor: 'rgba(74, 58, 52, 0.08)',
                        color: 'var(--brown-700)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {p.category || 'Goods'}
                    </span>

                    {p.sku && (
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--brown-500)',
                        }}
                      >
                        {p.sku}
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--brown-900)',
                      margin: '0 0 14px',
                      lineHeight: '22px',
                      minHeight: 44,
                    }}
                  >
                    {p.name}
                  </h2>

                  {/* Price Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--brown-900)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatINR(p.sales_price)}
                    </span>

                    {hasMrpDiff && p.mrp && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          color: 'var(--brown-500)',
                          textDecoration: 'line-through',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatINR(p.mrp)}
                      </span>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <div style={{ marginBottom: 18 }}>
                    {stock <= 0 ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          border: '1px solid rgba(158, 74, 56, 0.3)',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        Out of Stock
                      </span>
                    ) : stock < 5 ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--warning-bg)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(192, 138, 62, 0.3)',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        Low Stock ({stock})
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--posted-bg)',
                          color: 'var(--posted)',
                          border: '1px solid rgba(95, 112, 82, 0.3)',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        In Stock
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/portal/catalogue/${p.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--brown-900)',
                          border: '1px solid var(--brown-300)',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-100)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                      >
                        {hasModel ? (
                          <>
                            <Box size={14} />
                            <span>Inspect 3D</span>
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            <span>Details</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate(`/portal/studio?model=${encodeURIComponent(p.model_url || p.name)}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--brown-900)',
                          color: 'var(--cream)',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5c4033')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-900)')}
                      >
                        <Layers size={14} />
                        <span>Place in Room</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalCataloguePage;
