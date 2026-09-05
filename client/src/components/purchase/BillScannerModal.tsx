import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  ArrowRight,
  Building2,
  Calendar,
  Hash,
  ShoppingBag
} from 'lucide-react';
import { VendorBillsApi } from '../../api/vendorBills.api';
import { Money } from '../Money';

interface BillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    vendorId: number | null;
    billReference: string;
    billDate: string;
    dueDate: string;
    lines: Array<{
      product_id: number;
      account_id: number;
      analytic_account_id: number | null;
      qty: number;
      unit_price: string;
      tax_rate: string;
      subtotal: string;
      tax_amount: string;
      total: string;
    }>;
  }) => void;
}

const SAMPLE_BILLS = [
  {
    name: 'Timber Hub (Teak & Oak Planks)',
    text: `TAX INVOICE
Vendor: Timber Hub
GSTIN: 29AABCT1234F1Z5
Bill No: TH-2026-884
Date: 2026-03-01
Due Date: 2026-03-31

ITEMS:
5 x Teak Desk @ 5000.00
2 x Oak Wood Planks @ 3500.00

Subtotal: 32000.00
Tax (GST 18%): 5760.00
Grand Total: 37760.00`,
  },
  {
    name: 'Royal Oak Decor (Cairn Planter & Wardrobe)',
    text: `PURCHASE BILL
Supplier: Royal Oak Furnishings
Invoice Number: ROF-9021
Date: 2026-03-02
Due Date: 2026-04-01

Description                    Qty     Price       Total
Ashford Wardrobe                 1    39761.28    39761.28
Cairn Planter — Matte Black      4     2200.00     8800.00

Total Amount: 48561.28`,
  },
];

export const BillScannerModal: React.FC<BillScannerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleParse = async (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : rawText).trim();
    if (!text) {
      setError('Please paste receipt text or upload an invoice document.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await VendorBillsApi.parseReceipt(text);
      setParsedData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          setRawText(content);
          handleParse(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyToForm = () => {
    if (!parsedData) return;

    const lines = (parsedData.lines || []).map((l: any, idx: number) => ({
      product_id: l.productId,
      account_id: 6, // Purchase Expense
      analytic_account_id: null,
      qty: l.qty || 1,
      unit_price: l.unitPrice || '0.00',
      tax_rate: l.taxRate || '18.00',
      subtotal: l.subtotal || '0.00',
      tax_amount: l.taxAmount || '0.00',
      total: l.total || '0.00',
    }));

    onApply({
      vendorId: parsedData.vendor?.id || null,
      billReference: parsedData.billReference || '',
      billDate: parsedData.billDate || new Date().toISOString().split('T')[0],
      dueDate: parsedData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lines,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-body">
      <div className="bg-surface border border-brown-300 rounded-[14px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brown-200 flex items-center justify-between bg-cream/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-brown-900">
                Offline Bill & Receipt Scanner
              </h2>
              <p className="text-xs text-brown-600">
                100% browser-local regex extraction & database catalog matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-brown-400 hover:text-brown-700 hover:bg-brown-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Sample quick buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">
              Quick Samples:
            </span>
            {SAMPLE_BILLS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRawText(s.text);
                  handleParse(s.text);
                }}
                className="px-3 py-1 bg-cream hover:bg-brown-100 border border-brown-300 text-brown-800 text-xs rounded-full font-medium transition-colors cursor-pointer shadow-2xs"
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Upload Dropzone & Text Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropzone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[10px] p-5 flex flex-col items-center justify-center text-center transition-colors ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-brown-300 hover:border-brown-400 bg-cream/20'
              }`}
            >
              <Upload className="w-8 h-8 text-brown-400 mb-2" />
              <p className="text-xs font-semibold text-brown-800 mb-1">
                Drag and drop receipt text/file here
              </p>
              <p className="text-[11px] text-brown-500 mb-3">
                Supports .txt, .csv, and OCR output dumps
              </p>
              <label className="px-3 py-1.5 bg-surface border border-brown-300 text-brown-800 hover:bg-brown-100 text-xs font-semibold rounded-[6px] cursor-pointer shadow-xs transition-colors">
                Browse File
                <input
                  type="file"
                  accept=".txt,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Raw Text Box */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-brown-700 mb-1 flex items-center justify-between">
                <span>Or Paste Bill / Receipt Text:</span>
                <span className="text-[10px] text-brown-400 font-normal">
                  Invoice headers, tables & totals
                </span>
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste vendor receipt, invoice lines, or delivery note text here..."
                rows={5}
                className="w-full flex-1 p-3 text-xs font-mono bg-surface border border-brown-300 rounded-[8px] focus:outline-none focus:border-brown-600 focus:ring-1 focus:ring-brown-600"
              />
              <button
                type="button"
                disabled={loading || !rawText.trim()}
                onClick={() => handleParse()}
                className="mt-2 w-full py-2 bg-brown-900 hover:bg-brown-800 disabled:opacity-40 text-cream text-xs font-bold font-display uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? 'Scanning & Parsing...' : 'Scan & Extract Fields'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger-bg border border-danger/30 text-danger rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Data Card */}
          {parsedData && (
            <div className="border-2 border-emerald-500/30 rounded-[12px] bg-surface p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-brown-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold font-display text-brown-900 text-sm">
                    Extracted Vendor Bill Fields
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {parsedData.confidenceScore}% Match Confidence
                </span>
              </div>

              {/* Extracted Meta Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-cream/40 rounded-lg border border-brown-200">
                  <div className="flex items-center gap-1.5 text-brown-500 font-semibold mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Vendor</span>
                  </div>
                  <div className="font-bold text-brown-900 text-sm">
                    {parsedData.vendor?.matchedName || parsedData.vendor?.name || '—'}
                  </div>
                  {parsedData.vendor?.matchedName ? (
                    <span className="text-[10px] text-emerald-700 font-medium">
                      ✓ Matched in Database Contacts
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-medium">
                      ⚠️ New / Unmatched Vendor
                    </span>
                  )}
                </div>

                <div className="p-3 bg-cream/40 rounded-lg border border-brown-200">
                  <div className="flex items-center gap-1.5 text-brown-500 font-semibold mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Bill Reference</span>
                  </div>
                  <div className="font-bold text-brown-900 font-mono text-sm">
                    {parsedData.billReference || '—'}
                  </div>
                  <span className="text-[10px] text-brown-500">
                    Extracted from invoice header
                  </span>
                </div>

                <div className="p-3 bg-cream/40 rounded-lg border border-brown-200">
                  <div className="flex items-center gap-1.5 text-brown-500 font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dates</span>
                  </div>
                  <div className="font-medium text-brown-900">
                    Bill: <span className="font-mono">{parsedData.billDate}</span>
                  </div>
                  <div className="text-[11px] text-brown-600">
                    Due: <span className="font-mono">{parsedData.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-brown-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brown-100 text-brown-700 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Tax</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-200">
                    {parsedData.lines && parsedData.lines.length > 0 ? (
                      parsedData.lines.map((l: any, idx: number) => (
                        <tr key={idx} className="hover:bg-cream/30">
                          <td className="py-2.5 px-3 font-medium text-brown-900">
                            <div>{l.productName}</div>
                            {l.isMatched && (
                              <span className="text-[10px] text-emerald-700 font-sans">
                                ✓ Catalog Matched
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-brown-600">
                            {l.sku || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {l.qty}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ₹{l.unitPrice}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-brown-600">
                            {l.taxRate}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-brown-900">
                            ₹{l.total}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-brown-500 italic">
                          No distinct product line items parsed. Check receipt formatting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex items-center justify-between bg-cream/40 p-3 rounded-lg border border-brown-200 text-xs">
                <div className="space-x-4 text-brown-600">
                  <span>Subtotal: <strong className="text-brown-900 font-mono">₹{parsedData.totals?.subtotal}</strong></span>
                  <span>Tax: <strong className="text-brown-900 font-mono">₹{parsedData.totals?.taxAmount}</strong></span>
                </div>
                <div className="text-sm">
                  <span className="text-brown-600 mr-2">Grand Total:</span>
                  <span className="text-base font-bold font-display text-emerald-800">
                    ₹{parsedData.totals?.grandTotal}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brown-200 bg-cream/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface border border-brown-300 hover:bg-brown-100 text-brown-800 font-semibold text-xs rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parsedData || !parsedData.lines || parsedData.lines.length === 0}
            onClick={handleApplyToForm}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold font-display text-xs uppercase tracking-wider rounded-[8px] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply Extracted Data to Bill Form
          </button>
        </div>
      </div>
    </div>
  );
};
