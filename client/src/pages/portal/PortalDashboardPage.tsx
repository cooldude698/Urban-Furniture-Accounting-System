import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Box,
  Layers,
  Eye,
  CheckCircle2,
  Sun,
  Clock,
  CreditCard,
  ChevronRight,
  Armchair,
  Bed,
  Utensils,
  Briefcase,
  ShieldCheck,
  Compass,
  Sliders,
  LogIn,
} from 'lucide-react';
import { usePortalAuth } from './PortalAuthGuard';
import { formatINR } from '../../lib/money';

interface InvoiceSummary {
  totalDue: string;
  totalInvoiced: string;
  count: number;
}

export const PortalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = usePortalAuth();

  const [activeRoom, setActiveRoom] = useState<'living' | 'bedroom' | 'dining' | 'study'>('living');
  const [activeFinish, setActiveFinish] = useState<'ash' | 'teak' | 'walnut' | 'sheesham'>('ash');
  const [activeLighting, setActiveLighting] = useState<'daylight' | 'golden' | 'evening'>('golden');
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary>({
    totalDue: '0.00',
    totalInvoiced: '0.00',
    count: 0,
  });
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingFinancials(true);
    fetch('/api/portal/invoices')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) {
          let due = 0;
          let invoiced = 0;
          json.data.forEach((inv: any) => {
            due += parseFloat(inv.amountDue || '0');
            invoiced += parseFloat(inv.total || '0');
          });
          setInvoiceSummary({
            totalDue: due.toFixed(2),
            totalInvoiced: invoiced.toFixed(2),
            count: json.data.length,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFinancials(false));
  }, [user]);

  const rooms = [
    {
      id: 'living',
      title: 'Living Room',
      subtitle: '5 handcrafted pieces',
      category: 'Seating',
      icon: Armchair,
      highlight: 'Royal Velvet Sofa & Ash Tables',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'bedroom',
      title: 'Master Bedroom',
      subtitle: '3 handcrafted pieces',
      category: 'Beds',
      icon: Bed,
      highlight: 'Solid Teak Bed & Mattresses',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'dining',
      title: 'Dining & Kitchen',
      subtitle: '2 handcrafted pieces',
      category: 'Tables',
      icon: Utensils,
      highlight: 'Nordic Solid Oak Farmhouse Set',
      image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'study',
      title: 'Executive Study',
      subtitle: '4 handcrafted pieces',
      category: 'Storage',
      icon: Briefcase,
      highlight: 'Ergonomic Chair & Oak Desks',
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    },
  ] as const;

  const currentRoom = rooms.find((r) => r.id === activeRoom) || rooms[0];

  const finishes = [
    { id: 'ash', name: 'White Ash', color: '#DCC7A1', tone: 'Pale Scandinavian Grain' },
    { id: 'teak', name: 'Golden Teak', color: '#B37D4E', tone: 'Honey Amber Classic' },
    { id: 'walnut', name: 'American Walnut', color: '#5B3E31', tone: 'Deep Rich Espresso' },
    { id: 'sheesham', name: 'Heritage Sheesham', color: '#7E4B2F', tone: 'Contrasting Dense Grain' },
  ] as const;

  const lightingPresets = [
    { id: 'daylight', label: 'Daylight', temp: '5500K', bg: 'rgba(255,255,255,0.85)' },
    { id: 'golden', label: 'Golden Hour', temp: '3200K', bg: 'rgba(254, 243, 199, 0.85)' },
    { id: 'evening', label: 'Showroom Ambient', temp: '2700K', bg: 'rgba(254, 215, 170, 0.85)' },
  ] as const;

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Top Header Greeting ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '4px 0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
              Customer Studio Surface
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
              Japandi Architecture 2026
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--brown-900)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {user ? `Welcome back, ${user.full_name}` : 'Urban Furniture Customer Studio'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--brown-700)' }}>
            Curated architectural furniture concepts, interactive 3D spaces, and your account ledger.
          </p>
        </div>

        {/* Right Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              backgroundColor: 'var(--surface)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--brown-900)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--posted)',
                display: 'inline-block',
              }}
            />
            <span>Showroom Online</span>
          </div>

          {user && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: 'var(--posted-bg)',
                border: '1px solid rgba(95, 112, 82, 0.25)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--posted)',
              }}
            >
              <ShieldCheck size={14} />
              <span>Verified Customer Contact</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Main Layout: Hero Showcase (65%) + Curated Spaces (35%) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {/* ── 1. Architectural Hero Showcase ── */}
        <div
          style={{
            gridColumn: 'span 2',
            minHeight: 440,
            borderRadius: 24,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'var(--shadow-md)',
            backgroundImage: `url(${currentRoom.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 28,
            transition: 'background-image 300ms ease-in-out',
          }}
        >
          {/* Subtle warm ambient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                activeLighting === 'daylight'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(74, 58, 52, 0.65) 100%)'
                  : activeLighting === 'golden'
                    ? 'linear-gradient(180deg, rgba(254, 243, 199, 0.25) 0%, rgba(74, 58, 52, 0.72) 100%)'
                    : 'linear-gradient(180deg, rgba(74, 58, 52, 0.35) 0%, rgba(30, 20, 15, 0.85) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Pill Badges (Inspired by Reference) */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {/* Live Indicator Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--brown-900)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span>Live Concept</span>
            </div>

            {/* Spec Chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--brown-900)',
                }}
              >
                🌡️ 24°C Studio Temp
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--brown-900)',
                }}
              >
                🪵 Kiln-Dried Hardwood
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--brown-900)',
                }}
              >
                📦 White-Glove Dispatch
              </div>
            </div>
          </div>

          {/* Bottom Hero Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 580,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#F9F2E4',
                marginBottom: 6,
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              {currentRoom.title} Concept
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 10px',
                lineHeight: '36px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              The Japandi {currentRoom.title}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#F3E8DF',
                margin: '0 0 18px',
                lineHeight: '20px',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              Harmonising Japanese minimalism with Scandinavian craftsmanship. Features {currentRoom.highlight}.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/portal/catalogue/316')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--brown-900)',
                  color: 'var(--cream)',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Box size={16} />
                <span>View Room in 3D</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/portal/catalogue`)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 18px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--brown-900)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span>Browse {currentRoom.category}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Curated Spaces & Rooms Sidebar (Inspired by Reference) ── */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 24,
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid rgba(208, 174, 146, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Curated Spaces
                </h3>
                <span style={{ fontSize: 11, color: 'var(--brown-600)' }}>4 architectural room collections</span>
              </div>
              <Compass size={20} color="var(--brown-700)" />
            </div>

            {/* Room List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rooms.map((room) => {
                const isActive = room.id === activeRoom;
                const IconComponent = room.icon;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoom(room.id as any)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 14,
                      backgroundColor: isActive ? 'var(--cream)' : 'transparent',
                      border: isActive ? '1px solid rgba(74, 58, 52, 0.25)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(235, 215, 190, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isActive ? 'var(--brown-900)' : 'var(--brown-100)',
                          color: isActive ? 'var(--cream)' : 'var(--brown-900)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 600,
                            fontFamily: 'var(--font-display)',
                            color: 'var(--brown-900)',
                          }}
                        >
                          {room.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--brown-600)' }}>{room.subtitle}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color={isActive ? 'var(--brown-900)' : 'var(--brown-400)'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Explore Button */}
          <button
            type="button"
            onClick={() => navigate('/portal/catalogue')}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 14,
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
              transition: 'opacity 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span>+ Explore Full Catalogue</span>
          </button>
        </div>
      </div>

      {/* ── Bottom 3-Card Responsive Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {/* ── Card 1: Interactive 3D Model Spotlight ── */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 24,
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid rgba(208, 174, 146, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brown-700)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  3D Interactive Spotlight
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--posted)',
                    backgroundColor: 'var(--posted-bg)',
                    padding: '2px 6px',
                    borderRadius: 999,
                  }}
                >
                  Ready
                </span>
              </div>
              <Box size={18} color="var(--brown-700)" />
            </div>

            {/* Product visual preview box */}
            <div
              style={{
                position: 'relative',
                height: 180,
                borderRadius: 16,
                backgroundColor: 'var(--cream)',
                overflow: 'hidden',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1580481077195-c3a821a78f4b?auto=format&fit=crop&w=600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(74, 58, 52, 0.75) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 14,
                  right: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    Executive Office Chair
                  </div>
                  <div style={{ fontSize: 11, color: '#EBD7BE' }}>SKU: SEAT-OFF-001</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                  ₹8,500
                </div>
              </div>
            </div>

            {/* Spec Chips Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: 'var(--cream)',
                  color: 'var(--brown-900)',
                  fontWeight: 600,
                }}
              >
                Solid Ash
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: 'var(--cream)',
                  color: 'var(--brown-900)',
                  fontWeight: 600,
                }}
              >
                GST 18%
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: 'var(--posted-bg)',
                  color: 'var(--posted)',
                  fontWeight: 600,
                }}
              >
                In Stock (25)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/catalogue/315')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brown-900)',
              color: 'var(--cream)',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Box size={15} />
            <span>Inspect in 3D Showroom</span>
          </button>
        </div>

        {/* ── Card 2: Materials & Showroom Lighting Ambience ── */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 24,
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid rgba(208, 174, 146, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brown-700)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Wood Finishes & Lighting
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--brown-900)' }}>
                  Tactile Materials
                </h4>
              </div>
              <Sliders size={18} color="var(--brown-700)" />
            </div>

            {/* Wood Swatches Selector */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-600)', display: 'block', marginBottom: 8 }}>
                Hardwood Selection:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {finishes.map((f) => {
                  const isSelected = f.id === activeFinish;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFinish(f.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'var(--cream)' : 'transparent',
                        border: isSelected ? '1px solid var(--brown-900)' : '1px solid rgba(208, 174, 146, 0.4)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: f.color,
                          border: '1px solid rgba(0,0,0,0.1)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: 'var(--brown-900)' }}>
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Showroom Lighting Mode */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-600)', display: 'block', marginBottom: 8 }}>
                Showroom Lighting:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {lightingPresets.map((l) => {
                  const isSelected = l.id === activeLighting;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLighting(l.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        backgroundColor: isSelected ? 'var(--brown-900)' : 'var(--cream)',
                        color: isSelected ? 'var(--cream)' : 'var(--brown-900)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 120ms ease',
                      }}
                    >
                      <span>{l.label}</span>
                      <span style={{ opacity: 0.75, fontFamily: 'var(--font-mono)' }}>{l.temp}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--brown-600)', textAlign: 'center' }}>
            All finishes kiln-dried to &lt;10% moisture content
          </div>
        </div>

        {/* ── Card 3: Customer Financials & Order Status ── */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 24,
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid rgba(208, 174, 146, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brown-700)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Accounting & Invoices
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--brown-900)' }}>
                  Your Account Ledger
                </h4>
              </div>
              <CreditCard size={18} color="var(--brown-700)" />
            </div>

            {user ? (
              <div>
                {/* Financial KPI stats */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    backgroundColor: 'var(--cream)',
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: 'var(--brown-600)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Outstanding Due
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 26,
                      fontWeight: 700,
                      color: parseFloat(invoiceSummary.totalDue) > 0 ? 'var(--danger)' : 'var(--posted)',
                    }}
                  >
                    {formatINR(invoiceSummary.totalDue)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--brown-600)',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Total Invoiced: {formatINR(invoiceSummary.totalInvoiced)}</span>
                    <span>{invoiceSummary.count} invoices</span>
                  </div>
                </div>

                {/* Account status badge */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: parseFloat(invoiceSummary.totalDue) > 0 ? 'var(--warning-bg)' : 'var(--posted-bg)',
                    border: `1px solid ${
                      parseFloat(invoiceSummary.totalDue) > 0
                        ? 'rgba(192, 138, 62, 0.3)'
                        : 'rgba(95, 112, 82, 0.25)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: parseFloat(invoiceSummary.totalDue) > 0 ? 'var(--warning)' : 'var(--posted)',
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {parseFloat(invoiceSummary.totalDue) > 0
                      ? 'Payment balance pending on active invoices'
                      : 'All customer invoices fully settled'}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '20px 14px',
                  borderRadius: 14,
                  backgroundColor: 'var(--cream)',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)', marginBottom: 6 }}>
                  Sign in to view your ledger
                </div>
                <p style={{ fontSize: 11, color: 'var(--brown-600)', margin: '0 0 14px' }}>
                  Invited customer contacts can check payment history and settle invoices.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login?portal=customer')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brown-900)',
                    color: 'var(--cream)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <LogIn size={14} />
                  <span>Sign In as Customer</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/invoices')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface)',
              border: '1px solid rgba(208, 174, 146, 0.45)',
              color: 'var(--brown-900)',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
          >
            <span>Go to My Invoices</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboardPage;
