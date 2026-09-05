import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/FormView';
import { AccountsApi } from '../../api/accounts.api';
import { Account, CreateAccountInput, AccountType, AccountGroupMap } from '@shared/schemas/account.schema';
import { Landmark, Hash, Tag, FileText } from 'lucide-react';

interface AccountFormPageProps {
  accountId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
}

export const AccountFormPage: React.FC<AccountFormPageProps> = ({ accountId, onBack, onSaved, onHome }) => {
  const isNew = !accountId;

  const [formData, setFormData] = useState<CreateAccountInput>({
    code: '',
    name: '',
    type: 'asset',
    is_archived: false,
  });

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      setLoading(true);
      AccountsApi.getById(accountId)
        .then(data => {
          setAccount(data);
          setFormData({
            code: data.code || '',
            name: data.name,
            type: data.type,
            is_archived: data.is_archived,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [accountId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let saved: Account;
      if (isNew) {
        saved = await AccountsApi.create(formData);
      } else {
        saved = await AccountsApi.update(accountId!, formData);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!accountId || !account) return;
    try {
      setLoading(true);
      const updated = await AccountsApi.archive(accountId, !account.is_archived);
      setAccount(updated);
      setFormData(prev => ({ ...prev, is_archived: updated.is_archived }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reportGroup = AccountGroupMap[formData.type] || 'Balancesheet';

  return (
    <FormView
      title={isNew ? 'New Chart of Account' : formData.name || 'Edit Account'}
      subtitle={isNew ? 'Define a new ledger account' : `Code: ${formData.code || accountId}`}
      isNew={isNew}
      isArchived={formData.is_archived}
      onSave={handleSave}
      onNew={() => onSaved(0)}
      onArchiveToggle={!isNew ? handleArchiveToggle : undefined}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
            Account Name *
          </label>
          <div className="relative">
            <Landmark className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Raw Timber Inventory"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-brown-200 rounded-lg text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Account Code
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                type="text"
                value={formData.code || ''}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="1005"
                className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg font-mono text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Account Type *
            </label>
            <div className="relative">
              <select
                id="account-type-dropdown"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as AccountType })}
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
              >
                {/* Balance Sheet Group — Heading is disabled / non-selectable */}
                <optgroup label="Balancesheet" className="font-bold text-brown-800 bg-brown-50">
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="bank">Bank</option>
                  <option value="capital">Capital</option>
                  <option value="cash">Cash</option>
                </optgroup>

                {/* Profit and Loss Group — Heading is disabled / non-selectable */}
                <optgroup label="Profit and Loss" className="font-bold text-brown-800 bg-brown-50">
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                  <option value="other_expense">Other Expenses</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Report Group Placement Indicator */}
        <div className="p-4 bg-brown-50/70 border border-brown-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-brown-700">
              <Tag className="w-4 h-4 text-brown-500" />
              Financial Statement Placement:
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                reportGroup === 'Balancesheet'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {reportGroup}
            </span>
          </div>
          <p className="text-[11px] text-brown-500 mt-2">
            Derived automatically from account type. Balance sheet accounts carry cumulative balances, whereas Profit & Loss accounts track period movements.
          </p>
        </div>
      </div>
    </FormView>
  );
};
