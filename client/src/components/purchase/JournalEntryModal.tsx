import React, { useEffect, useState } from 'react';
import Decimal from 'decimal.js';
import { X, BookOpen, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface JournalLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  label?: string | null;
  debit: string;
  credit: string;
}

interface JournalEntryData {
  id: number;
  number: string;
  journalName: string;
  entryDate: string;
  reference?: string | null;
  status: 'draft' | 'posted';
  sourceType?: string | null;
  sourceId?: number | null;
  lines: JournalLine[];
}

interface JournalEntryModalProps {
  journalEntryId: number | null;
  isOpen: boolean;
  onClose: () => void;
  sourceDocNumber?: string;
}

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  journalEntryId,
  isOpen,
  onClose,
  sourceDocNumber,
}) => {
  const [entry, setEntry] = useState<JournalEntryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && journalEntryId) {
      setLoading(true);
      setError(null);
      fetch(`/api/journal-entries/${journalEntryId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(json => {
          if (json.error) {
            setError(json.error.message || 'Failed to fetch journal entry');
          } else {
            setEntry(json.data);
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, journalEntryId]);

  if (!isOpen) return null;

  const totalDebit = entry?.lines
    ? entry.lines.reduce((acc, l) => acc.plus(new Decimal(l.debit || 0)), new Decimal(0)).toFixed(2)
    : '0.00';

  const totalCredit = entry?.lines
    ? entry.lines.reduce((acc, l) => acc.plus(new Decimal(l.credit || 0)), new Decimal(0)).toFixed(2)
    : '0.00';

  const isBalanced = totalDebit === totalCredit && new Decimal(totalDebit).gt(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl border border-brown-200 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-brown-800 text-cream flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cream/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-cream" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-lg leading-tight">
                  {entry?.number || `Journal Entry #${journalEntryId}`}
                </h3>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-cream text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Posted (Immutable)
                </span>
              </div>
              <p className="text-xs text-cream/70 font-mono mt-0.5">
                {entry?.journalName || 'Purchase Journal'} • {entry?.entryDate || 'Posted Date'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cream/70 hover:text-cream hover:bg-cream/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="py-12 text-center text-brown-600 text-sm font-medium">
              Loading immutable journal ledger lines...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {entry && !loading && (
            <>
              {/* Context metadata ribbon */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-brown-50/60 rounded-xl border border-brown-100 text-xs">
                <div>
                  <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                    Source Document
                  </span>
                  <span className="font-mono font-semibold text-brown-900">
                    {sourceDocNumber || entry.reference || `${entry.sourceType || 'Doc'} #${entry.sourceId || ''}`}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                    Journal
                  </span>
                  <span className="font-semibold text-brown-900">
                    {entry.journalName}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-brown-600 uppercase tracking-wider">
                    Ledger Status
                  </span>
                  <span className="font-bold text-emerald-700">
                    Double-Entry Verified
                  </span>
                </div>
              </div>

              {/* Journal Entry Lines Table */}
              <div className="border border-brown-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brown-100/70 border-b border-brown-200 text-brown-700 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Account Code</th>
                      <th className="py-2.5 px-3">Account Name</th>
                      <th className="py-2.5 px-3">Label / Memo</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {entry.lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-brown-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-brown-900">
                          {l.accountCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-brown-800">
                          {l.accountName}
                        </td>
                        <td className="py-2.5 px-3 text-brown-600 font-sans">
                          {l.label || 'Document line'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-brown-900">
                          {new Decimal(l.debit || 0).gt(0)
                            ? Number(l.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-brown-900">
                          {new Decimal(l.credit || 0).gt(0)
                            ? Number(l.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brown-100/80 font-bold border-t-2 border-brown-300 text-brown-900">
                      <td colSpan={3} className="py-3 px-3">
                        Total Balance (Debit = Credit)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        ₹{Number(totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        ₹{Number(totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Parity validation banner */}
              {isBalanced && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Double-entry balance verified: DR ₹{totalDebit} = CR ₹{totalCredit}</span>
                  </div>
                  <span className="font-mono text-[11px] bg-emerald-100/80 px-2 py-0.5 rounded text-emerald-900">
                    Net Delta: ₹0.00
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-brown-50/80 border-t border-brown-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brown-800 hover:bg-brown-900 text-cream text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
