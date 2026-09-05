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
      <div className="bg-surface border border-brown-300 rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brown-200 bg-brown-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-brown-900 text-cream flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-brown-900 leading-tight">
                  {template.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brown-200 text-brown-800">
                  {template.categoryName}
                </span>
              </div>
              <p className="text-xs text-brown-600 mt-0.5">
                Designed for: <strong className="text-brown-800">{template.profession}</strong>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Description & Source Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-[10px] bg-cream/50 border border-brown-200">
            <div className="md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brown-600 block mb-1">
                Template Purpose
              </span>
              <p className="text-xs text-brown-800 leading-relaxed font-sans">
                {template.description}
              </p>
            </div>
            <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-brown-200 pt-2 md:pt-0 md:pl-4 text-xs">
              <div>
                <span className="text-brown-500 text-[10px] block">Compatibility:</span>
                <span className="font-semibold text-brown-900 font-mono text-[11px]">
                  {template.fileType}
                </span>
              </div>
              <div>
                <span className="text-brown-500 text-[10px] block">Source:</span>
                <span className="text-brown-800 text-[11px] font-medium">
                  {template.sourceType}
                </span>
              </div>
            </div>
          </div>

          {/* Formula / Calculation Notes */}
          {template.formulaNotes && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-[8px] flex items-start gap-2.5 text-xs text-amber-900">
              <Calculator className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950 block mb-0.5">
                  Automatic Calculations & Formulas
                </strong>
                <span className="font-mono text-[11px] text-amber-900">
                  {template.formulaNotes}
                </span>
              </div>
            </div>
          )}

          {/* Included Fields */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brown-700 block mb-2">
              Included Columns & Schema Fields ({cols.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cols.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium bg-surface border border-brown-200 text-brown-800 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brown-600"></span>
                  {col.label}
                  {col.type === 'formula' && (
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-100/70 px-1 rounded">
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
              <span className="text-xs font-bold uppercase tracking-wider text-brown-700">
                Live Template Preview
              </span>
              <span className="text-[11px] text-brown-500 italic">
                Showing sample structure with automatic formatting
              </span>
            </div>

            <div className="border border-brown-300 rounded-[8px] overflow-hidden bg-surface shadow-2xs">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brown-900 text-cream font-semibold">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {previewRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-surface' : 'bg-brown-50/40 hover:bg-brown-100/50'}
                      >
                        {cols.map((col, cIdx) => {
                          const val = row[col.key];
                          const isNumeric = col.type === 'currency' || col.type === 'number';
                          return (
                            <td
                              key={cIdx}
                              className={`p-2.5 whitespace-nowrap text-brown-800 ${
                                isNumeric
                                  ? 'text-right font-mono font-medium'
                                  : 'text-left font-sans'
                              }`}
                            >
                              {col.type === 'currency' && val !== undefined && val !== null && !String(val).startsWith('₹')
                                ? `₹${parseFloat(String(val) || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : String(val ?? '—')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* License Note */}
          <div className="text-[10.5px] text-brown-500 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{template.licenseNote}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-brown-200 bg-brown-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-brown-700 hover:text-brown-900 rounded-[6px] hover:bg-brown-200/50 transition-colors"
          >
            Close Preview
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUseTemplate(template);
            }}
            className="px-5 py-2 text-xs font-bold rounded-[6px] bg-brown-900 text-cream hover:bg-brown-800 shadow-sm transition-all flex items-center gap-2 active:scale-[0.99]"
          >
            <span>Use & Customize Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
