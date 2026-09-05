import React, { useState, useEffect, useRef } from 'react';
import { ProductsApi } from '../../api/products.api';
import { Product, CreateProductInput, ProductType } from '@shared/schemas/product.schema';
import { Camera, ChevronDown, Check, Plus, AlertCircle } from 'lucide-react';

interface ProductFormPageProps {
  productId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome?: () => void;
  onNew?: () => void;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({
  productId,
  onBack,
  onSaved,
  onNew,
}) => {
  const isNew = !productId;

  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('goods');
  const [category, setCategory] = useState('');
  const [salesPrice, setSalesPrice] = useState('100.00');
  const [costPrice, setCostPrice] = useState('50.00');
  const [imageUrl, setImageUrl] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [sku, setSku] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Category Many2one dropdown state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [existingCategories, setExistingCategories] = useState<string[]>([
    'Electronics',
    'Furniture',
    'Chairs & Seating',
    'Desks & Tables',
    'Storage',
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const handleGenerateSku = async () => {
    try {
      const res = await ProductsApi.generateSku(category || 'GEN', name || 'ITEM', '26');
      setSku(res.sku);
    } catch (err: any) {
      setError(err.message || 'Failed to generate SKU');
    }
  };

  // Load existing categories & product data if editing
  useEffect(() => {
    // Fetch products to aggregate categories
    ProductsApi.getAll(false)
      .then(prods => {
        const cats = Array.from(
          new Set(
            prods
              .map(p => p.category?.trim())
              .filter(Boolean) as string[]
          )
        );
        if (cats.length > 0) {
          setExistingCategories(prev => Array.from(new Set([...prev, ...cats])));
        }
      })
      .catch(() => {});

    if (productId) {
      setLoading(true);
      ProductsApi.getById(productId)
        .then(p => {
          setName(p.name);
          setType(p.type);
          setCategory(p.category || '');
          setCategoryQuery(p.category || '');
          setSku(p.sku || '');
          setSalesPrice(p.sales_price || '0.00');
          setCostPrice(p.cost_price || '0.00');
          setImageUrl(p.image_url || '');
          setModelUrl(p.model_url || '');
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setType('goods');
      setCategory('');
      setCategoryQuery('');
      setSku('');
      setSalesPrice('100.00');
      setCostPrice('50.00');
      setImageUrl('');
      setModelUrl('');
      setImagePreview(null);
      setError(null);
    }
  }, [productId]);

  // Click outside category dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Product Name is required');
      return;
    }
    const finalCategory = category.trim() || categoryQuery.trim() || 'General';

    try {
      setLoading(true);
      setError(null);

      // Clean decimal prices
      const cleanSales = parseFloat(salesPrice || '0').toFixed(2);
      const cleanCost = parseFloat(costPrice || '0').toFixed(2);

      let finalSku = sku.trim();
      if (!finalSku) {
        const skuRes = await ProductsApi.generateSku(finalCategory, name.trim(), '26');
        finalSku = skuRes.sku;
      }

      const payload: CreateProductInput = {
        name: name.trim(),
        type,
        category: finalCategory,
        sales_price: cleanSales,
        cost_price: cleanCost,
        mrp: cleanSales,
        sku: finalSku,
        tax_rate: '18.00',
        min_stock_threshold: 5,
        image_url: imageUrl.trim() || null,
        model_url: modelUrl.trim() || null,
        is_archived: false,
      };

      let saved: Product;
      if (isNew) {
        saved = await ProductsApi.create(payload);
      } else {
        saved = await ProductsApi.update(productId!, payload);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleNewClick = () => {
    if (onNew) {
      onNew();
    } else {
      setName('');
      setType('goods');
      setCategory('');
      setCategoryQuery('');
      setSalesPrice('100.00');
      setCostPrice('50.00');
      setImageUrl('');
      setModelUrl('');
      setImagePreview(null);
      setError(null);
    }
  };

  const filteredCategories = existingCategories.filter(c =>
    c.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const canCreateNewCategory =
    categoryQuery.trim() !== '' &&
    !existingCategories.some(c => c.toLowerCase() === categoryQuery.trim().toLowerCase());

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Wireframe Header Title: Product Master Form View */}
        <h1 style={styles.heading}>Product Master Form View</h1>

        {/* Outer Wireframe Card */}
        <div style={styles.card}>
          {/* Top Action Bar: [New] [Confirm] ... [Back] */}
          <div style={styles.topBar}>
            <div style={styles.leftBtnGroup}>
              <button
                type="button"
                onClick={handleNewClick}
                onMouseEnter={() => setHoveredBtn('new')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'new' ? styles.wireframeBtnHover : {}),
                }}
              >
                New
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                onMouseEnter={() => setHoveredBtn('confirm')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'confirm' ? styles.wireframeBtnHover : {}),
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>

            <button
              type="button"
              onClick={onBack}
              onMouseEnter={() => setHoveredBtn('back')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.wireframeBtn,
                ...(hoveredBtn === 'back' ? styles.wireframeBtnHover : {}),
              }}
            >
              Back
            </button>
          </div>

          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Body matching Wireframe Layout */}
          <div style={styles.formContent}>
            {/* Field 1: Product Name */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Product Name</label>
              <div style={styles.inputUnderlineWrapper}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Air Conditioner"
                  style={styles.underlineInput}
                />
              </div>
            </div>

            {/* Field 1.5: SKU / Deterministic Reference */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>SKU / Code</label>
              <div style={{ ...styles.inputUnderlineWrapper, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. SOF-TEAK-26-0001 (auto-generated on save)"
                  style={{ ...styles.underlineInput, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: 'var(--brown-900)',
                    color: 'var(--cream)',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Generate deterministic CAT-MAT-YEAR-SEQ SKU"
                >
                  ✨ Auto SKU
                </button>
              </div>
            </div>

            {/* Field 2: Product Type (Dropdown of Goods, Service, Combo) */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Product Type</label>
              <div style={styles.inputUnderlineWrapper}>
                <div style={styles.selectWrapper}>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ProductType)}
                    style={styles.underlineSelect}
                  >
                    <option value="goods">Goods</option>
                    <option value="service">Service</option>
                    <option value="combo">Combo</option>
                  </select>
                  <ChevronDown size={16} style={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* Field 3: Category (Many2one: Dropdown selection + Create on the fly) */}
            <div style={styles.fieldRow} ref={categoryRef}>
              <label style={styles.fieldLabel}>Category</label>
              <div style={styles.inputUnderlineWrapper}>
                <div
                  style={styles.categoryInputContainer}
                  onClick={() => setIsCategoryDropdownOpen(true)}
                >
                  <input
                    type="text"
                    value={categoryQuery}
                    onChange={e => {
                      setCategoryQuery(e.target.value);
                      setCategory(e.target.value);
                      setIsCategoryDropdownOpen(true);
                    }}
                    onFocus={() => setIsCategoryDropdownOpen(true)}
                    placeholder="Selection (or type to create new)"
                    style={styles.underlineInput}
                  />
                  <ChevronDown
                    size={16}
                    style={{
                      ...styles.selectArrow,
                      transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </div>

                {/* Dropdown Options */}
                {isCategoryDropdownOpen && (
                  <div style={styles.categoryDropdown}>
                    {filteredCategories.map(cat => (
                      <div
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setCategoryQuery(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={styles.categoryOption}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5ECE1')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>{cat}</span>
                        {category === cat && <Check size={14} color="#4A3A34" />}
                      </div>
                    ))}

                    {/* Create & Save on the fly option */}
                    {canCreateNewCategory && (
                      <div
                        onClick={() => {
                          const newCat = categoryQuery.trim();
                          setCategory(newCat);
                          setExistingCategories(prev => [...prev, newCat]);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={styles.createCategoryOption}
                        onMouseEnter={e => (e.currentTarget.style.background = '#EDE1D3')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(235, 215, 190, 0.4)')}
                      >
                        <Plus size={14} />
                        <span>Create &quot;{categoryQuery.trim()}&quot; on the fly</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: [Upload Image Box] + [Sales Price & Cost Inputs] */}
            <div style={styles.bottomSection}>
              {/* Left: Upload Image Box */}
              <div
                style={styles.uploadImageBox}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    style={styles.uploadedImg}
                  />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <Camera size={22} color="#77574A" style={{ marginBottom: 6 }} />
                    <span style={styles.uploadImageText}>Upload</span>
                    <span style={styles.uploadImageText}>Image</span>
                  </div>
                )}
              </div>

              {/* Right: Sales Price & Cost */}
              <div style={styles.pricingColumn}>
                {/* Sales Price */}
                <div style={styles.pricingRow}>
                  <label style={styles.pricingLabel}>Sales Price</label>
                  <div style={styles.priceInputWrapper}>
                    <span style={styles.currencyPrefix}>Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={salesPrice}
                      onChange={e => setSalesPrice(e.target.value)}
                      placeholder="100.00"
                      style={styles.priceUnderlineInput}
                    />
                  </div>
                </div>

                {/* Cost */}
                <div style={styles.pricingRow}>
                  <label style={styles.pricingLabel}>Cost</label>
                  <div style={styles.priceInputWrapper}>
                    <span style={styles.currencyPrefix}>Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      placeholder="50.00"
                      style={styles.priceUnderlineInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Catalogue & Media Section */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(208, 174, 146, 0.35)' }}>
              <h3
                style={{
                  fontFamily: '"Montserrat", var(--font-display), sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#4A3A34',
                  margin: '0 0 16px 0',
                }}
              >
                Catalogue & Media
              </h3>

              {/* Thumbnail URL */}
              <div style={styles.fieldRow}>
                <label style={styles.fieldLabel}>Thumbnail URL</label>
                <div style={styles.inputUnderlineWrapper}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="e.g. https://example.com/furniture-thumbnail.jpg"
                    style={styles.underlineInput}
                  />
                </div>
              </div>

              {/* 3D Model URL */}
              <div style={{ ...styles.fieldRow, marginTop: 14 }}>
                <label style={styles.fieldLabel}>3D Model URL</label>
                <div style={styles.inputUnderlineWrapper}>
                  <input
                    type="text"
                    value={modelUrl}
                    onChange={e => setModelUrl(e.target.value)}
                    placeholder="e.g. https://example.com/furniture.glb"
                    style={styles.underlineInput}
                  />
                  <div style={{ fontSize: 11, color: '#77574A', marginTop: 4, fontFamily: '"DM Sans", sans-serif' }}>
                    Paste a public .glb or .gltf URL
                  </div>
                  {modelUrl.trim() !== '' && (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: 'var(--posted, #5F7052)',
                        fontWeight: 600,
                        fontFamily: '"DM Sans", sans-serif',
                      }}
                    >
                      <Check size={13} />
                      Model will appear in customer portal 3D viewer
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
  } as React.CSSProperties,

  container: {
    width: '100%',
    maxWidth: 780,
  } as React.CSSProperties,

  heading: {
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 22,
    color: '#382A24',
    textAlign: 'center' as const,
    marginBottom: 18,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  card: {
    background: '#FFFFFF',
    borderRadius: 24,
    border: '1.5px solid #77574A',
    boxShadow: '0 10px 32px rgba(74, 58, 52, 0.08)',
    padding: '28px 36px 36px 36px',
    width: '100%',
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  } as React.CSSProperties,

  leftBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  wireframeBtn: {
    padding: '7px 24px',
    border: '1.5px solid #4A3A34',
    borderRadius: 12,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#4A3A34',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  wireframeBtnHover: {
    background: '#4A3A34',
    color: '#FFFFFF',
  } as React.CSSProperties,

  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#FDF2F2',
    border: '1px solid #F8B4B4',
    color: '#9B1C1C',
    fontSize: 13,
    marginBottom: 20,
  } as React.CSSProperties,

  formContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  } as React.CSSProperties,

  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative' as const,
  } as React.CSSProperties,

  fieldLabel: {
    width: 170,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 15.5,
    color: '#382A24',
    flexShrink: 0,
  } as React.CSSProperties,

  inputUnderlineWrapper: {
    flex: 1,
    position: 'relative' as const,
  } as React.CSSProperties,

  underlineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '8px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 15,
    color: '#382A24',
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,

  selectWrapper: {
    position: 'relative' as const,
    width: '100%',
  } as React.CSSProperties,

  underlineSelect: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #77574A',
    background: 'transparent',
    padding: '8px 4px',
    fontFamily: '"DM Sans", var(--font-body), sans-serif',
    fontSize: 15,
    color: '#382A24',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    cursor: 'pointer',
  } as React.CSSProperties,

  selectArrow: {
    position: 'absolute' as const,
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#77574A',
    transition: 'transform 150ms ease',
  } as React.CSSProperties,

  categoryInputContainer: {
    position: 'relative' as const,
    cursor: 'pointer',
  } as React.CSSProperties,

  categoryDropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1.5px solid #77574A',
    boxShadow: '0 10px 28px rgba(74, 58, 52, 0.12)',
    zIndex: 100,
    maxHeight: 200,
    overflowY: 'auto' as const,
    padding: '4px 0',
  } as React.CSSProperties,

  categoryOption: {
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#382A24',
    cursor: 'pointer',
    transition: 'background 120ms ease',
  } as React.CSSProperties,

  createCategoryOption: {
    padding: '9px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: '#4A3A34',
    cursor: 'pointer',
    background: 'rgba(235, 215, 190, 0.4)',
    borderTop: '1px solid #E4D5C7',
    transition: 'background 120ms ease',
  } as React.CSSProperties,

  bottomSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 36,
    marginTop: 18,
    paddingTop: 10,
  } as React.CSSProperties,

  uploadImageBox: {
    width: 130,
    height: 130,
    borderRadius: 18,
    border: '1.5px solid #77574A',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#FAF7F4',
    overflow: 'hidden',
    transition: 'all 150ms ease',
    flexShrink: 0,
  } as React.CSSProperties,

  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  uploadImageText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 13.5,
    fontWeight: 500,
    color: '#77574A',
    lineHeight: 1.2,
  } as React.CSSProperties,

  uploadedImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,

  pricingColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 22,
    justifyContent: 'center',
    paddingTop: 8,
  } as React.CSSProperties,

  pricingRow: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  pricingLabel: {
    width: 140,
    fontFamily: '"Montserrat", var(--font-display), sans-serif',
    fontWeight: 700,
    fontSize: 15.5,
    color: '#382A24',
    flexShrink: 0,
  } as React.CSSProperties,

  priceInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    borderBottom: '1.5px solid #77574A',
    padding: '4px 2px',
  } as React.CSSProperties,

  currencyPrefix: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14.5,
    fontWeight: 600,
    color: '#5C453A',
  } as React.CSSProperties,

  priceUnderlineInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 15,
    color: '#382A24',
    outline: 'none',
    padding: 0,
  } as React.CSSProperties,
};
