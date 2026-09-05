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
  ChevronLeft,
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
  BookOpen,
  Grid,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { formatINR } from '../../lib/money';
import api from '../../lib/axios';
import { playWoodClick } from '../../lib/soundEffects';

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
  { id: 'All', label: 'All Pieces', chapter: '00', icon: Layers },
  { id: 'Seating', label: 'Seating & Lounge', chapter: '01', icon: Armchair },
  { id: 'Tables', label: 'Dining & Desks', chapter: '02', icon: Utensils },
  { id: 'Storage', label: 'Storage & TV', chapter: '03', icon: Package },
  { id: 'Beds', label: 'Beds & Suites', chapter: '04', icon: Bed },
  { id: 'Lighting', label: 'Lighting', chapter: '05', icon: Lamp },
  { id: 'Decor', label: 'Rugs & Decor', chapter: '06', icon: Palette },
] as const;

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type ViewMode = 'lookbook' | 'grid';

const WOOD_FINISHES = [
  { name: 'Japandi Light Oak', color: '#D8C5A8', border: '#C0AD92' },
  { name: 'Warm Heritage Teak', color: '#C28247', border: '#A66B35' },
  { name: 'Dark Walnut', color: '#4A3326', border: '#35241A' },
  { name: 'Smoked Charcoal', color: '#2C2D2F', border: '#1D1E1F' },
];

export const PortalCataloguePage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'lookbook' (Magazine Spreads) vs 'grid' (Collection Grid)
  const [viewMode, setViewMode] = useState<ViewMode>('lookbook');
  const [currentSpread, setCurrentSpread] = useState(0);

  // Filters & Sorting
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTocModal, setShowTocModal] = useState(false);
  const itemsPerPage = 16;

  // Keyboard shortcut for Cmd+K search
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

  // Lookbook curated spreads: Spread 0 is Manifesto, Spread 1..N each holds 1 primary feature piece
  const lookbookItems = useMemo(() => {
    return filteredAndSorted.slice(0, 12);
  }, [filteredAndSorted]);

  const totalSpreads = 1 + lookbookItems.length;

  // Pagination calculation for grid mode
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const handleCategoryChange = (cat: string) => {
    playWoodClick(1.0);
    setActiveCategory(cat);
    setCurrentPage(1);
    setCurrentSpread(cat === 'All' ? 0 : 1);
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

  const currentPiece = currentSpread > 0 ? lookbookItems[currentSpread - 1] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
      {/* ── Editorial Masthead Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          borderBottom: '1px solid rgba(208, 174, 146, 0.35)',
          paddingBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--brown-600)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              LOARID &bull; URBAN FURNITURE EST. 1998
            </span>
            <span style={{ color: 'var(--brown-300)' }}>&bull;</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--posted)',
                backgroundColor: 'var(--posted-bg)',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              AUTUMN / WINTER 2026 EDITION
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--brown-900)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}
          >
            Furniture Catalogue
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: 'var(--brown-700)',
              maxWidth: 620,
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            &ldquo;Designed for people, not consumers.&rdquo; Minimal architectural silhouettes crafted in solid oak, teak, walnut, and Belgian linens.
          </p>
        </div>

        {/* View Mode Switcher & 3D Planner CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Magazine Lookbook vs Gallery Grid Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              backgroundColor: 'rgba(240, 234, 224, 0.7)',
              padding: 4,
              borderRadius: 8,
              border: '1px solid rgba(208, 174, 146, 0.45)',
            }}
          >
            <button
              onClick={() => {
                playWoodClick(0.9);
                setViewMode('lookbook');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: viewMode === 'lookbook' ? 700 : 500,
                fontFamily: 'var(--font-display)',
                backgroundColor: viewMode === 'lookbook' ? 'var(--brown-900)' : 'transparent',
                color: viewMode === 'lookbook' ? 'var(--cream)' : 'var(--brown-800)',
                cursor: 'pointer',
                boxShadow: viewMode === 'lookbook' ? '0 2px 6px rgba(44, 34, 30, 0.18)' : 'none',
                transition: 'all 140ms ease',
              }}
            >
              <BookOpen size={14} />
              <span>Editorial Lookbook</span>
            </button>

            <button
              onClick={() => {
                playWoodClick(0.9);
                setViewMode('grid');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: viewMode === 'grid' ? 700 : 500,
                fontFamily: 'var(--font-display)',
                backgroundColor: viewMode === 'grid' ? 'var(--brown-900)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--cream)' : 'var(--brown-800)',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(44, 34, 30, 0.18)' : 'none',
                transition: 'all 140ms ease',
              }}
            >
              <Grid size={14} />
              <span>Atelier Grid</span>
            </button>
          </div>

          {/* Launch 3D Studio Button */}
          <button
            onClick={() => navigate('/portal/studio')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              borderRadius: 8,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(74, 58, 52, 0.18)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(74, 58, 52, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 58, 52, 0.18)';
            }}
          >
            <Compass size={15} />
            <span>3D Room Studio</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Chapter Bar / Category Navigation ── */}
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
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                fontFamily: 'var(--font-display)',
                backgroundColor: isSelected ? 'var(--brown-900)' : 'rgba(255, 255, 255, 0.85)',
                color: isSelected ? 'var(--cream)' : 'var(--brown-900)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--brown-900)' : 'rgba(208, 174, 146, 0.45)',
                boxShadow: isSelected ? '0 2px 6px rgba(74, 58, 52, 0.16)' : '0 1px 2px rgba(74, 58, 52, 0.03)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 140ms ease',
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
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: isSelected ? 0.8 : 0.6 }}>
                {cat.chapter}
              </span>
              <Icon size={13} />
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: 10,
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

      {/* ── Search & Filter Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: 10,
          border: '1px solid rgba(208, 174, 146, 0.35)',
          boxShadow: '0 1px 4px rgba(74, 58, 52, 0.03)',
        }}
      >
        {/* Search input with ⌘K badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FAF7F2',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(208, 174, 146, 0.4)',
            flex: '1 1 260px',
            maxWidth: 420,
          }}
        >
          <Search size={14} color="var(--brown-600)" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search piece name, wood species, SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 12.5,
              fontFamily: 'var(--font-body)',
              color: 'var(--brown-900)',
              width: '100%',
            }}
          />
          {!searchQuery ? (
            <kbd
              style={{
                fontSize: 9.5,
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
              gap: 6,
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

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={12} color="var(--brown-600)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                border: '1px solid rgba(208, 174, 146, 0.4)',
                borderRadius: 6,
                padding: '5px 8px',
                backgroundColor: '#FAF7F2',
                fontSize: 11.5,
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

          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--brown-600)' }}>
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>
      </div>

      {/* ── 4. Main Showcase Presentation ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--brown-600)' }}>
          <div style={{ display: 'inline-block', width: 30, height: 30, border: '3px solid rgba(74, 58, 52, 0.2)', borderTop: '3px solid var(--brown-900)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Curating architectural lookbook...</div>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            padding: '64px 32px',
            textAlign: 'center',
            border: '1px solid rgba(208, 174, 146, 0.35)',
          }}
        >
          <Box size={36} color="var(--brown-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--brown-900)', margin: '0 0 6px' }}>
            No pieces match your search filter
          </h3>
          <p style={{ fontSize: 13, color: 'var(--brown-600)', margin: '0 0 16px' }}>
            Try resetting your search query or selecting &ldquo;All Pieces&rdquo;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
              setOnlyInStock(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
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
      ) : viewMode === 'lookbook' ? (
        /* ══════════════════════════════════════════════════════════════════
           EDITORIAL LOOKBOOK: DUAL-PAGE SPREAD READER (Inspired by LOARID)
           ══════════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dual Page Magazine Spread Container */}
          <div
            style={{
              backgroundColor: '#FAF7F2',
              borderRadius: 12,
              border: '1px solid rgba(208, 174, 146, 0.4)',
              boxShadow: '0 16px 48px -8px rgba(44, 34, 30, 0.1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Center Spine Fold Shadow Effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: 28,
                transform: 'translateX(-50%)',
                background: 'linear-gradient(90deg, rgba(44, 34, 30, 0.05) 0%, rgba(44, 34, 30, 0.14) 50%, rgba(44, 34, 30, 0.05) 100%)',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />

            {/* SPREAD CONTENT */}
            {currentSpread === 0 ? (
              /* ── SPREAD 0: COVER & MANIFESTO SPREAD ── */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  minHeight: 560,
                }}
              >
                {/* Left Page: Manifesto & Contents */}
                <div
                  style={{
                    padding: '48px 44px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRight: '1px solid rgba(208, 174, 146, 0.25)',
                    backgroundColor: '#FAF7F2',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--brown-600)',
                        marginBottom: 16,
                      }}
                    >
                      URBAN FURNITURE &bull; ATELIER ARCHIVE
                    </div>

                    <h2
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 32,
                        fontWeight: 800,
                        lineHeight: 1.15,
                        color: 'var(--brown-900)',
                        letterSpacing: '-0.02em',
                        margin: '0 0 16px',
                      }}
                    >
                      DESIGNED FOR PEOPLE, NOT CONSUMERS
                    </h2>

                    <p
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        color: 'var(--brown-700)',
                        margin: '0 0 24px',
                      }}
                    >
                      In an era of disposable mass manufacturing, our atelier designs pieces to endure across generations. Every silhouette is sculpted from sustainably harvested White Oak, Indonesian Reclaimed Teak, and American Black Walnut, finished with hand-rubbed organic tree-sap oils.
                    </p>

                    {/* Table of Contents Index */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(208, 174, 146, 0.35)',
                        paddingTop: 18,
                        marginTop: 18,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--brown-600)',
                          marginBottom: 10,
                        }}
                      >
                        TABLE OF CONTENTS
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {CATEGORIES.slice(1).map((cat, idx) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              playWoodClick(1.0);
                              setActiveCategory(cat.id);
                              setCurrentSpread(1);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: 'var(--brown-800)',
                              cursor: 'pointer',
                              padding: '2px 0',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--brown-900)';
                              e.currentTarget.style.fontWeight = '700';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--brown-800)';
                              e.currentTarget.style.fontWeight = '400';
                            }}
                          >
                            <span>{cat.chapter} &mdash; {cat.label.toUpperCase()}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--brown-600)' }}>
                              P. 0{idx * 4 + 4}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Left Page Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brown-500)',
                      borderTop: '1px solid rgba(208, 174, 146, 0.25)',
                      paddingTop: 12,
                    }}
                  >
                    <span>VOL. IV / 2026</span>
                    <span>SPREAD 01 &bull; COVER</span>
                  </div>
                </div>

                {/* Right Page: Atmospheric Editorial Cover Photo */}
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#261914',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 40,
                  }}
                >
                  <img
                    src="/images/products/aspen-lounge-sofa.jpg"
                    alt="Urban Furniture Lookbook Cover"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(38, 25, 20, 0.3) 0%, rgba(38, 25, 20, 0.75) 100%)',
                    }}
                  />

                  {/* Top Cover Brandmark */}
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.15em',
                        color: 'var(--brown-200)',
                        textTransform: 'uppercase',
                      }}
                    >
                      MINIMAL ARCHITECTURAL LIVING
                    </span>
                  </div>

                  {/* Bottom Cover Title & Turn Button */}
                  <div style={{ position: 'relative', zIndex: 2, color: 'var(--cream)' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 26,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        margin: '0 0 8px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      THE SCANDINAVIAN SUITE
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--brown-200)', margin: '0 0 20px', lineHeight: 1.4 }}>
                      Organic textures and solid hardwood joinery designed for acoustic serenity.
                    </p>

                    <button
                      onClick={() => {
                        playWoodClick(1.0);
                        setCurrentSpread(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--brown-900)',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                        transition: 'all 140ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--cream)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <span>Explore Collection Spreads</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : currentPiece ? (
              /* ── SPREAD 1..N: INDIVIDUAL PIECE EDITORIAL BROCHURE SPREAD ── */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.05fr 1fr',
                  minHeight: 560,
                }}
              >
                {/* Left Page: Large Editorial Lifestyle Shot */}
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#F3EFE9',
                    borderRight: '1px solid rgba(208, 174, 146, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <img
                    src={currentPiece.image_url || '/images/products/aspen-lounge-sofa.jpg'}
                    alt={currentPiece.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      maxHeight: 560,
                    }}
                  />

                  {/* Chapter Tag Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 24,
                      left: 24,
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brown-900)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    CHAPTER 0{Math.min(currentSpread, 9)} &bull; {currentPiece.category || 'FURNITURE'}
                  </div>

                  {/* 3D Launch CTA on Photo */}
                  {currentPiece.model_url && (
                    <button
                      onClick={() => navigate(`/portal/studio?model=${encodeURIComponent(currentPiece.model_url!)}`)}
                      style={{
                        position: 'absolute',
                        bottom: 24,
                        left: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(38, 25, 20, 0.92)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--cream)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        transition: 'all 140ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--brown-900)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(38, 25, 20, 0.92)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <Compass size={14} />
                      <span>Place in 3D Room Studio</span>
                    </button>
                  )}
                </div>

                {/* Right Page: Editorial Specs & Architecture Narrative */}
                <div
                  style={{
                    padding: '44px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#FAF7F2',
                  }}
                >
                  <div>
                    {/* Chapter & SKU Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                        borderBottom: '1px solid rgba(208, 174, 146, 0.25)',
                        paddingBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--brown-600)',
                        }}
                      >
                        PIECE N° 0{currentSpread} &bull; {currentPiece.sku || 'UF-PIECE'}
                      </span>

                      {parseFloat(currentPiece.stock_qty || '0') > 0 ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--posted)',
                            backgroundColor: 'var(--posted-bg)',
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          READY TO SHIP ({Math.round(parseFloat(currentPiece.stock_qty))} AVAILABLE)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brown-600)',
                            backgroundColor: 'rgba(208, 174, 146, 0.2)',
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          MADE TO ORDER ATELIER
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h2
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 26,
                        fontWeight: 800,
                        color: 'var(--brown-900)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.25,
                        margin: '0 0 10px',
                      }}
                    >
                      {currentPiece.name}
                    </h2>

                    {/* Curated Editorial Description */}
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'var(--brown-700)',
                        margin: '0 0 20px',
                      }}
                    >
                      Sculpted with low-profile Japandi proportions and hand-planed joinery. Each piece carries certified wood provenance and our double-entry ledger guarantee.
                    </p>

                    {/* Available Wood Species Swatches */}
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--brown-600)',
                          marginBottom: 8,
                        }}
                      >
                        AVAILABLE HARDWOOD FINISHES
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {WOOD_FINISHES.map((finish) => (
                          <div
                            key={finish.name}
                            title={finish.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11,
                              fontFamily: 'var(--font-display)',
                              color: 'var(--brown-800)',
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: finish.color,
                                border: `1px solid ${finish.border}`,
                                display: 'inline-block',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            />
                            <span>{finish.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Architectural Specifications Table */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(208, 174, 146, 0.3)',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.3)',
                        padding: '12px 0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--brown-700)',
                        marginBottom: 20,
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--brown-500)' }}>TIMBER:</span> Solid White Oak
                      </div>
                      <div>
                        <span style={{ color: 'var(--brown-500)' }}>JOINERY:</span> Mortise &amp; Tenon
                      </div>
                      <div>
                        <span style={{ color: 'var(--brown-500)' }}>LEDGER:</span> Double-Entry Verified
                      </div>
                      <div>
                        <span style={{ color: 'var(--brown-500)' }}>TAX RATE:</span> {currentPiece.tax_rate}% GST Incl.
                      </div>
                    </div>

                    {/* Price Block */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 24,
                          fontWeight: 800,
                          color: 'var(--brown-900)',
                        }}
                      >
                        {formatINR(currentPiece.sales_price)}
                      </span>
                      {currentPiece.mrp && parseFloat(currentPiece.mrp) > parseFloat(currentPiece.sales_price) && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 14,
                            color: 'var(--brown-500)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatINR(currentPiece.mrp)}
                        </span>
                      )}
                    </div>

                    {/* Direct Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => navigate(`/portal/catalogue/${currentPiece.id}`)}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 18px',
                          backgroundColor: 'var(--brown-900)',
                          color: 'var(--cream)',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(74, 58, 52, 0.18)',
                          transition: 'all 140ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 58, 52, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 58, 52, 0.18)';
                        }}
                      >
                        <span>Inspect Full Specifications</span>
                        <ArrowRight size={13} />
                      </button>

                      {currentPiece.model_url && (
                        <button
                          onClick={() => navigate(`/portal/catalogue/${currentPiece.id}`)}
                          title="Interactive 3D Viewer & Finish Customizer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                            border: '1px solid rgba(208, 174, 146, 0.45)',
                            color: 'var(--brown-900)',
                            cursor: 'pointer',
                          }}
                        >
                          <Box size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Page Footer Pagination */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brown-500)',
                      borderTop: '1px solid rgba(208, 174, 146, 0.25)',
                      paddingTop: 12,
                      marginTop: 20,
                    }}
                  >
                    <span>VOL. IV &bull; {currentPiece.category?.toUpperCase() || 'CATALOGUE'}</span>
                    <span>SPREAD 0{currentSpread + 1} OF 0{totalSpreads}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Spread Navigator Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: 10,
              border: '1px solid rgba(208, 174, 146, 0.35)',
            }}
          >
            <button
              onClick={() => {
                playWoodClick(0.9);
                setCurrentSpread((s) => Math.max(0, s - 1));
              }}
              disabled={currentSpread === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid rgba(208, 174, 146, 0.4)',
                backgroundColor: currentSpread === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
                color: currentSpread === 0 ? 'var(--brown-400)' : 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: currentSpread === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous Spread</span>
            </button>

            {/* Quick Spread Dots / Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: totalSpreads }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playWoodClick(0.9);
                    setCurrentSpread(idx);
                  }}
                  title={idx === 0 ? 'Cover Spread' : `Spread ${idx}`}
                  style={{
                    width: idx === currentSpread ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: idx === currentSpread ? 'var(--brown-900)' : 'rgba(208, 174, 146, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    padding: 0,
                  }}
                />
              ))}
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brown-700)', marginLeft: 8 }}>
                Spread {currentSpread + 1} of {totalSpreads}
              </span>
            </div>

            <button
              onClick={() => {
                playWoodClick(0.9);
                setCurrentSpread((s) => Math.min(totalSpreads - 1, s + 1));
              }}
              disabled={currentSpread === totalSpreads - 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid rgba(208, 174, 146, 0.4)',
                backgroundColor: currentSpread === totalSpreads - 1 ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
                color: currentSpread === totalSpreads - 1 ? 'var(--brown-400)' : 'var(--brown-900)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: currentSpread === totalSpreads - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <span>Next Spread</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           COLLECTION GRID: ARCHITECTURAL GALLERY CARDS
           ══════════════════════════════════════════════════════════════════ */
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
            }}
          >
            {paginatedProducts.map((product, idx) => {
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
                    backgroundColor: '#FAF7F2',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(208, 174, 146, 0.35)',
                    boxShadow: '0 2px 10px rgba(74, 58, 52, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(74, 58, 52, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--brown-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(74, 58, 52, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(208, 174, 146, 0.35)';
                  }}
                >
                  {/* Image Container with Subtle Zoom */}
                  <div
                    style={{
                      position: 'relative',
                      height: 220,
                      overflow: 'hidden',
                      backgroundColor: '#F3ECE1',
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
                        transition: 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1.0)';
                      }}
                    />

                    {/* Editorial Piece Index Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: 'var(--brown-900)',
                        fontSize: 9.5,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        borderRadius: 4,
                        letterSpacing: '0.04em',
                      }}
                    >
                      N° 0{idx + 1}
                    </div>

                    {/* 3D Model Badge */}
                    {product.model_url && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: 'rgba(38, 25, 20, 0.92)',
                          backdropFilter: 'blur(6px)',
                          color: 'var(--cream)',
                          fontSize: 9.5,
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Box size={10} />
                        <span>3D Interactive</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                      backgroundColor: '#FAF7F2',
                    }}
                  >
                    <div>
                      {/* SKU & Category */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9.5,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brown-500)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {product.sku || 'UF-PIECE'}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--brown-600)',
                          }}
                        >
                          {product.category || 'Atelier'}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--brown-900)',
                          margin: '0 0 8px',
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

                      {/* Hardwood Finish Dots */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                        {WOOD_FINISHES.map((f) => (
                          <span
                            key={f.name}
                            title={f.name}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: f.color,
                              border: `1px solid ${f.border}`,
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      {/* Price & Savings */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 16,
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
                              fontSize: 11,
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
                          paddingTop: 8,
                          borderTop: '1px solid rgba(208, 174, 146, 0.25)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
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
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              backgroundColor: isStocked ? 'var(--posted)' : 'var(--brown-400)',
                            }}
                          />
                          <span>{isStocked ? `${Math.round(stock)} in stock` : 'Made to order'}</span>
                        </span>

                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            color: 'var(--brown-900)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          View <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Mode Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(208, 174, 146, 0.4)',
                  backgroundColor: currentPage === 1 ? 'transparent' : '#FFFFFF',
                  color: currentPage === 1 ? 'var(--brown-400)' : 'var(--brown-900)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                &larr; Previous
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
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(208, 174, 146, 0.4)',
                  backgroundColor: currentPage === totalPages ? 'transparent' : '#FFFFFF',
                  color: currentPage === totalPages ? 'var(--brown-400)' : 'var(--brown-900)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortalCataloguePage;
