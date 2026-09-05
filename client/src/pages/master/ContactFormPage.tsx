import React, { useState, useEffect, useRef } from 'react';
import { ContactsApi } from '../../api/contacts.api';
import { Contact, CreateContactInput, ContactType } from '@shared/schemas/contact.schema';
import { Upload, ShoppingCart, Receipt, BookOpen, Archive, CheckCircle, ShieldCheck, Key, Copy, X, AlertCircle } from 'lucide-react';
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

// Client-side image compression to prevent payload too large errors
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 480;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Portal User Access State
  const [portalUser, setPortalUser] = useState<{
    id: number;
    login_id: string;
    email: string;
    has_password: boolean;
    invite_token?: string;
  } | null>(null);
  const [enablePortal, setEnablePortal] = useState(false);
  const [portalLoginId, setPortalLoginId] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

      // Fetch linked portal user
      fetch(`/api/portal/contact-user/${contactId}`, { credentials: 'include' })
        .then(r => r.json())
        .then(json => {
          if (json.data) {
            setPortalUser(json.data);
            setEnablePortal(true);
            setPortalLoginId(json.data.login_id);
          } else {
            setPortalUser(null);
            setEnablePortal(false);
            setPortalLoginId('');
          }
        })
        .catch(() => {
          setPortalUser(null);
        });
    } else {
      setContact(null);
      setCounts(null);
      setImagePreview(null);
      setPortalUser(null);
      setEnablePortal(false);
      setPortalLoginId('');
      setPortalPassword('');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, or WEBP).');
        return;
      }
      try {
        setError(null);
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        setFormData(prev => ({ ...prev, image_path: compressedBase64 }));
      } catch (err: any) {
        setError('Failed to process image: ' + err.message);
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_path: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      setImagePreview(null);
      setPortalUser(null);
      setEnablePortal(false);
      setPortalLoginId('');
      setPortalPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleCreatePortalUser = async (targetContactId: number) => {
    if (!formData.email) {
      setError('Contact Email is required to create a Portal User.');
      return;
    }
    const cleanLogin = (
      portalLoginId.trim() ||
      formData.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') ||
      `user${targetContactId}`
    )
      .padEnd(6, '0')
      .slice(0, 12);

    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contactId: targetContactId,
          email: formData.email.trim(),
          fullName: formData.name.trim(),
          loginId: cleanLogin,
          password: portalPassword.length >= 8 ? portalPassword : undefined,
        }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || 'Failed to create portal user');
      }
      setPortalUser({
        id: json.data.userId,
        login_id: json.data.loginId,
        email: json.data.email,
        has_password: Boolean(json.data.hasPassword),
        invite_token: json.data.inviteToken,
      });
      setSuccessMsg(
        json.data.hasPassword
          ? `Portal User active! Login ID: ${json.data.loginId}`
          : `Portal User created! Token: ${json.data.inviteToken}`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create portal user');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMsg(null);

    // 1. Validate Name
    if (!formData.name.trim()) {
      setError('Contact Name is required.');
      return;
    }
    if (formData.name.trim().length < 2) {
      setError('Contact Name must be at least 2 characters long.');
      return;
    }

    // 2. Validate Email (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid Email address with domain (e.g. contact@example.com).');
        return;
      }
    }

    // 3. Validate Phone (if provided)
    if (formData.mobile && formData.mobile.trim()) {
      const cleanedPhone = formData.mobile.replace(/[\s\-]/g, '');
      if (!/^\+?[0-9]{10,14}$/.test(cleanedPhone)) {
        setError('Phone number must contain between 10 and 14 digits.');
        return;
      }
    }

    // 4. Validate PIN Code (Indian pincode is strictly 6 digits)
    if (formData.pincode && formData.pincode.trim()) {
      if (!/^\d{6}$/.test(formData.pincode.trim())) {
        setError('PIN code must be exactly 6 numeric digits.');
        return;
      }
    }

    // 5. Validate Portal access inputs if enabled
    if (enablePortal && !portalUser) {
      if (!formData.email || !formData.email.trim()) {
        setError('Contact Email is required when creating a Portal User.');
        return;
      }
      if (portalLoginId.trim() && (portalLoginId.trim().length < 6 || portalLoginId.trim().length > 12)) {
        setError('Portal Login ID must be between 6 and 12 characters.');
        return;
      }
      if (portalPassword && portalPassword.length < 8) {
        setError('Portal Password must be at least 8 characters if specified.');
        return;
      }
    }

    try {
      setLoading(true);

      let saved: Contact;
      if (isNew) {
        saved = await ContactsApi.create({
          ...formData,
          name: formData.name.trim(),
          email: formData.email?.trim() || '',
          mobile: formData.mobile?.trim() || '',
          pincode: formData.pincode?.trim() || '',
        });
      } else {
        saved = await ContactsApi.update(contactId!, {
          ...formData,
          name: formData.name.trim(),
          email: formData.email?.trim() || '',
          mobile: formData.mobile?.trim() || '',
          pincode: formData.pincode?.trim() || '',
        });
      }

      // If portal access is enabled and not yet created, create portal user
      if (enablePortal && !portalUser && saved.id) {
        await handleCreatePortalUser(saved.id);
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
      setSuccessMsg(updated.is_archived ? 'Contact archived.' : 'Contact unarchived.');
    } catch (err: any) {
      setError(err.message || 'Failed to toggle archive state');
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
                  ...styles.wireframeBtnPrimary,
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
              <AlertCircle size={16} style={{ marginRight: 8, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div style={styles.successBanner} role="status">
              <CheckCircle size={16} style={{ marginRight: 8, flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Contact Name & Type Header Section */}
          <div style={styles.contactNameSection}>
            <div style={styles.contactNameRow}>
              <label htmlFor="contact-name" style={styles.contactNameLabel}>
                Contact Name *
              </label>
              <div style={styles.nameInputContainer}>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Chauhan"
                  style={styles.nameLineInput}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Contact Type Selector */}
            <div style={styles.typeSelectorRow}>
              <span style={styles.typeLabel}>TYPE:</span>
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

          {/* Main Form Grid */}
          <div style={styles.formGrid}>
            {/* Left Column: Email, Phone, Address Stack */}
            <div style={styles.leftCol}>
              {/* Email */}
              <div style={styles.formRow}>
                <label style={styles.rowLabel}>Email</label>
                <div style={styles.inputCell}>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    style={styles.leftLineInput}
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
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d+]/g, '').slice(0, 15);
                      setFormData({ ...formData, mobile: val });
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={15}
                    style={styles.leftLineInput}
                  />
                </div>
              </div>

              {/* Address Stack */}
              <div style={styles.addressStack}>
                {/* Street */}
                <div style={styles.formRow}>
                  <label style={styles.rowLabel}>Address</label>
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address line 1"
                      style={styles.leftLineInput}
                    />
                  </div>
                </div>

                {/* City */}
                <div style={styles.formRow}>
                  <div style={styles.rowLabelSpacer} />
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      style={styles.leftLineInput}
                    />
                  </div>
                </div>

                {/* State */}
                <div style={styles.formRow}>
                  <div style={styles.rowLabelSpacer} />
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      style={styles.leftLineInput}
                    />
                  </div>
                </div>

                {/* PIN Code */}
                <div style={styles.formRow}>
                  <label style={styles.rowLabel}>PIN Code</label>
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={formData.pincode || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({ ...formData, pincode: val });
                      }}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      style={styles.leftLineInput}
                    />
                  </div>
                </div>

                {/* Country */}
                <div style={styles.formRow}>
                  <label style={styles.rowLabel}>Country</label>
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder="Country"
                      style={styles.leftLineInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Profile Image Card */}
            <div style={styles.rightCol}>
              <div style={styles.photoCardHeader}>
                <span style={styles.photoLabel}>Profile Photo</span>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={styles.uploadCard}
                title="Click to select image"
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
                    <div style={styles.previewOverlay}>
                      <span>Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <Upload size={28} style={styles.uploadIcon} />
                    <span style={styles.uploadText}>Upload Image</span>
                    <span style={styles.uploadSubtext}>PNG or JPG</span>
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

              {imagePreview && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={styles.removeImageBtn}
                  >
                    <X size={13} style={{ marginRight: 4 }} /> Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Contact Portal User Access Section ── */}
          <div style={styles.portalSection}>
            <div style={styles.portalHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#77574A" />
                <span style={styles.portalSectionTitle}>Contact Portal User Access</span>
              </div>
              {portalUser && (
                <span style={styles.portalActiveBadge}>
                  <CheckCircle size={12} style={{ marginRight: 4 }} />
                  Portal Access Active
                </span>
              )}
            </div>

            {portalUser ? (
              <div style={styles.portalInfoBox}>
                <div style={styles.portalFieldRow}>
                  <span style={styles.portalFieldLabel}>Login ID:</span>
                  <span style={styles.portalFieldValue}>{portalUser.login_id}</span>
                </div>
                <div style={styles.portalFieldRow}>
                  <span style={styles.portalFieldLabel}>Email:</span>
                  <span style={styles.portalFieldValue}>{portalUser.email}</span>
                </div>
                <div style={styles.portalFieldRow}>
                  <span style={styles.portalFieldLabel}>Status:</span>
                  <span
                    style={{
                      ...styles.portalFieldValue,
                      color: portalUser.has_password ? '#16A34A' : '#D97706',
                      fontWeight: 700,
                    }}
                  >
                    {portalUser.has_password ? 'Active (Password Configured)' : 'Invited (Pending Password Setup)'}
                  </span>
                </div>
                {portalUser.invite_token && !portalUser.has_password && (
                  <div style={styles.inviteUrlBox}>
                    <span style={{ fontSize: 12, color: '#5C453A' }}>
                      Invite URL:{' '}
                      <code style={{ background: '#EFE6D8', padding: '2px 6px', borderRadius: 4 }}>
                        {`/portal/accept-invite?token=${portalUser.invite_token}`}
                      </code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/portal/accept-invite?token=${portalUser.invite_token}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      style={styles.copyBtn}
                    >
                      <Copy size={11} style={{ marginRight: 4 }} />
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.portalSetupBox}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enablePortal}
                    onChange={e => {
                      setEnablePortal(e.target.checked);
                      if (e.target.checked && !portalLoginId && formData.email) {
                        const autoLogin = formData.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
                        setPortalLoginId(autoLogin.padEnd(6, '0'));
                      }
                    }}
                    style={{ marginRight: 8, accentColor: '#77574A' }}
                  />
                  <span>Create / Enable Customer & Vendor Portal Access for this Contact</span>
                </label>

                {enablePortal && (
                  <div style={styles.portalInputsGrid}>
                    <div style={styles.portalInputRow}>
                      <label style={styles.portalInputLabel}>Login ID (6-12 chars):</label>
                      <input
                        type="text"
                        value={portalLoginId}
                        onChange={e => setPortalLoginId(e.target.value)}
                        placeholder="e.g. rahul01"
                        maxLength={12}
                        style={styles.leftLineInput}
                      />
                    </div>
                    <div style={styles.portalInputRow}>
                      <label style={styles.portalInputLabel}>Set Password (Optional, ≥ 8 chars):</label>
                      <input
                        type="password"
                        value={portalPassword}
                        onChange={e => setPortalPassword(e.target.value)}
                        placeholder="Leave blank to generate an invitation link"
                        style={styles.leftLineInput}
                      />
                    </div>

                    {!isNew && contactId && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleCreatePortalUser(contactId)}
                          disabled={portalLoading}
                          style={styles.createPortalBtn}
                        >
                          <Key size={13} style={{ marginRight: 6 }} />
                          {portalLoading ? 'Creating Portal User...' : 'Create Portal User Now'}
                        </button>
                      </div>
                    )}
                    {isNew && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#77574A', fontStyle: 'italic' }}>
                        Portal user credentials will be created and linked automatically when clicking Confirm.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
    marginBottom: 24,
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

  wireframeBtnPrimary: {
    padding: '7px 24px',
    border: '1.5px solid var(--brown-900, #4A3A34)',
    borderRadius: 12,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--cream, #F9F2E4)',
    background: 'var(--brown-900, #4A3A34)',
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
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 20,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  successBanner: {
    background: '#EEF7EE',
    border: '1px solid #3E7B44',
    color: '#2B5E30',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 20,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  contactNameSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px dashed var(--brown-200, #DFBF9F)',
  } as React.CSSProperties,

  contactNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  } as React.CSSProperties,

  contactNameLabel: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--brown-900, #4A3A34)',
    whiteSpace: 'nowrap' as const,
    minWidth: 120,
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
    padding: '6px 4px',
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
    gap: 12,
    marginTop: 14,
    paddingLeft: 2,
  } as React.CSSProperties,

  typeLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--brown-700, #77574A)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    minWidth: 50,
  } as React.CSSProperties,

  typePillGroup: {
    display: 'flex',
    gap: 8,
  } as React.CSSProperties,

  typePill: {
    padding: '4px 14px',
    borderRadius: 14,
    border: '1px solid var(--brown-300, #D2B79F)',
    background: 'transparent',
    color: 'var(--brown-700, #77574A)',
    fontSize: 12,
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
    gridTemplateColumns: '1.5fr 1fr',
    columnGap: 40,
    alignItems: 'start',
  } as React.CSSProperties,

  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
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
    fontSize: 13,
    color: 'var(--brown-900, #4A3A34)',
    minWidth: 80,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  rowLabelSpacer: {
    minWidth: 80,
  } as React.CSSProperties,

  inputCell: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  leftLineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 0,
    background: 'transparent',
    padding: '6px 4px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'left' as const,
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,

  addressStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    marginTop: 4,
  } as React.CSSProperties,

  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  } as React.CSSProperties,

  photoCardHeader: {
    marginBottom: 8,
    width: '100%',
    maxWidth: 220,
  } as React.CSSProperties,

  photoLabel: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--brown-900, #4A3A34)',
  } as React.CSSProperties,

  uploadCard: {
    width: 220,
    height: 180,
    borderRadius: 16,
    border: '1.5px dashed var(--brown-400, #B8977E)',
    background: 'var(--brown-50, #F8F3ED)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative' as const,
    transition: 'all 180ms ease',
  } as React.CSSProperties,

  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  } as React.CSSProperties,

  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  } as React.CSSProperties,

  previewOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(74, 58, 52, 0.75)',
    color: 'var(--cream, #F9F2E4)',
    textAlign: 'center' as const,
    padding: '6px 0',
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,

  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    color: 'var(--brown-500, #A8836C)',
  } as React.CSSProperties,

  uploadIcon: {
    color: 'var(--brown-600, #8C6A58)',
  } as React.CSSProperties,

  uploadText: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--brown-800, #5C453A)',
  } as React.CSSProperties,

  uploadSubtext: {
    fontSize: 11,
    color: 'var(--brown-500, #A8836C)',
  } as React.CSSProperties,

  removeImageBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--danger, #9E4A38)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
  } as React.CSSProperties,

  portalSection: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: '1px solid var(--brown-200, #DFBF9F)',
  } as React.CSSProperties,

  portalHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  } as React.CSSProperties,

  portalSectionTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
  } as React.CSSProperties,

  portalActiveBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: '#16A34A',
    background: '#ECFDF5',
    padding: '3px 10px',
    borderRadius: 12,
    border: '1px solid #A7F3D0',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  portalInfoBox: {
    background: '#FAF6F0',
    border: '1px solid var(--brown-200, #DFBF9F)',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,

  portalFieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
  } as React.CSSProperties,

  portalFieldLabel: {
    color: 'var(--brown-600, #8C6A58)',
    minWidth: 80,
    fontWeight: 600,
  } as React.CSSProperties,

  portalFieldValue: {
    color: 'var(--brown-900, #4A3A34)',
    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
  } as React.CSSProperties,

  inviteUrlBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px dashed var(--brown-300, #D2B79F)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  copyBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--brown-400, #B8977E)',
    background: '#FFF',
    fontSize: 11,
    fontWeight: 600,
    color: '#4A3A34',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  portalSetupBox: {
    background: '#FAF6F0',
    border: '1px solid var(--brown-200, #DFBF9F)',
    borderRadius: 12,
    padding: '14px 18px',
  } as React.CSSProperties,

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--brown-900, #4A3A34)',
    cursor: 'pointer',
  } as React.CSSProperties,

  portalInputsGrid: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,

  portalInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  } as React.CSSProperties,

  portalInputLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--brown-700, #77574A)',
    minWidth: 160,
  } as React.CSSProperties,

  createPortalBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--brown-800, #5C453A)',
    color: 'var(--cream, #F9F2E4)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  } as React.CSSProperties,

  smartBarContainer: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: '1px solid var(--brown-200, #DFBF9F)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 16,
  } as React.CSSProperties,

  smartButtonsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  archiveActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  gstinBadge: {
    fontSize: 11,
    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
    color: 'var(--brown-700, #77574A)',
    background: 'var(--brown-100, #EBD7BE)',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 600,
  } as React.CSSProperties,

  archiveBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid var(--brown-400, #B8977E)',
    background: '#FFF',
    color: 'var(--brown-800, #5C453A)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
};

export default ContactFormPage;
