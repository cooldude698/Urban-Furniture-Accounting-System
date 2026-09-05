import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Box, Eye, Sparkles, LogIn, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { formatINR } from '../../lib/money';

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
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [currentUser, setCurrentUser] = useState<{ full_name: string; login_id: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/portal/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.user) {
          setCurrentUser(json.data.user);
        }
      })
      .catch(() => {});

    // Fetch catalogue
    fetch('/api/portal/catalogue')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load catalogue');
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setProducts(json.data);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error loading catalogue');
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
    if (activeCategory === 'All') return true;
    return p.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        color: 'var(--brown-900)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── Top Portal Header ── */}
      <header
        style={{
          backgroundColor: 'var(--brown-900)',
          color: 'var(--cream)',
          borderBottom: '1px solid rgba(74, 58, 52, 0.35)',
          boxShadow: 'var(--shadow-sm)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 56,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <BrandLogo size={32} variant="light" badge={true} subtitle="Customer Portal Surface" />

          {/* Navigation links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 4,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <NavLink
              to="/portal/catalogue"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                borderRadius: 7,
                textDecoration: 'none',
                backgroundColor: 'var(--cream)',
                color: 'var(--brown-900)',
              }}
            >
              Catalogue
            </NavLink>
            <NavLink
              to="/portal/invoices"
              style={({ isActive }) => ({
                padding: '6px 14px',
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                borderRadius: 7,
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--cream)' : 'transparent',
                color: isActive ? 'var(--brown-900)' : 'var(--brown-300)',
              })}
            >
              Customer Invoices
            </NavLink>
            <NavLink
              to="/portal/bills"
              style={({ isActive }) => ({
                padding: '6px 14px',
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                borderRadius: 7,
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--cream)' : 'transparent',
                color: isActive ? 'var(--brown-900)' : 'var(--brown-300)',
              })}
            >
              Vendor Bills
            </NavLink>
          </nav>
        </div>

        {/* User or Sign in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--brown-700)',
                  color: 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {currentUser.full_name ? currentUser.full_name[0].toUpperCase() : 'U'}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--cream)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {currentUser.full_name}
              </span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/portal/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--cream)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <LogIn size={14} />
              Portal Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Main Container ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '36px 32px 64px' }}>
        {/* Header section */}
        <div style={{ marginBottom: 32 }}>
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
                Browse our handcrafted architectural furniture collection with interactive 3D inspection.
              </p>
            </div>

            <div style={{ fontSize: 13, color: 'var(--brown-700)', alignSelf: 'flex-end' }}>
              Showing <strong style={{ color: 'var(--brown-900)' }}>{filteredProducts.length}</strong> items
            </div>
          </div>

          {/* ── Category Filter Row ── */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    border: isActive ? '1px solid var(--brown-900)' : '1px solid rgba(208, 174, 146, 0.45)',
                    backgroundColor: isActive ? 'var(--brown-900)' : 'var(--surface)',
                    color: isActive ? 'var(--cream)' : 'var(--brown-700)',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {cat}
                </button>
              );
            })}
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

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto' }}>
                      <button
                        onClick={() => navigate(`/portal/catalogue/${p.id}`)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: hasModel ? 'var(--brown-900)' : 'var(--surface)',
                          color: hasModel ? 'var(--cream)' : 'var(--brown-900)',
                          border: hasModel ? 'none' : '1px solid var(--brown-300)',
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          boxShadow: hasModel ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        {hasModel ? (
                          <>
                            <Box size={15} />
                            View in 3D
                          </>
                        ) : (
                          <>
                            <Eye size={15} />
                            Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PortalCataloguePage;
