import React, { useState, useEffect, useRef } from 'react';
import { FormView } from '../../components/FormView';
import { ContactsApi } from '../../api/contacts.api';
import { Contact, CreateContactInput, ContactType } from '@shared/schemas/contact.schema';
import { Upload, User, Building2, MapPin, Mail, Phone, FileText, ShoppingCart, Receipt, BookOpen } from 'lucide-react';
import { SmartButton } from '../../components/SmartButton';

interface ContactFormPageProps {
  contactId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onViewBills?: (vendorId: number) => void;
  onViewPOs?: (vendorId: number) => void;
  onViewStatement?: (contactId: number) => void;
}

export const ContactFormPage: React.FC<ContactFormPageProps> = ({
  contactId,
  onBack,
  onSaved,
  onHome,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    }
  }, [contactId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

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
    <FormView
      title={isNew ? 'New Contact' : formData.name || 'Edit Contact'}
      subtitle={isNew ? 'Create a customer or vendor master record' : `ID: ${contactId}`}
      isNew={isNew}
      isArchived={formData.is_archived}
      onSave={handleSave}
      onNew={() => onSaved(0)}
      onArchiveToggle={!isNew ? handleArchiveToggle : undefined}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
      extraButtons={
        !isNew && contactId ? (
          <div className="flex items-center gap-2">
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
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Type */}
        <div className="flex flex-col items-center p-6 bg-brown-50/50 rounded-xl border border-brown-200/80">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-brown-300 bg-surface flex items-center justify-center shadow-inner">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-brown-300" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-brown-700 text-cream rounded-full hover:bg-brown-800 shadow transition-transform group-hover:scale-105"
              title="Upload Photo"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <span className="text-xs text-brown-500 mb-6">PNG, JPG up to 5MB</span>

          <div className="w-full">
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-2">
              Contact Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['customer', 'vendor', 'both'] as ContactType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t })}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border capitalize transition-all ${
                    formData.type === t
                      ? 'bg-brown-700 text-cream border-brown-700 shadow-sm'
                      : 'bg-surface text-brown-700 border-brown-200 hover:bg-brown-100/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Contact / Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Modern Living Supplies Ltd"
              className="w-full px-4 py-2.5 bg-surface border border-brown-200 rounded-lg text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                Mobile / Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  type="text"
                  value={formData.mobile || ''}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-brown-100 pt-4">
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building, street, landmark..."
              className="w-full px-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode || ''}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              GSTIN
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm font-mono text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
          </div>
        </div>
      </div>
    </FormView>
  );
};
