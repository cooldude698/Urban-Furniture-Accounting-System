import React, { useState, useEffect, useRef } from 'react';
import { ContactsApi } from '../../api/contacts.api';
import { Contact, CreateContactInput, ContactType } from '@shared/schemas/contact.schema';
import { Upload, ShoppingCart, Receipt, BookOpen, Archive, CheckCircle } from 'lucide-react';
import { SmartButton } from '../../components/SmartButton';

interface ContactFormPageProps {
  contactId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onNew?: () => void;
  onViewBills?: (vendorId: number) => void;
  onViewPOs?: (vendorId: number) => void;
  onViewStatement?: (contactId: number) => void;
}

export const ContactFormPage: React.FC<ContactFormPageProps> = ({
  contactId,
  onBack,
  onSaved,
  onNew,
  onViewBills,
  onViewPOs,
  onViewStatement,
}) => {
  const isNew = !contactId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateContactInput>({
    name: '',
    type: 'customer',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    image_path: null,
    gstin: '',
    is_archived: false,
  });

  const [country, setCountry] = useState('India');
  const [contact, setContact] = useState<Contact | null>(null);
  const [counts, setCounts] = useState<{
    billCount: number;
    poCount: number;
    confirmedBillCount: number;
    totalBilled: string;
    totalPaid: string;
    totalDue: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Button hover states
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    if (contactId) {
      setLoading(true);
      Promise.all([
        ContactsApi.getById(contactId),
        ContactsApi.getCounts(contactId).catch(() => null),
      ])
        .then(([data, countData]) => {
          setContact(data);
          if (countData) setCounts(countData);
          setFormData({
            name: data.name,
            type: data.type,
            email: data.email || '',
            mobile: data.mobile || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            image_path: data.image_path || null,
            gstin: data.gstin || '',
            is_archived: data.is_archived,
          });
          if (data.image_path) {
            setImagePreview(data.image_path);
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setContact(null);
      setCounts(null);
      setSelectedFile(null);
      setImagePreview(null);
      setFormData({
        name: '',
        type: 'customer',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        image_path: null,
        gstin: '',
        is_archived: false,
      });
      setCountry('India');
      setError(null);
      setSuccessMsg(null);
    }
  }, [contactId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNew = () => {
    if (onNew) {
      onNew();
    } else {
      setFormData({
        name: '',
        type: 'customer',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        image_path: null,
        gstin: '',
        is_archived: false,
      });
      setCountry('India');
      setSelectedFile(null);
      setImagePreview(null);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Contact Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      let saved: Contact;
      if (isNew) {
        saved = await ContactsApi.create(formData);
      } else {
        saved = await ContactsApi.update(contactId!, formData);
      }

      // If a new image was selected, upload it
      if (selectedFile && saved.id) {
        await ContactsApi.uploadImage(saved.id, selectedFile);
      }

      setSuccessMsg('Contact saved successfully.');
      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!contactId || !contact) return;
    try {
      setLoading(true);
      const updated = await ContactsApi.archive(contactId, !contact.is_archived);
      setContact(updated);
      setFormData(prev => ({ ...prev, is_archived: updated.is_archived }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Title matching wireframe: Contact master Form View */}
        <h1 style={styles.heading}>Contact master Form View</h1>

        {/* Outer Wireframe Card */}
        <div style={styles.card}>
          {/* Top Button Row: New, Confirm on Left | Back on Right */}
          <div style={styles.topBtnRow}>
            <div style={styles.leftBtnGroup}>
              <button
                type="button"
                onClick={handleNew}
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
                onClick={handleSave}
                disabled={loading}
                onMouseEnter={() => setHoveredBtn('confirm')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  ...styles.wireframeBtn,
                  ...(hoveredBtn === 'confirm' ? styles.wireframeBtnHover : {}),
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Saving…' : 'Confirm'}
              </button>
            </div>

            <div style={styles.rightBtnGroup}>
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
          </div>

          {/* Feedback Banners */}
          {error && (
            <div style={styles.errorBanner} role="alert">
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div style={styles.successBanner} role="status">
              <CheckCircle size={15} style={{ marginRight: 6 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Contact Name Row */}
          <div style={styles.contactNameSection}>
            <div style={styles.contactNameRow}>
              <label htmlFor="contact-name" style={styles.contactNameLabel}>
                Contact Name
              </label>
              <div style={styles.nameInputContainer}>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={styles.nameLineInput}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Subtle Contact Type Selector */}
            <div style={styles.typeSelectorRow}>
              <span style={styles.typeLabel}>Type:</span>
              <div style={styles.typePillGroup}>
                {(['customer', 'vendor', 'both'] as ContactType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    style={{
                      ...styles.typePill,
                      ...(formData.type === t ? styles.typePillActive : {}),
                    }}
                  >
                    {t === 'both' ? 'Both' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid: Left column fields, Right column Upload Image + Pincode */}
          <div style={styles.formGrid}>
            {/* Left Column: Email, Phone, Address (Street, City, State, Country) */}
            <div style={styles.leftCol}>
              {/* Email */}
              <div style={styles.formRow}>
                <label style={styles.rowLabel}>Email</label>
                <div style={styles.inputCell}>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Unique Email"
                    style={styles.centerLineInput}
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={styles.formRow}>
                <label style={styles.rowLabel}>Phone</label>
                <div style={styles.inputCell}>
                  <input
                    type="tel"
                    value={formData.mobile || ''}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder=""
                    style={styles.leftLineInput}
                  />
                </div>
              </div>

              {/* Address Stack */}
              <div style={styles.addressStack}>
                {/* Street (first line with "Address" label) */}
                <div style={styles.formRow}>
                  <label style={styles.rowLabel}>Address</label>
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street"
                      style={styles.centerLineInput}
                    />
                  </div>
                </div>

                {/* City (stacked below Street, matching indentation) */}
                <div style={styles.formRow}>
                  <div style={styles.rowLabelSpacer} />
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      style={styles.centerLineInput}
                    />
                  </div>
                </div>

                {/* State (stacked below City) */}
                <div style={styles.formRow}>
                  <div style={styles.rowLabelSpacer} />
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      style={styles.centerLineInput}
                    />
                  </div>
                </div>

                {/* Country (stacked below State) */}
                <div style={styles.formRow}>
                  <div style={styles.rowLabelSpacer} />
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder="Country"
                      style={styles.centerLineInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload Image Box + Pincode */}
            <div style={styles.rightCol}>
              {/* Upload Image Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={styles.uploadCard}
                title="Click to upload image"
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {imagePreview ? (
                  <div style={styles.previewWrapper}>
                    <img
                      src={imagePreview}
                      alt="Contact avatar"
                      style={styles.previewImg}
                    />
                    <div style={styles.previewHoverText}>
                      Change Image
                    </div>
                  </div>
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <Upload size={24} style={styles.uploadIcon} />
                    <span style={styles.uploadText}>Upload Image</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Pincode line directly underneath Upload Image box */}
              <div style={styles.pincodeRow}>
                <input
                  type="text"
                  value={formData.pincode || ''}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                  style={styles.centerLineInput}
                />
              </div>
            </div>
          </div>

          {/* Existing Contact Smart Actions & Details */}
          {!isNew && contactId && (
            <div style={styles.smartBarContainer}>
              <div style={styles.smartButtonsGroup}>
                <SmartButton
                  label="Bills"
                  count={counts?.billCount ?? 0}
                  icon={Receipt}
                  onClick={() => onViewBills?.(contactId)}
                />
                <SmartButton
                  label="Purchase Orders"
                  count={counts?.poCount ?? 0}
                  icon={ShoppingCart}
                  onClick={() => onViewPOs?.(contactId)}
                />
                <SmartButton
                  label="Partner Statement"
                  count={counts?.totalDue ? `₹${counts.totalDue}` : 'View'}
                  icon={BookOpen}
                  onClick={() => onViewStatement?.(contactId)}
                />
              </div>

              <div style={styles.archiveActionGroup}>
                {formData.gstin && (
                  <span style={styles.gstinBadge}>GSTIN: {formData.gstin}</span>
                )}
                <button
                  type="button"
                  onClick={handleArchiveToggle}
                  style={styles.archiveBtn}
                >
                  <Archive size={14} style={{ marginRight: 6 }} />
                  {formData.is_archived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
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
    maxWidth: 780,
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

  topBtnRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  } as React.CSSProperties,

  leftBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  rightBtnGroup: {
    display: 'flex',
    alignItems: 'center',
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
  } as React.CSSProperties,

  wireframeBtnHover: {
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,

  errorBanner: {
    background: 'var(--danger-bg, #F8EAE6)',
    border: '1px solid var(--danger, #9E4A38)',
    color: 'var(--danger, #9E4A38)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    marginBottom: 20,
    fontWeight: 500,
  } as React.CSSProperties,

  successBanner: {
    background: '#EEF7EE',
    border: '1px solid #3E7B44',
    color: '#2B5E30',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    marginBottom: 20,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  contactNameSection: {
    marginBottom: 28,
  } as React.CSSProperties,

  contactNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  } as React.CSSProperties,

  contactNameLabel: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--brown-900, #4A3A34)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  nameInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  nameLineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 0,
    background: 'transparent',
    padding: '4px 6px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--brown-900, #4A3A34)',
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,

  typeSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingLeft: 4,
  } as React.CSSProperties,

  typeLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--brown-600, #8C6A58)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as React.CSSProperties,

  typePillGroup: {
    display: 'flex',
    gap: 6,
  } as React.CSSProperties,

  typePill: {
    padding: '3px 12px',
    borderRadius: 14,
    border: '1px solid var(--brown-300, #D2B79F)',
    background: 'transparent',
    color: 'var(--brown-700, #77574A)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  } as React.CSSProperties,

  typePillActive: {
    background: 'var(--brown-800, #5C453A)',
    color: 'var(--cream, #F9F2E4)',
    borderColor: 'var(--brown-800, #5C453A)',
  } as React.CSSProperties,

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    columnGap: 44,
    alignItems: 'start',
  } as React.CSSProperties,

  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
  } as React.CSSProperties,

  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  } as React.CSSProperties,

  rowLabel: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    minWidth: 70,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  rowLabelSpacer: {
    minWidth: 70,
  } as React.CSSProperties,

  inputCell: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  centerLineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 0,
    background: 'transparent',
    padding: '4px 6px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'center' as const,
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,

  leftLineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 0,
    background: 'transparent',
    padding: '4px 6px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,

  addressStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
  } as React.CSSProperties,

  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    alignItems: 'center',
  } as React.CSSProperties,

  uploadCard: {
    width: '100%',
    maxWidth: 240,
    height: 190,
    border: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 18,
    background: 'rgba(235, 215, 190, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative' as const,
    transition: 'all 150ms ease',
  } as React.CSSProperties,

  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
    color: 'var(--brown-700, #77574A)',
  } as React.CSSProperties,

  uploadIcon: {
    color: 'var(--brown-600, #8C6A58)',
  } as React.CSSProperties,

  uploadText: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--brown-900, #4A3A34)',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,

  previewHoverText: {
    position: 'absolute' as const,
    bottom: 8,
    padding: '3px 10px',
    background: 'rgba(74, 58, 52, 0.85)',
    color: 'var(--cream, #F9F2E4)',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  } as React.CSSProperties,

  pincodeRow: {
    width: '100%',
    maxWidth: 240,
    marginTop: 2,
  } as React.CSSProperties,

  smartBarContainer: {
    marginTop: 36,
    paddingTop: 20,
    borderTop: '1px solid var(--brown-200, #E4D5C7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 12,
  } as React.CSSProperties,

  smartButtonsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  archiveActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  gstinBadge: {
    fontSize: 12,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--brown-600, #8C6A58)',
    padding: '3px 8px',
    background: 'var(--brown-100, #F3EAE0)',
    borderRadius: 6,
  } as React.CSSProperties,

  archiveBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid var(--brown-300, #D2B79F)',
    background: 'transparent',
    color: 'var(--brown-700, #77574A)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  } as React.CSSProperties,
};

