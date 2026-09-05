import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Save,
  Database,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import api from '../../lib/axios';
import { BusinessTemplateDetail, UserTemplateItem } from '../../types/template';

interface TemplateCustomizeModalProps {
  template: BusinessTemplateDetail | null;
  savedItem?: UserTemplateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSavedSuccess?: () => void;
}

export const TemplateCustomizeModal: React.FC<TemplateCustomizeModalProps> = ({
  template,
  savedItem,
  isOpen,
  onClose,
  onSavedSuccess,
}) => {
  if (!isOpen || !template) return null;

  // Configuration State
  const [templateName, setTemplateName] = useState<string>(
    savedItem?.name || template.name
  );
  const [businessName, setBusinessName] = useState<string>(
    savedItem?.configuration?.businessName || 'Urban Furniture Studio'
  );
  const [financialYear, setFinancialYear] = useState<string>(
    savedItem?.configuration?.financialYear || '2026-2027'
  );
  const [currency, setCurrency] = useState<string>(
    savedItem?.configuration?.currency || '₹'
  );
  const [openingBalance, setOpeningBalance] = useState<string>(
    savedItem?.configuration?.openingBalance || template.previewData?.openingBalance || '0.00'
  );
  const [notes, setNotes] = useState<string>(
    savedItem?.configuration?.notes || ''
  );
  const [useLiveErpData, setUseLiveErpData] = useState<boolean>(
    savedItem?.configuration?.useLiveErpData || false
  );

  // Table Data State
  const [rows, setRows] = useState<Array<Record<string, any>>>(
    savedItem?.customData?.rows || template.previewData?.rows || []
  );

  const [loadingErp, setLoadingErp] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update rows when savedItem changes
  useEffect(() => {
    if (savedItem) {
      setTemplateName(savedItem.name);
      setBusinessName(savedItem.configuration?.businessName || 'Urban Furniture Studio');
      setFinancialYear(savedItem.configuration?.financialYear || '2026-2027');
      setCurrency(savedItem.configuration?.currency || '₹');
      setOpeningBalance(savedItem.configuration?.openingBalance || '0.00');
      setNotes(savedItem.configuration?.notes || '');
      setUseLiveErpData(savedItem.configuration?.useLiveErpData || false);
      setRows(savedItem.customData?.rows || template.previewData?.rows || []);
    } else {
      setTemplateName(template.name);
      setBusinessName('Urban Furniture Studio');
      setFinancialYear('2026-2027');
      setCurrency('₹');
      setOpeningBalance(template.previewData?.openingBalance || '0.00');
      setNotes('');
      setUseLiveErpData(false);
      setRows(template.previewData?.rows || []);
    }
    setStatusMsg(null);
  }, [template, savedItem]);

  // Handle toggling Live ERP data
  const handleToggleLiveErp = async (enabled: boolean) => {
    setUseLiveErpData(enabled);
    setStatusMsg(null);
    if (!enabled) {
      setRows(template.previewData?.rows || []);
      return;
    }

    if (!template.erpDataSource) {
      setStatusMsg({ type: 'error', text: 'This template does not have direct ERP data binding.' });
      return;
    }

    try {
      setLoadingErp(true);
      const res = await api.get(`/api/templates/${template.id}/erp-data`);
      if (res.data?.data && res.data.data.length > 0) {
        setRows(res.data.data);
        setStatusMsg({
          type: 'success',
          text: `Loaded ${res.data.data.length} live records from ERP ledger & master database.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'No live records found in ERP for this document type. Using template starter rows.',
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.error?.message || err.message });
    } finally {
      setLoadingErp(false);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [key]: value,
      };
      return updated;
    });
  };

  const handleAddRow = () => {
    const emptyRow: Record<string, any> = {};
    for (const c of template.structure?.columns || []) {
      emptyRow[c.key] = c.type === 'currency' || c.type === 'number' ? '0.00' : '';
    }
    setRows(prev => [...prev, emptyRow]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Export File Handlers
  const handleDownload = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      setDownloadingFormat(format);
      setStatusMsg(null);

      const responseType = format === 'pdf' ? 'blob' : 'blob';
      const res = await api.post(
        `/api/templates/${template.id}/export/${format}`,
        {
          config: {
            businessName,
            financialYear,
            currency,
            openingBalance,
            notes,
          },
          rows,
        },
        { responseType }
      );

      const contentType = String(res.headers['content-type'] || '');
      if (format === 'pdf' && contentType.includes('text/html')) {
        const text = await (res.data as Blob).text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(text);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
          setStatusMsg({
            type: 'success',
            text: 'Printable template opened in a new tab! Use Print / Save as PDF.',
          });
        } else {
          // If popup blocked, download HTML file
          const blob = new Blob([res.data], { type: 'text/html;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${template.slug}_${financialYear.replace('/', '-')}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setStatusMsg({
            type: 'success',
            text: 'Template exported as printable document. Open and use Print -> Save as PDF.',
          });
        }
        return;
      }

      // Create blob URL and trigger download
      const mimeTypes: Record<string, string> = {
        xlsx: 'application/vnd.ms-excel',
        csv: 'text/csv;charset=utf-8;',
        pdf: 'application/pdf',
      };
      const blob = new Blob([res.data], { type: mimeTypes[format] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.slug}_${financialYear.replace('/', '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMsg({
        type: 'success',
        text: `Template successfully exported as .${format.toUpperCase()}!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.error?.message || err.message });
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Save to My Templates
  const handleSaveToMyTemplates = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      await api.post('/api/templates/my/save', {
        templateId: template.id,
        name: templateName,
        configuration: {
          businessName,
          financialYear,
          currency,
          openingBalance,
          notes,
          useLiveErpData,
        },
        customData: {
          rows,
        },
      });

      setStatusMsg({
        type: 'success',
        text: 'Customized template saved to "My Templates" successfully!',
      });
      if (onSavedSuccess) onSavedSuccess();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.error?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const cols = template.structure?.columns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-brown-300 rounded-[12px] shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-brown-200 bg-brown-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-brown-900 text-cream flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-brown-900">
                  Customize Template: {template.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brown-200 text-brown-800">
                  {template.profession}
                </span>
              </div>
              <p className="text-xs text-brown-600">
                Tailor business details, link ERP transactions, and export as spreadsheet or PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-brown-500 hover:text-brown-900 hover:bg-brown-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form & Table */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-[8px] border text-xs font-medium flex items-center gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Business Configuration Grid */}
          <div className="p-4 bg-brown-50/60 rounded-[10px] border border-brown-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brown-800 mb-3">
              1. Business Header & Formatting Setup
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-brown-700 font-semibold mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface border border-brown-300 rounded-[6px] text-brown-900 font-medium focus:outline-none focus:ring-1 focus:ring-brown-700"
                />
              </div>

              <div>
                <label className="block text-brown-700 font-semibold mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface border border-brown-300 rounded-[6px] text-brown-900 font-medium focus:outline-none focus:ring-1 focus:ring-brown-700"
                />
              </div>

              <div>
                <label className="block text-brown-700 font-semibold mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={e => setFinancialYear(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-2.5 py-1.5 bg-surface border border-brown-300 rounded-[6px] text-brown-900 font-mono focus:outline-none focus:ring-1 focus:ring-brown-700"
                />
              </div>

              <div>
                <label className="block text-brown-700 font-semibold mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface border border-brown-300 rounded-[6px] text-brown-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brown-700"
                >
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>

            {/* Optional opening balance & ERP live data toggle */}
            <div className="mt-3.5 pt-3.5 border-t border-brown-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-brown-700 font-medium inline-block mr-2">
                    Opening / Initial Balance:
                  </label>
                  <input
                    type="text"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-32 px-2 py-1 bg-surface border border-brown-300 rounded text-brown-900 font-mono font-bold"
                  />
                </div>
              </div>

              {template.erpDataSource && (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-brown-200/60 px-3 py-1.5 rounded-[6px] hover:bg-brown-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={useLiveErpData}
                      disabled={loadingErp}
                      onChange={e => handleToggleLiveErp(e.target.checked)}
                      className="rounded text-brown-900 focus:ring-brown-600"
                    />
                    <Database className="w-3.5 h-3.5 text-brown-800" />
                    <span className="font-semibold text-brown-900">
                      {loadingErp ? 'Loading live ERP records...' : 'Auto-Sync Live ERP Transactions'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Table Customization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brown-800">
                  2. Spreadsheet Rows & Customization
                </h3>
                <p className="text-[11px] text-brown-500">
                  Edit cell values directly or add rows. Formulas will calculate in exports.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-brown-100 hover:bg-brown-200 text-brown-800 border border-brown-300 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Interactive Table Container */}
            <div className="border border-brown-300 rounded-[8px] overflow-hidden bg-surface shadow-2xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brown-900 text-cream font-semibold">
                      <th className="p-2 w-8 text-center">#</th>
                      {cols.map((col, i) => (
                        <th
                          key={i}
                          className={`p-2.5 whitespace-nowrap text-[11px] tracking-wide ${
                            col.type === 'currency' || col.type === 'number'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="p-2 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-brown-50/50">
                        <td className="p-2 text-center text-brown-400 font-mono text-[10px]">
                          {rIdx + 1}
                        </td>
                        {cols.map((col, cIdx) => {
                          const val = row[col.key] ?? '';
                          const isNum = col.type === 'currency' || col.type === 'number';
                          return (
                            <td key={cIdx} className="p-1 whitespace-nowrap">
                              <input
                                type={isNum ? 'text' : 'text'}
                                value={val}
                                onChange={e => handleCellChange(rIdx, col.key, e.target.value)}
                                className={`w-full px-2 py-1 rounded bg-transparent hover:bg-surface focus:bg-surface border border-transparent focus:border-brown-300 outline-none text-brown-900 text-xs ${
                                  isNum ? 'text-right font-mono font-medium' : 'text-left'
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-brown-400 hover:text-red-600 rounded"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formula Hint */}
            {template.formulaNotes && (
              <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/60 p-2 rounded border border-amber-200/60 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Formula Rules: {template.formulaNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-brown-200 bg-brown-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToMyTemplates}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-[6px] bg-brown-100 hover:bg-brown-200 text-brown-900 border border-brown-300 transition-all flex items-center gap-1.5 shadow-2xs active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5 text-brown-700" />
              <span>{saving ? 'Saving...' : 'Save to My Templates'}</span>
            </button>
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-brown-600 mr-1">
              Download Format:
            </span>

            <button
              type="button"
              onClick={() => handleDownload('xlsx')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-emerald-800 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Microsoft Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'xlsx' ? 'Exporting...' : 'Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-stone-700 hover:bg-stone-600 text-white transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Comma Separated Values (.csv)"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'csv' ? 'Exporting...' : 'CSV (.csv)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-brown-900 hover:bg-brown-800 text-cream transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Printable Document (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{downloadingFormat === 'pdf' ? 'Generating...' : 'PDF Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
