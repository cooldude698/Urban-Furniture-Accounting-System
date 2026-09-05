import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/FormView';
import { AccountsApi } from '../../api/accounts.api';
import { Journal, CreateJournalInput, JournalType, Account } from '@shared/schemas/account.schema';
import { BookOpen, Landmark, Tag } from 'lucide-react';

interface JournalFormPageProps {
  journalId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
  onNew?: () => void;
}

export const JournalFormPage: React.FC<JournalFormPageProps> = ({ journalId, onBack, onSaved, onHome, onNew }) => {
  const isNew = !journalId;

  const [formData, setFormData] = useState<CreateJournalInput>({
    name: '',
    type: 'purchase',
    default_account_id: 1,
    is_archived: false,
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AccountsApi.getAll(false).then(setAccounts).catch(console.error);

    if (journalId) {
      setLoading(true);
      AccountsApi.getJournalById(journalId)
        .then(data => {
          setJournal(data);
          setFormData({
            name: data.name,
            type: data.type,
            default_account_id: data.default_account_id,
            is_archived: data.is_archived,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setJournal(null);
      setFormData({
        name: '',
        type: 'purchase',
        default_account_id: accounts[0]?.id || 1,
        is_archived: false,
      });
      setError(null);
    }
  }, [journalId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let saved: Journal;
      if (isNew) {
        saved = await AccountsApi.createJournal(formData);
      } else {
        saved = await AccountsApi.updateJournal(journalId!, formData);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save journal');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!journalId || !journal) return;
    try {
      setLoading(true);
      const updated = await AccountsApi.archiveJournal(journalId, !journal.is_archived);
      setJournal(updated);
      setFormData(prev => ({ ...prev, is_archived: updated.is_archived }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormView
      title={isNew ? 'New Journal' : formData.name || 'Edit Journal'}
      subtitle={isNew ? 'Configure a posting book and default account' : `Type: ${formData.type}`}
      isNew={isNew}
      isArchived={formData.is_archived}
      onSave={handleSave}
      onNew={onNew}
      onArchiveToggle={!isNew ? handleArchiveToggle : undefined}
      onBack={onBack}
      onHome={onHome}
      loading={loading}
      error={error}
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
            Journal Name *
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vendor Bills (Purchases)"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-brown-200 rounded-lg text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Journal Type *
            </label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as JournalType })}
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium capitalize"
              >
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
              Default Account (From CoA) *
            </label>
            <div className="relative">
              <select
                value={formData.default_account_id}
                onChange={e => setFormData({ ...formData, default_account_id: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code ? `${acc.code} - ` : ''}{acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </FormView>
  );
};
