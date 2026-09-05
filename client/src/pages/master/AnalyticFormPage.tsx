import React, { useState, useEffect } from 'react';
import { FormView } from '../../components/FormView';
import { AnalyticsApi } from '../../api/analytics.api';
import { AnalyticAccount, CreateAnalyticAccountInput, AnalyticType } from '@shared/schemas/analytic.schema';
import { PieChart, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface AnalyticFormPageProps {
  analyticId?: number | null;
  onBack: () => void;
  onSaved: (id: number) => void;
  onHome: () => void;
}

export const AnalyticFormPage: React.FC<AnalyticFormPageProps> = ({ analyticId, onBack, onSaved, onHome }) => {
  const isNew = !analyticId;

  const [formData, setFormData] = useState<CreateAnalyticAccountInput>({
    name: '',
    type: 'expense',
    description: '',
    is_archived: false,
  });

  const [item, setItem] = useState<AnalyticAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analyticId) {
      setLoading(true);
      AnalyticsApi.getById(analyticId)
        .then(data => {
          setItem(data);
          setFormData({
            name: data.name,
            type: data.type,
            description: data.description || '',
            is_archived: data.is_archived,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [analyticId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let saved: AnalyticAccount;
      if (isNew) {
        saved = await AnalyticsApi.create(formData);
      } else {
        saved = await AnalyticsApi.update(analyticId!, formData);
      }

      onSaved(saved.id!);
    } catch (err: any) {
      setError(err.message || 'Failed to save analytic account');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!analyticId || !item) return;
    try {
      setLoading(true);
      const updated = await AnalyticsApi.archive(analyticId, !item.is_archived);
      setItem(updated);
      setFormData(prev => ({ ...prev, is_archived: updated.is_archived }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormView
      title={isNew ? 'New Analytic Account' : formData.name || 'Edit Analytic Account'}
      subtitle={isNew ? 'Create a cost center or project budget dimension' : `Type: ${formData.type}`}
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
            Analytic Account Name *
          </label>
          <div className="relative">
            <PieChart className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Warehouse & Logistics"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-brown-200 rounded-lg text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-2">
            Analytic Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                formData.type === 'expense'
                  ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                  : 'border-brown-200 bg-surface hover:bg-brown-50/30'
              }`}
            >
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-semibold text-sm text-brown-900">Expense (Cost Center)</div>
                <div className="text-xs text-brown-500">Tracks purchase orders & vendor bills</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                formData.type === 'income'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                  : 'border-brown-200 bg-surface hover:bg-brown-50/30'
              }`}
            >
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-sm text-brown-900">Income (Revenue Stream)</div>
                <div className="text-xs text-brown-500">Tracks sales orders & customer invoices</div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brown-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-brown-400" />
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the scope and budgeting purpose of this analytic account..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>
    </FormView>
  );
};
