import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ListView';
import { AnalyticsApi } from '../../api/analytics.api';
import { AnalyticAccount } from '@shared/schemas/analytic.schema';
import { StatusBadge } from '../../components/StatusBadge';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticListPageProps {
  onSelectAnalytic: (id: number) => void;
  onNewAnalytic: () => void;
}

export const AnalyticListPage: React.FC<AnalyticListPageProps> = ({ onSelectAnalytic, onNewAnalytic }) => {
  const [analytics, setAnalytics] = useState<AnalyticAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await AnalyticsApi.getAll(includeArchived, typeFilter);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytic accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [includeArchived, typeFilter]);

  const columns: Column<AnalyticAccount>[] = [
    {
      key: 'name',
      header: 'Analytic Account Name',
      render: a => (
        <div className="flex items-center gap-2.5">
          <PieChart className="w-4 h-4 text-brown-400" />
          <span className="font-semibold text-brown-900">{a.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: a => (
        <span
          className={`inline-flex items-center gap-1.5 capitalize text-xs px-2.5 py-0.5 rounded-full font-medium ${
            a.type === 'income'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {a.type === 'income' ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-amber-600" />}
          {a.type}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: a => <span className="text-sm text-brown-600">{a.description || '—'}</span>,
    },
    {
      key: 'is_archived',
      header: 'Status',
      align: 'center',
      render: a => <StatusBadge status={a.is_archived ? 'archived' : 'active'} />,
    },
  ];

  return (
    <ListView
      title="Analytic Accounts"
      subtitle="Cost centers and revenue streams for budget analytics"
      columns={columns}
      data={analytics}
      loading={loading}
      onRowClick={a => a.id && onSelectAnalytic(a.id)}
      onNew={onNewAnalytic}
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
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      }
    />
  );
};
