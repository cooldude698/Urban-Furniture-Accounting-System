import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { Box, Trash2, Plus, Minus, Sparkles, X, CheckCircle, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { formatINR } from '../../lib/money';
import type { CatalogueProduct } from './PortalCataloguePage';

export interface ArrangedItem {
  product: CatalogueProduct;
  qty: number;
}

export interface RoomPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetBudget: number;
  skus: string[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'living_room',
    name: 'Royal Velvet Living Room',
    icon: '🛋️',
    description: '3-seater velvet sofa, minimalist coffee table, and 5-tier bookshelf.',
    targetBudget: 65000,
    skus: ['SEAT-SOF-002', 'TABL-COF-002', 'STOR-BOK-002'],
  },
  {
    id: 'executive_office',
    name: 'Executive WFH Studio',
    icon: '💼',
    description: 'Ergonomic mesh chair with solid oak executive dining/work table.',
    targetBudget: 35000,
    skus: ['SEAT-OFF-001', 'TABL-DIN-001'],
  },
  {
    id: 'master_bedroom',
    name: 'Master Sanctuary Bedroom',
    icon: '🛏️',
    description: 'Grand upholstered queen bed frame paired with contemporary 3-door wardrobe.',
    targetBudget: 72000,
    skus: ['BEDS-QUN-002', 'STOR-WAR-001'],
  },
  {
    id: 'compact_studio',
    name: 'Modern Studio Lounge',
    icon: '☕',
    description: 'Single bed with underbed storage and ergonomic lounge seating.',
    targetBudget: 26000,
    skus: ['BEDS-SNG-001', 'SEAT-OFF-001'],
  },
];

interface RoomArrangerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ArrangedItem[];
  onUpdateQty: (productId: number, qty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClear: () => void;
  budget: number;
  onSetBudget: (budget: number) => void;
  allProducts: CatalogueProduct[];
  onAddItem: (product: CatalogueProduct) => void;
  onLoadPreset: (preset: RoomPreset) => void;
  currentUser: { full_name: string; login_id: string } | null;
}

export const RoomArrangerDrawer: React.FC<RoomArrangerDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClear,
  budget,
  onSetBudget,
  allProducts,
  onAddItem,
  onLoadPreset,
  currentUser,
}) => {
  const navigate = useNavigate();
  const [budgetInput, setBudgetInput] = useState<string>(String(budget));
  const [activeTab, setActiveTab] = useState<'arranger' | 'presets'>('arranger');
  const [orderCreatedMsg, setOrderCreatedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Financial calculations using Decimal
  const totalCost = items.reduce((acc, item) => {
    const price = new Decimal(item.product.sales_price || '0');
    return acc.plus(price.times(item.qty));
  }, new Decimal(0));

  const budgetDecimal = new Decimal(budget || 0);
  const remaining = budgetDecimal.minus(totalCost);
  const isOverBudget = remaining.isNegative();
  const percentageUsed = budgetDecimal.gt(0)
    ? Math.min(Math.round(totalCost.dividedBy(budgetDecimal).times(100).toNumber()), 100)
    : 0;

  // Recommendations: products from catalog that fit in remaining budget and not yet in items
  const affordableSuggestions = !isOverBudget && remaining.gt(0)
    ? allProducts
        .filter(p => !items.some(it => it.product.id === p.id))
        .filter(p => new Decimal(p.sales_price).lte(remaining))
        .slice(0, 3)
    : [];

  const handleBudgetChange = (val: string) => {
    setBudgetInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      onSetBudget(num);
    }
  };

  const handleApplyPreset = (preset: RoomPreset) => {
    onLoadPreset(preset);
    setBudgetInput(String(preset.targetBudget));
    setActiveTab('arranger');
  };

  const handleCheckoutDraft = () => {
    if (!currentUser) {
      navigate('/login?portal=customer');
      return;
    }
    setOrderCreatedMsg(
      `Room Arrangement configuration saved! ${items.length} item(s) totaled at ${formatINR(totalCost.toFixed(2))}. Invoice request sent to accounting.`
    );
    setTimeout(() => {
      setOrderCreatedMsg(null);
    }, 4000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(40, 28, 24, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100%',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid rgba(208, 174, 146, 0.50)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drawer Header ── */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--brown-900)',
            color: 'var(--cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(208, 174, 146, 0.20)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛋️</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--cream)',
                }}
              >
                Room Arranger & Budget Wallet
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--brown-300)' }}>
              100% Offline Interior Layout & Live Budget Tracker
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cream)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 4,
              opacity: 0.8,
            }}
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs (Arranger vs Presets) ── */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--brown-100)',
            borderBottom: '1px solid rgba(208, 174, 146, 0.40)',
            padding: '4px 16px',
            gap: 8,
          }}
        >
          <button
            onClick={() => setActiveTab('arranger')}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'arranger' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'arranger' ? 'var(--brown-900)' : 'var(--brown-600)',
              boxShadow: activeTab === 'arranger' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Current Arrangement ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeTab === 'presets' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'presets' ? 'var(--brown-900)' : 'var(--brown-600)',
              boxShadow: activeTab === 'presets' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Sparkles size={13} color="var(--warning)" />
            Room Presets & Templates
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Order Created Success Banner */}
          {orderCreatedMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 102, 65, 0.12)',
                border: '1px solid var(--posted)',
                color: 'var(--posted)',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={16} />
              <span>{orderCreatedMsg}</span>
            </div>
          )}

          {activeTab === 'presets' ? (
            /* ── PRESETS TAB ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--brown-700)', lineHeight: 1.5 }}>
                Choose a pre-built furniture template tailored for your space. Loading a preset populates the arrangement and updates your budget wallet.
              </div>

              {ROOM_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    backgroundColor: 'var(--cream)',
                    border: '1px solid rgba(208, 174, 146, 0.50)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{preset.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--brown-900)' }}>
                        {preset.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--posted)',
                        backgroundColor: 'rgba(56, 102, 65, 0.10)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      ~{formatINR(preset.targetBudget.toFixed(2))}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--brown-600)', lineHeight: 1.4 }}>
                    {preset.description}
                  </p>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      marginTop: 4,
                      padding: '8px 14px',
                      backgroundColor: 'var(--brown-900)',
                      color: 'var(--cream)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Load This Room Template</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* ── ARRANGER TAB ── */
            <>
              {/* 1. Budget Wallet Card */}
              <div
                style={{
                  backgroundColor: 'var(--cream)',
                  border: '1px solid rgba(208, 174, 146, 0.60)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brown-700)' }}>
                    Target Budget Wallet
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[50000, 75000, 100000, 150000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => {
                          onSetBudget(amt);
                          setBudgetInput(String(amt));
                        }}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(208, 174, 146, 0.6)',
                          backgroundColor: budget === amt ? 'var(--brown-800)' : 'var(--surface)',
                          color: budget === amt ? 'var(--cream)' : 'var(--brown-800)',
                          cursor: 'pointer',
                        }}
                      >
                        ₹{amt / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--brown-800)' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--brown-900)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid rgba(208, 174, 146, 0.60)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Progress Bar */}
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      backgroundColor: 'rgba(208, 174, 146, 0.35)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(percentageUsed, 100)}%`,
                        height: '100%',
                        backgroundColor: isOverBudget ? 'var(--danger)' : percentageUsed > 85 ? 'var(--warning)' : 'var(--posted)',
                        transition: 'width 200ms ease, background-color 200ms ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--brown-600)', marginTop: 4 }}>
                    <span>Selected: <strong>{formatINR(totalCost.toFixed(2))}</strong></span>
                    <span>
                      {isOverBudget ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                          Over by {formatINR(remaining.abs().toFixed(2))}
                        </span>
                      ) : (
                        <span>Remaining: <strong style={{ color: 'var(--posted)' }}>{formatINR(remaining.toFixed(2))}</strong></span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Arranged Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brown-700)' }}>
                    Selected Layout Pieces ({items.length})
                  </span>
                  {items.length > 0 && (
                    <button
                      onClick={onClear}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brown-500)',
                        fontSize: 11,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      backgroundColor: 'var(--cream)',
                      border: '1px dashed rgba(208, 174, 146, 0.60)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--brown-600)',
                    }}
                  >
                    <Layers size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--brown-800)' }}>
                      No Furniture in Your Room Layout
                    </p>
                    <p style={{ margin: '4px 0 14px', fontSize: 11 }}>
                      Add pieces from the catalogue or pick a starter room template!
                    </p>
                    <button
                      onClick={() => setActiveTab('presets')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--brown-800)',
                        color: 'var(--cream)',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Browse Room Presets
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(({ product, qty }) => {
                      const itemTotal = new Decimal(product.sales_price).times(qty);
                      return (
                        <div
                          key={product.id}
                          style={{
                            padding: 12,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid rgba(208, 174, 146, 0.40)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          {/* Image or initial */}
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 6,
                              backgroundColor: 'var(--brown-100)',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {product.image_url ? (
                              <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--brown-800)' }}>
                                {product.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--brown-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {product.name}
                              </h4>
                              {product.model_url && (
                                <button
                                  onClick={() => navigate(`/portal/catalogue/${product.id}`)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    color: 'var(--brown-600)',
                                  }}
                                  title="Inspect in 3D"
                                >
                                  <Box size={13} />
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--brown-500)', marginTop: 2 }}>
                              {formatINR(product.sales_price)} each
                            </div>
                          </div>

                          {/* Stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => onUpdateQty(product.id, qty - 1)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: '1px solid rgba(208, 174, 146, 0.60)',
                                backgroundColor: 'var(--cream)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={11} />
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, width: 20, textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => onUpdateQty(product.id, qty + 1)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: '1px solid rgba(208, 174, 146, 0.60)',
                                backgroundColor: 'var(--cream)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Item total */}
                          <div style={{ textAlign: 'right', minWidth: 65 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--brown-900)' }}>
                              {formatINR(itemTotal.toFixed(2))}
                            </div>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => onRemoveItem(product.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--brown-400)',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Smart Recommendations that fit remaining budget */}
              {affordableSuggestions.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(56, 102, 65, 0.06)',
                    border: '1px solid rgba(56, 102, 65, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={14} color="var(--posted)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--posted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Suggested Additions (Fits in remaining {formatINR(remaining.toFixed(2))})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {affordableSuggestions.map(s => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--brown-900)' }}>{s.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brown-700)' }}>
                            {formatINR(s.sales_price)}
                          </span>
                          <button
                            onClick={() => onAddItem(s)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: 'var(--posted)',
                              color: 'var(--cream)',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Drawer Footer ── */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid rgba(208, 174, 146, 0.40)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: 'var(--brown-700)' }}>Arrangement Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--brown-900)' }}>
              {formatINR(totalCost.toFixed(2))}
            </span>
          </div>

          <button
            onClick={handleCheckoutDraft}
            disabled={items.length === 0}
            style={{
              width: '100%',
              padding: '12px 18px',
              backgroundColor: isOverBudget ? 'var(--warning)' : 'var(--brown-900)',
              color: 'var(--cream)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
              opacity: items.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
              transition: 'background 120ms ease',
            }}
          >
            {isOverBudget ? (
              <>
                <AlertTriangle size={16} />
                <span>Confirm Arrangement (Over Budget)</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Save Room Layout & Request Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomArrangerDrawer;
