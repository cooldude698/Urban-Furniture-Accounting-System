import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/axios';
import { BusinessTemplateSummary, TemplateCategory } from '../../types/template';

export const AdminTemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<BusinessTemplateSummary[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/templates?includeInactive=true'),
      api.get('/api/templates/categories'),
    ])
      .then(([tmplRes, catRes]) => {
        if (tmplRes.data?.data) setTemplates(tmplRes.data.data);
        if (catRes.data?.data) setCategories(catRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      setUpdatingId(id);
      await api.patch(`/api/templates/${id}/status`, {
        isActive: !currentActive,
      });
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, isActive: !currentActive } : t))
      );
    } catch (err: any) {
      alert('Failed to update template status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = templates.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.profession.toLowerCase().includes(search.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="bg-surface border border-brown-300 rounded-[12px] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold uppercase tracking-wider text-amber-900">
              <Shield className="w-3 h-3 text-amber-800" />
              <span>Admin Control Panel</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-brown-900">
              Template Management
            </h1>
            <p className="text-xs text-brown-600">
              Manage the master business template library, activate/deactivate templates, and audit source metadata.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-[8px] bg-brown-100 border border-brown-200 text-brown-800">
              {templates.filter(t => t.isActive).length} Active / {templates.length} Total
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-brown-200">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-brown-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search master templates..."
              className="w-full pl-9 pr-3 py-1.5 bg-cream/40 border border-brown-300 rounded-[6px] text-xs text-brown-900 focus:outline-none focus:ring-1 focus:ring-brown-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-brown-500 text-xs">Loading template catalogue...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brown-900 text-cream font-semibold">
                  <th className="p-3">Template Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Target Profession</th>
                  <th className="p-3">Version & Source</th>
                  <th className="p-3">ERP Binding</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {filtered.map(tmpl => (
                  <tr key={tmpl.id} className="hover:bg-brown-50/50">
                    <td className="p-3 font-bold text-brown-900 font-sans">
                      {tmpl.name}
                      <span className="block text-[10px] text-brown-500 font-normal truncate max-w-xs">
                        {tmpl.description}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-brown-100 text-brown-800 font-medium text-[10px]">
                        {tmpl.categoryName}
                      </span>
                    </td>
                    <td className="p-3 text-brown-700 max-w-xs truncate">
                      {tmpl.profession}
                    </td>
                    <td className="p-3 text-brown-600 text-[11px]">
                      <div>v{tmpl.version}</div>
                      <div className="text-[10px] text-brown-400 italic truncate max-w-[180px]">
                        {tmpl.sourceType}
                      </div>
                    </td>
                    <td className="p-3 text-brown-700 font-mono text-[11px]">
                      {tmpl.erpDataSource ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {tmpl.erpDataSource}
                        </span>
                      ) : (
                        <span className="text-brown-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tmpl.isActive
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tmpl.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={updatingId === tmpl.id}
                        onClick={() => handleToggleActive(tmpl.id, tmpl.isActive)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          tmpl.isActive
                            ? 'text-amber-800 hover:bg-amber-100'
                            : 'text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {tmpl.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTemplateManagementPage;
