import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ui/ListView';
import { AccountsApi } from '../../api/accounts.api';
import { Journal } from '@shared/schemas/account.schema';
import { StatusBadge } from '../../components/StatusBadge';
import { BookOpen } from 'lucide-react';

interface JournalListPageProps {
  onSelectJournal: (id: number) => void;
  onNewJournal: () => void;
}

export const JournalListPage: React.FC<JournalListPageProps> = ({ onSelectJournal, onNewJournal }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const data = await AccountsApi.getAllJournals(includeArchived, typeFilter);
      setJournals(data);
    } catch (err) {
      console.error('Failed to load journals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [includeArchived, typeFilter]);

  const columns: Column<Journal>[] = [
    {
      key: 'name',
      header: 'Journal Name',
      render: j => (
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-brown-400" />
          <span className="font-semibold text-brown-900">{j.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: j => (
        <span className="inline-flex items-center capitalize text-xs px-2.5 py-0.5 rounded-full font-medium bg-brown-100 text-brown-800">
          {j.type}
        </span>
      ),
    },
    {
      key: 'default_account_name',
      header: 'Default Account (From CoA)',
      render: j => (
        <span className="text-sm font-medium text-brown-700">
          {j.default_account_name || '—'}
        </span>
      ),
    },
    {
      key: 'is_archived',
      header: 'Status',
      align: 'center',
      render: j => <StatusBadge status={j.is_archived ? 'archived' : 'active'} />,
    },
  ];

  return (
    <ListView
      title="Journals"
      subtitle="Transaction entry books linked to default Chart of Accounts"
      columns={columns}
      data={journals}
      loading={loading}
      onRowClick={j => j.id && onSelectJournal(j.id)}
      onNew={onNewJournal}
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
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      }
    />
  );
};
