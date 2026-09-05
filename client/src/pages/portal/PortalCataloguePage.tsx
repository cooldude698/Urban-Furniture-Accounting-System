import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { Box, Eye, Sparkles, SlidersHorizontal, Search, Check, ShoppingBag, ArrowLeft } from 'lucide-react';
import { formatINR } from '../../lib/money';
import { RoomArrangerDrawer, ROOM_PRESETS, type ArrangedItem, type RoomPreset } from './RoomArrangerDrawer';
import { usePortalAuth } from './PortalAuthGuard';
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
  const { user: currentUser } = usePortalAuth();
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Room Arranger & Budget Wallet State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budget, setBudget] = useState<number>(100000);
  const [arrangedItems, setArrangedItems] = useState<ArrangedItem[]>(() => {
    try {
      const saved = localStorage.getItem('urban_room_arrangement');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('urban_room_arrangement', JSON.stringify(arrangedItems));
    } catch {}
  }, [arrangedItems]);

  useEffect(() => {
    // Fetch catalogue
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

  // Arranger actions
  const handleAddItem = (product: CatalogueProduct) => {
    setArrangedItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) => (it.product.id === product.id ? { ...it, qty: it.qty + 1 } : it));
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleUpdateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setArrangedItems((prev) => prev.map((it) => (it.product.id === productId ? { ...it, qty } : it)));
  };

  const handleRemoveItem = (productId: number) => {
    setArrangedItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleClearArrangement = () => {
    setArrangedItems([]);
  };

  const handleLoadPreset = (preset: RoomPreset) => {
    const matchedProducts: CatalogueProduct[] = [];
    for (const sku of preset.skus) {
      const prod = products.find((p) => p.sku === sku);
      if (prod) {
        matchedProducts.push(prod);
      }
    }
    // Fallback if SKUs don't match exactly
    if (matchedProducts.length === 0 && products.length > 0) {
      matchedProducts.push(...products.slice(0, 3));
    }

    setArrangedItems(matchedProducts.map((p) => ({ product: p, qty: 1 })));
    setBudget(preset.targetBudget);
    setDrawerOpen(true);
  };

  const totalArrangedCost = arrangedItems.reduce((acc, it) => {
    return acc.plus(new Decimal(it.product.sales_price).times(it.qty));
  }, new Decimal(0));

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
                Furniture Catalogue & Room Arranger
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--brown-700)' }}>
                Inspect 3D pieces, set your personal budget wallet, or load pre-built room templates.
              </p>
            </div>

            {/* Room Arranger Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
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
              <span>🛋️</span>
              <span>Room Arranger & Wallet</span>
              {arrangedItems.length > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--posted)',
                    color: 'var(--cream)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 999,
                  }}
                >
                  {arrangedItems.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Ready-to-Use Room Presets Row ── */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Sparkles size={14} color="var(--warning)" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brown-800)', fontFamily: 'var(--font-display)' }}>
                Pre-Built Room Templates (Free Customizable Presets)
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {ROOM_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid rgba(208, 174, 146, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color 150ms ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{preset.icon}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--posted)',
                          backgroundColor: 'rgba(56, 102, 65, 0.08)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        ~{formatINR(preset.targetBudget.toFixed(2))}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brown-900)', fontFamily: 'var(--font-display)' }}>
                      {preset.name}
                    </div>
                    <p style={{ margin: '4px 0 10px', fontSize: 11, color: 'var(--brown-600)', lineHeight: 1.4 }}>
                      {preset.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--cream)',
                      border: '1px solid rgba(208, 174, 146, 0.60)',
                      color: 'var(--brown-800)',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      cursor: 'pointer',
                      transition: 'background 120ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brown-100)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
                  >
                    <span>Load This Layout</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Advanced Filter & Range Toolbar ── */}
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
            {/* Top Toolbar: Search + Category Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or SKU…"
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    border: '1px solid rgba(208, 174, 146, 0.60)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--cream)',
                    color: 'var(--brown-900)',
                    outline: 'none',
                  }}
                />
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--brown-500)',
                  }}
                />
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                        border: isActive ? '1px solid var(--brown-900)' : '1px solid rgba(208, 174, 146, 0.45)',
                        backgroundColor: isActive ? 'var(--brown-900)' : 'var(--cream)',
                        color: isActive ? 'var(--cream)' : 'var(--brown-700)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Toolbar: Price Range Slider & In-Stock Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                paddingTop: 12,
                borderTop: '1px solid rgba(208, 174, 146, 0.25)',
              }}
            >
              {/* Max Price Range Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 280 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', whiteSpace: 'nowrap' }}>
                  Max Price: <strong style={{ color: 'var(--brown-900)', fontFamily: 'var(--font-mono)' }}>{formatINR(maxPrice.toFixed(2))}</strong>
                </span>
                <input
                  type="range"
                  min={10000}
                  max={100000}
                  step={5000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--brown-800)', cursor: 'pointer' }}
                />
              </div>

              {/* In-Stock Toggle */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--brown-800)' }}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  style={{ accentColor: 'var(--brown-800)', cursor: 'pointer' }}
                />
                <span>Show Only In-Stock Items</span>
              </label>

              {/* Items Counter */}
              <div style={{ fontSize: 12, color: 'var(--brown-600)' }}>
                Showing <strong style={{ color: 'var(--brown-900)' }}>{filteredProducts.length}</strong> of {products.length} pieces
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading / Error State ── */}
        {loading && (
          <div
            style={{
              padding: '64px 0',
              textAlign: 'center',
              color: 'var(--brown-700)',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Loading furniture showroom...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid rgba(158, 74, 56, 0.3)',
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Product Grid ── */}
        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {filteredProducts.map((p) => {
              const stock = parseFloat(p.stock_qty) || 0;
              const hasMrpDiff = p.mrp && p.mrp !== p.sales_price;
              const hasModel = Boolean(p.model_url);
              const imgFailed = imageErrors[p.id];
              const arrangedEntry = arrangedItems.find((it) => it.product.id === p.id);
              const isArranged = Boolean(arrangedEntry);
              const arrangedQty = arrangedEntry?.qty || 0;

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(208, 174, 146, 0.35)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                  }}
                >
                  {/* Thumbnail Image (16:9 ratio) */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      backgroundColor: 'var(--brown-100)',
                      overflow: 'hidden',
                    }}
                  >
                    {p.image_url && !imgFailed ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        onError={() => handleImageError(p.id)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
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
                          background: 'linear-gradient(135deg, var(--brown-900) 0%, var(--brown-700) 100%)',
                          color: 'var(--cream)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 28,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            opacity: 0.9,
                          }}
                        >
                          {getInitials(p.name)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--brown-300)',
                            marginTop: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {p.category || 'Furniture'}
                        </div>
                      </div>
                    )}

                    {/* 3D Indicator Badge on Thumbnail */}
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
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(74, 58, 52, 0.85)',
                          backdropFilter: 'blur(4px)',
                          color: 'var(--cream)',
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
                              <span>3D View</span>
                            </>
                          ) : (
                            <>
                              <Eye size={14} />
                              <span>Details</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAddItem(p)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isArranged ? 'var(--posted)' : 'var(--brown-900)',
                            color: 'var(--cream)',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          {isArranged ? (
                            <>
                              <Check size={14} />
                              <span>In Room ({arrangedQty})</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={14} />
                              <span>+ Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* ── Floating Room Arranger Bar at Bottom Right ── */}
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 28,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'var(--brown-900)',
            color: 'var(--cream)',
            padding: '10px 20px',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            transition: 'transform 150ms ease',
          }}
          onClick={() => setDrawerOpen(true)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛋️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--cream)' }}>
                Room Arranger & Budget Wallet
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brown-300)' }}>
                {arrangedItems.length} piece{arrangedItems.length === 1 ? '' : 's'} • {formatINR(totalArrangedCost.toFixed(2))} / {formatINR(budget.toFixed(2))}
              </div>
            </div>
          </div>
          <button
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              backgroundColor: 'var(--cream)',
              color: 'var(--brown-900)',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              marginLeft: 8,
            }}
          >
            Open Layout →
          </button>
        </div>

        {/* ── Slide-Over Room Arranger Drawer ── */}
        <RoomArrangerDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          items={arrangedItems}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClear={handleClearArrangement}
          budget={budget}
          onSetBudget={setBudget}
          allProducts={products}
          onAddItem={handleAddItem}
          onLoadPreset={handleLoadPreset}
          currentUser={currentUser}
        />
    </div>
  );
};

export default PortalCataloguePage;
