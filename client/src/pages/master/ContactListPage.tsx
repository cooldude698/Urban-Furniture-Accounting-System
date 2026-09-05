import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ListView';
import { ContactsApi } from '../../api/contacts.api';
import { Contact, ContactType } from '@shared/schemas/contact.schema';
import { StatusBadge } from '../../components/StatusBadge';
import { Building2, User, UserCheck } from 'lucide-react';

interface ContactListPageProps {
  onSelectContact: (id: number) => void;
  onNewContact: () => void;
}

export const ContactListPage: React.FC<ContactListPageProps> = ({ onSelectContact, onNewContact }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await ContactsApi.getAll(includeArchived, typeFilter);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [includeArchived, typeFilter]);

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: c => (
        <div className="flex items-center gap-3">
          {c.image_path ? (
            <img src={c.image_path} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-brown-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center text-brown-700 font-semibold text-xs">
              {c.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-brown-900">{c.name}</div>
            {c.gstin && <div className="text-xs text-brown-400">GST: {c.gstin}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: c => (
        <span className="inline-flex items-center gap-1.5 capitalize text-xs px-2 py-0.5 rounded-md bg-brown-50 border border-brown-200 text-brown-700">
          {c.type === 'vendor' ? <Building2 className="w-3 h-3 text-brown-500" /> : <User className="w-3 h-3 text-brown-500" />}
          {c.type}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'city',
      header: 'City / State',
      render: c => (c.city || c.state ? `${c.city || ''}${c.city && c.state ? ', ' : ''}${c.state || ''}` : '—'),
    },
    {
      key: 'is_archived',
      header: 'Status',
      align: 'center',
      render: c => <StatusBadge status={c.is_archived ? 'archived' : 'active'} />,
    },
  ];

  return (
    <ListView
      title="Contacts"
      subtitle="Manage customers, vendors, and partners"
      columns={columns}
      data={contacts}
      loading={loading}
      onRowClick={c => c.id && onSelectContact(c.id)}
      onNew={onNewContact}
      includeArchived={includeArchived}
      onToggleArchived={setIncludeArchived}
      filterSlot={
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-surface border border-brown-200 rounded-lg px-3 py-2 text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
          >
            <option value="all">All Types</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="both">Both</option>
          </select>
        </div>
      }
    />
  );
};
