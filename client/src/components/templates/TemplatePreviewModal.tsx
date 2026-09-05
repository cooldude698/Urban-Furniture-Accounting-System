import React from 'react';
import { X, FileText, CheckCircle2, Calculator, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { BusinessTemplateDetail } from '../../types/template';

interface TemplatePreviewModalProps {
  template: BusinessTemplateDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: BusinessTemplateDetail) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  if (!isOpen || !template) return null;

  const cols = template.structure?.columns || [];
  const previewRows = template.previewData?.rows || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-black rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header - Crisp Black and White */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-black text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-black leading-tight">
                  {template.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-black border border-gray-300">
                  {template.categoryName}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Designed for: <strong className="text-black">{template.profession}</strong>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white">
          {/* Description & Source Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[10px] bg-gray-50 border border-gray-300">
            <div className="md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Template Purpose
              </span>
              <p className="text-xs text-black leading-relaxed font-sans">
                {template.description}
              </p>
            </div>
            <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-gray-300 pt-2 md:pt-0 md:pl-4 text-xs">
              <div>
                <span className="text-gray-500 text-[10px] block">Compatibility:</span>
                <span className="font-semibold text-black font-mono text-[11px]">
                  {template.fileType}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Source:</span>
                <span className="text-black text-[11px] font-medium">
                  {template.sourceType}
                </span>
              </div>
            </div>
          </div>

          {/* Formula / Calculation Notes */}
          {template.formulaNotes && (
            <div className="p-3.5 bg-white border border-gray-300 rounded-[8px] flex items-start gap-2.5 text-xs text-black shadow-2xs">
              <Calculator className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-black block mb-0.5">
                  Automatic Calculations & Formulas
                </strong>
                <span className="font-mono text-[11px] text-black">
                  {template.formulaNotes}
                </span>
              </div>
            </div>
          )}

          {/* Included Fields */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
              Included Columns & Schema Fields ({cols.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cols.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium bg-white border border-gray-300 text-black flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  {col.label}
                  {col.type === 'formula' && (
                    <span className="text-[9px] font-mono text-black bg-gray-100 px-1 rounded border border-gray-300">
                      fx
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Data Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-black">
                Live Template Preview
              </span>
              <span className="text-[11px] text-gray-500 italic">
                Showing sample structure with automatic formatting
              </span>
            </div>

            <div className="border border-black rounded-[8px] overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs bg-white">
                  <thead>
                    <tr className="bg-white text-black font-bold border-y-2 border-black">
                      {cols.map((col, i) => (
                        <th
                          key={i}
                          className={`p-2.5 whitespace-nowrap text-[11px] uppercase tracking-wide text-black ${
                            col.type === 'currency' || col.type === 'number'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewRows.map((row, rIdx) => {
                      const firstVal = String(row[cols[0]?.key] || row.item || row.component || '');
                      const isHeader = row.classification === 'Header' || /^[A-Z\s&’',()-]{3,}:?$/.test(firstVal.trim()) || firstVal.trim().endsWith(':');
                      const isSubtotal = row.classification === 'Subtotal' || /^TOTAL\s/i.test(firstVal.trim()) || /^Total\s/i.test(firstVal.trim());
                      const isGrandTotal = row.classification === 'Total' || /TOTAL\s+ASSETS/i.test(firstVal) || /TOTAL\s+LIABILITIES/i.test(firstVal);
                      const isCheck = row.classification === 'Check' || /Check/i.test(firstVal);

                      if (isHeader) {
                        return (
                          <tr key={rIdx} className="bg-gray-100 border-y border-black font-bold">
                            <td
                              colSpan={cols.length}
                              className="p-2.5 text-black font-bold uppercase tracking-wider text-xs"
                            >
                              {firstVal}
                            </td>
                          </tr>
                        );
                      }

                      const borderTopClass = (isGrandTotal || isSubtotal) ? 'border-t border-black' : '';
                      const borderBottomClass = isGrandTotal 
                        ? 'border-b-[3px] border-b-black' 
                        : isSubtotal 
                          ? 'border-b border-black' 
                          : 'border-b border-gray-100';

                      const rowBgClass = isGrandTotal || isSubtotal 
                        ? 'bg-white font-bold' 
                        : isCheck
                          ? 'bg-white italic text-black'
                          : 'bg-white hover:bg-gray-50';

                      return (
                        <tr key={rIdx} className={`${rowBgClass} ${borderTopClass} ${borderBottomClass}`}>
                          {cols.map((col, cIdx) => {
                            const val = row[col.key];
                            const isNum = col.type === 'currency' || col.type === 'number';
                            const isFirstCol = cIdx === 0;
                            const textStyle = isGrandTotal
                              ? 'font-bold text-black'
                              : isSubtotal
                                ? 'font-semibold text-black'
                                : isCheck
                                  ? 'italic text-black'
                                  : 'text-black';

                            return (
                              <td
                                key={cIdx}
                                className={`p-2 whitespace-nowrap ${
                                  isNum ? 'text-right font-mono tabular-nums font-medium' : 'text-left'
                                } ${textStyle} ${isFirstCol && !isGrandTotal && !isSubtotal ? 'pl-4' : ''}`}
                              >
                                {isNum && typeof val === 'string' && val.trim() !== ''
                                  ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                                  : String(val ?? '—')}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* License Note */}
          <div className="text-[10.5px] text-gray-500 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>{template.licenseNote}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-black hover:bg-gray-200 rounded-[6px] border border-gray-300 transition-colors"
          >
            Close Preview
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUseTemplate(template);
            }}
            className="px-5 py-2 text-xs font-bold rounded-[6px] bg-black text-white hover:bg-gray-800 border border-black shadow-sm transition-all flex items-center gap-2 active:scale-[0.99]"
          >
            <span>Use & Customize Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
