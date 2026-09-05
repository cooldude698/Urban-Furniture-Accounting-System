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
  Scale,
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
  const cols = template?.structure?.columns || [];

  // Configuration State
  const [templateName, setTemplateName] = useState<string>(
    savedItem?.name || template?.name || ''
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
    savedItem?.configuration?.openingBalance || template?.previewData?.openingBalance || '0.00'
  );
  const [notes, setNotes] = useState<string>(
    savedItem?.configuration?.notes || ''
  );
  const [useLiveErpData, setUseLiveErpData] = useState<boolean>(
    savedItem?.configuration?.useLiveErpData || false
  );

  // Table Data State
  const [rows, setRows] = useState<Array<Record<string, any>>>(
    savedItem?.customData?.rows || template?.previewData?.rows || []
  );

  const [loadingErp, setLoadingErp] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lock background scroll when modal is open, and reliably unlock when closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

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

  const handleAddRow = (type: 'item' | 'header' | 'total' = 'item') => {
    const newRow: Record<string, any> = {};
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (i === 0) {
        newRow[c.key] = type === 'header' ? 'NEW SECTION' : type === 'total' ? 'TOTAL NEW SECTION' : 'New Line Item';
      } else {
        newRow[c.key] = type === 'header' ? '' : '0.00';
      }
    }
    if (type === 'header') newRow.classification = 'Header';
    if (type === 'total') newRow.classification = 'Total';
    setRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Balance Sheet Equation Check
  const isBalanceSheet = template.slug.includes('balance-sheet') || /Assets\s*=\s*Liabilities/i.test(template.formulaNotes || '');

  const balanceStats = React.useMemo(() => {
    if (!isBalanceSheet) return null;
    const numCol = cols.find(c => c.type === 'currency' || c.type === 'number');
    if (!numCol) return null;

    let totalAssets = 0;
    let totalLiabilitiesAndEquity = 0;

    for (const r of rows) {
      const item = String(r[cols[0]?.key] || r.item || '').trim();
      const val = parseFloat(String(r[numCol.key] || '0')) || 0;

      if (/TOTAL\s+ASSETS/i.test(item)) {
        totalAssets = val;
      } else if (/TOTAL\s+LIABILITIES\s+&/i.test(item) || /TOTAL\s+LIABILITIES\s+AND\s+STOCKHOLDERS/i.test(item)) {
        totalLiabilitiesAndEquity = val;
      }
    }

    const diff = Math.abs(totalAssets - totalLiabilitiesAndEquity);
    const isBalanced = totalAssets > 0 && diff < 0.01;

    return {
      totalAssets,
      totalLiabilitiesAndEquity,
      diff,
      isBalanced,
      colKey: numCol.key,
      colLabel: numCol.label,
    };
  }, [isBalanceSheet, cols, rows]);

  const handleAutoCheckBalance = () => {
    if (!balanceStats) return;
    setRows(prev =>
      prev.map(r => {
        const item = String(r[cols[0]?.key] || r.item || '').trim();
        if (/Check/i.test(item)) {
          return {
            ...r,
            [balanceStats.colKey]: balanceStats.diff.toFixed(2),
          };
        }
        return r;
      })
    );
    setStatusMsg({
      type: balanceStats.isBalanced ? 'success' : 'error',
      text: balanceStats.isBalanced
        ? `Balance Sheet is balanced! Assets (${currency}${balanceStats.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) = Liabilities & Equity (${currency}${balanceStats.totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`
        : `Balance difference: ${currency}${balanceStats.diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Total Assets: ${currency}${balanceStats.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })} vs Liabilities & Equity: ${currency}${balanceStats.totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`,
    });
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

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div
        className="bg-white border border-black rounded-[12px] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header - Crisp Black and White - Fixed at top */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-black text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-black">
                  Customize Template: {template.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-black border border-gray-300">
                  {template.profession}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Tailor business details, link ERP transactions, and export as spreadsheet or PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form & Table - flex-1 min-h-0 */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6 bg-white">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-[8px] border text-xs font-medium flex items-center gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-gray-50 text-black border-black'
                  : 'bg-gray-50 text-black border-black'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-black shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Business Configuration Grid - Black and White */}
          <div className="p-4 bg-gray-50/70 rounded-[10px] border border-gray-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              1. Business Header & Formatting Setup
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-black font-semibold mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-[6px] text-black font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-black font-semibold mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-[6px] text-black font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-black font-semibold mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={e => setFinancialYear(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-[6px] text-black font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-black font-semibold mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-[6px] text-black font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
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
            <div className="mt-3.5 pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-black font-semibold inline-block mr-2">
                    Opening / Initial Balance:
                  </label>
                  <input
                    type="text"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-32 px-2 py-1 bg-white border border-gray-300 rounded text-black font-mono font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {template.erpDataSource && (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-[6px] border border-gray-300 hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={useLiveErpData}
                      disabled={loadingErp}
                      onChange={e => handleToggleLiveErp(e.target.checked)}
                      className="rounded text-black focus:ring-black accent-black"
                    />
                    <Database className="w-3.5 h-3.5 text-black" />
                    <span className="font-semibold text-black">
                      {loadingErp ? 'Loading live ERP records...' : 'Auto-Sync Live ERP Transactions'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Table Customization */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  2. Spreadsheet Rows & Customization
                </h3>
                <p className="text-[11px] text-gray-500">
                  Edit cell values directly, add custom sections, or update totals.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddRow('item')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-white hover:bg-gray-100 text-black border border-black transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow('header')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-white hover:bg-gray-100 text-black border border-black transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>Section Header</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow('total')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-white hover:bg-gray-100 text-black border border-black transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>Total Row</span>
                </button>
                {isBalanceSheet && balanceStats && (
                  <button
                    type="button"
                    onClick={handleAutoCheckBalance}
                    className="px-3 py-1 text-xs font-bold rounded-[6px] bg-black text-white hover:bg-gray-800 border border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Scale className="w-3.5 h-3.5 text-white" />
                    <span>Check Balance</span>
                  </button>
                )}
              </div>
            </div>

            {/* Balance Sheet Equation Bar - Black and White */}
            {isBalanceSheet && balanceStats && (
              <div className="mb-3 p-2.5 bg-white border border-black rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                    Accounting Equation:
                  </span>
                  <span className="font-mono text-black font-medium">
                    Assets ({currency}{balanceStats.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) = Liabilities & Equity ({currency}{balanceStats.totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      balanceStats.isBalanced
                        ? 'bg-black text-white border border-black'
                        : 'bg-gray-100 text-black border border-black'
                    }`}
                  >
                    {balanceStats.isBalanced ? '✓ Equation Balanced (Diff: ₹0.00)' : `Check Diff: ${currency}${balanceStats.diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Table Container - Pure White background, Black font & borders */}
            <div className="border border-black rounded-[8px] overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left border-collapse text-xs bg-white">
                  <thead>
                    <tr className="bg-white text-black font-bold border-y-2 border-black">
                      <th className="p-2 w-8 text-center text-black font-bold">#</th>
                      {cols.map((col, i) => (
                        <th
                          key={i}
                          className={`p-2.5 whitespace-nowrap text-[11px] uppercase tracking-wide text-black font-bold ${
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
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((row, rIdx) => {
                      const firstVal = String(row[cols[0]?.key] || row.item || row.component || '');
                      const isHeader = row.classification === 'Header' || /^[A-Z\s&’',()-]{3,}:?$/.test(firstVal.trim()) || firstVal.trim().endsWith(':');
                      const isSubtotal = row.classification === 'Subtotal' || /^TOTAL\s/i.test(firstVal.trim()) || /^Total\s/i.test(firstVal.trim());
                      const isGrandTotal = row.classification === 'Total' || /TOTAL\s+ASSETS/i.test(firstVal) || /TOTAL\s+LIABILITIES/i.test(firstVal);
                      const isCheck = row.classification === 'Check' || /Check/i.test(firstVal);

                      const borderTopClass = (isGrandTotal || isSubtotal) ? 'border-t border-black' : '';
                      const borderBottomClass = isGrandTotal 
                        ? 'border-b-[3px] border-b-black' 
                        : isSubtotal || isHeader
                          ? 'border-b border-black' 
                          : 'border-b border-gray-100';

                      const rowBgClass = isHeader 
                        ? 'bg-gray-100' 
                        : 'bg-white hover:bg-gray-50';

                      return (
                        <tr key={rIdx} className={`${rowBgClass} ${borderTopClass} ${borderBottomClass}`}>
                          <td className="p-2 text-center text-gray-500 font-mono text-[10px]">
                            {rIdx + 1}
                          </td>
                          {cols.map((col, cIdx) => {
                            const val = row[col.key] ?? '';
                            const isNum = col.type === 'currency' || col.type === 'number';
                            const isFirstCol = cIdx === 0;
                            const textStyle = isHeader
                              ? 'font-bold uppercase tracking-wider text-black'
                              : isGrandTotal
                                ? 'font-bold text-black'
                                : isSubtotal
                                  ? 'font-semibold text-black'
                                  : isCheck
                                    ? 'italic text-black font-medium'
                                    : 'font-normal text-black';

                            return (
                              <td key={cIdx} className="p-1 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={e => handleCellChange(rIdx, col.key, e.target.value)}
                                  placeholder={isHeader && isFirstCol ? 'SECTION HEADER' : ''}
                                  className={`w-full px-2 py-1 rounded bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-300 focus:border-black outline-none text-xs transition-colors ${
                                    isNum ? 'text-right font-mono tabular-nums font-medium' : 'text-left'
                                  } ${textStyle}`}
                                />
                              </td>
                            );
                          })}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rIdx)}
                              className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                              title="Remove Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formula Hint - Clean Black and White */}
            {template.formulaNotes && (
              <div className="mt-2 text-[11px] text-black bg-white p-2.5 rounded-[6px] border border-gray-300 flex items-center gap-2 shadow-2xs">
                <Calculator className="w-3.5 h-3.5 text-black shrink-0" />
                <span><strong>Accounting Logic:</strong> {template.formulaNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer - Crisp Black and White - Fixed at bottom */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToMyTemplates}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-[6px] bg-black text-white hover:bg-gray-800 border border-black transition-all flex items-center gap-1.5 shadow-2xs active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>{saving ? 'Saving...' : 'Save to My Templates'}</span>
            </button>
          </div>

          {/* Export Options - All Clean Black and White */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-700 mr-1">
              Download Format:
            </span>

            <button
              type="button"
              onClick={() => handleDownload('xlsx')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-white hover:bg-gray-100 text-black border border-black transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Microsoft Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
              <span>{downloadingFormat === 'xlsx' ? 'Exporting...' : 'Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-white hover:bg-gray-100 text-black border border-gray-300 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Comma Separated Values (.csv)"
            >
              <FileCode className="w-3.5 h-3.5 text-black" />
              <span>{downloadingFormat === 'csv' ? 'Exporting...' : 'CSV (.csv)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={!!downloadingFormat}
              className="px-3 py-1.5 text-xs font-bold rounded-[6px] bg-black hover:bg-gray-800 text-white border border-black transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download Printable Document (.pdf)"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>{downloadingFormat === 'pdf' ? 'Generating...' : 'PDF Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
