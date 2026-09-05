import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ListView';
import { AccountsApi } from '../../api/accounts.api';
import { Account, AccountGroupMap } from '@shared/schemas/account.schema';
import { StatusBadge } from '../../components/StatusBadge';
import Money from '../../components/ui/Money';
import { Landmark } from 'lucide-react';

export interface AccountWithBalance extends Account {
  balance?: string;
  total_debit?: string;
  total_credit?: string;
}

interface AccountListPageProps {
  onSelectAccount: (id: number) => void;
  onNewAccount: () => void;
}

export const AccountListPage: React.FC<AccountListPageProps> = ({ onSelectAccount, onNewAccount }) => {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await AccountsApi.getAll(includeArchived, typeFilter);
      setAccounts(data as AccountWithBalance[]);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [includeArchived, typeFilter]);

  const columns: Column<AccountWithBalance>[] = [
    {
      key: 'code',
      header: 'Code',
      className: 'font-mono text-xs font-semibold text-brown-700 w-24',
      render: a => a.code || `ACC-${a.id?.toString().padStart(4, '0')}`,
    },
    {
      key: 'name',
      header: 'Account Name',
      render: a => (
        <div className="flex items-center gap-2.5">
          <Landmark className="w-4 h-4 text-brown-400" />
          <span className="font-semibold text-brown-900">{a.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: a => (
        <span className="inline-flex items-center capitalize text-xs px-2.5 py-0.5 rounded-full font-medium bg-brown-100 text-brown-800">
          {a.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'group',
      header: 'Report Group',
      render: a => {
        const group = AccountGroupMap[a.type] || 'Balancesheet';
        return (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              group === 'Balancesheet' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {group}
          </span>
        );
      },
    },
    {
      key: 'total_debit',
      header: 'Total Debit',
      align: 'right',
      className: 'font-mono text-xs text-brown-900',
      render: a => <Money value={a.total_debit || '0.00'} />,
    },
    {
      key: 'total_credit',
      header: 'Total Credit',
      align: 'right',
      className: 'font-mono text-xs text-brown-900',
      render: a => <Money value={a.total_credit || '0.00'} />,
    },
    {
      key: 'balance',
      header: 'Net Balance',
      align: 'right',
      className: 'font-mono text-xs font-bold',
      render: a => {
        const bal = a.balance || '0.00';
        return (
          <span className={Number(bal) < 0 ? 'text-brown-700' : 'text-brown-900'}>
            <Money value={bal} />
          </span>
        );
      },
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
      title="Chart of Accounts"
      subtitle="General ledger accounts categorized for Balance Sheet & Profit & Loss with live ledger balances"
      columns={columns}
      data={accounts}
      loading={loading}
      onRowClick={a => a.id && onSelectAccount(a.id)}
      onNew={onNewAccount}
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
            <optgroup label="Balancesheet">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="bank">Bank</option>
              <option value="capital">Capital</option>
              <option value="cash">Cash</option>
            </optgroup>
            <optgroup label="Profit and Loss">
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="other_expense">Other Expenses</option>
            </optgroup>
          </select>
        </div>
      }
    />
  );
};
