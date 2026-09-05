import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hash,
  ShoppingBag,
  Send,
  RotateCcw,
  Globe
} from 'lucide-react';
import { VendorBillsApi } from '../../api/vendorBills.api';

interface VoiceBillModalProps {
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

export const VoiceBillModal: React.FC<VoiceBillModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
  }, []);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please type in the box below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleParseVoice = async (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : transcript).trim();
    if (!text) {
      setError('Please speak or type a bill dictation phrase.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await VendorBillsApi.parseVoice(text);
      setParsedData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse voice dictation.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (!parsedData) return;

    const lines = (parsedData.lines || []).map((l: any) => ({
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

  const sampleVoicePhrases = [
    'Bill from Timber Hub, 5 Teak Desk at 5000 each, bill ref TH-881',
    'Vendor Royal Oak, 2 Ashford Wardrobe at 39000, reference ROF-902',
    'वेंडर टिम्बर हब पांच टीक डेस्क कीमत 5000 बिल नंबर TH-101',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-body">
      <div className="bg-surface border border-brown-300 rounded-[14px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brown-200 flex items-center justify-between bg-cream/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-brown-900">
                Offline Voice-to-Bill Dictation
              </h2>
              <p className="text-xs text-brown-600">
                100% browser-native speech recognition with offline grammar parsing
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Controls: Language Selector & Mic */}
          <div className="flex items-center justify-between bg-cream/40 p-4 rounded-xl border border-brown-200">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brown-500" />
              <span className="text-xs font-semibold text-brown-700">Language:</span>
              <div className="flex items-center bg-surface border border-brown-300 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSpeechLang('en-IN')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    speechLang === 'en-IN'
                      ? 'bg-brown-900 text-cream font-semibold'
                      : 'text-brown-700 hover:text-brown-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechLang('hi-IN')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    speechLang === 'hi-IN'
                      ? 'bg-brown-900 text-cream font-semibold'
                      : 'text-brown-700 hover:text-brown-900'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                  : 'bg-brown-900 hover:bg-brown-800 text-cream'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Listening... Click to Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Dictation
                </>
              )}
            </button>
          </div>

          {/* Transcript Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brown-700 flex items-center justify-between">
              <span>Voice Transcript / Dictation Text:</span>
              <span className="text-[10px] text-brown-400">
                You can also type or edit directly
              </span>
            </label>
            <div className="flex gap-2">
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={3}
                placeholder={
                  isListening
                    ? 'Listening... Speak vendor name, product, quantity and price...'
                    : 'Speak or type e.g. "Bill from Timber Hub, 5 Teak Desk at 5000 each, bill ref TH-881"'
                }
                className="flex-1 p-3 text-sm bg-surface border border-brown-300 rounded-[10px] focus:outline-none focus:border-brown-600 focus:ring-1 focus:ring-brown-600 font-body"
              />
              <button
                type="button"
                disabled={loading || !transcript.trim()}
                onClick={() => handleParseVoice()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold font-display text-xs uppercase tracking-wider rounded-[10px] transition-colors cursor-pointer shadow-xs flex flex-col items-center justify-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span>Parse</span>
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-semibold text-brown-500 uppercase tracking-wider">
              Try sample phrase:
            </span>
            {sampleVoicePhrases.map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTranscript(phrase);
                  handleParseVoice(phrase);
                }}
                className="px-2.5 py-1 bg-cream hover:bg-brown-100 border border-brown-300 text-brown-800 text-[11px] rounded-full transition-colors cursor-pointer shadow-2xs"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger-bg border border-danger/30 text-danger rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedData && (
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-[12px] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-brown-900 text-xs">
                    Parsed Bill Preview
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {parsedData.confidenceScore}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-brown-500 block text-[10px] font-semibold uppercase">
                    Vendor
                  </span>
                  <span className="font-bold text-brown-900">
                    {parsedData.vendor?.matchedName || parsedData.vendor?.name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-brown-500 block text-[10px] font-semibold uppercase">
                    Bill Ref
                  </span>
                  <span className="font-mono font-bold text-brown-900">
                    {parsedData.billReference || '—'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 pt-1">
                <span className="text-brown-500 block text-[10px] font-semibold uppercase">
                  Line Items ({parsedData.lines?.length || 0})
                </span>
                <div className="bg-surface rounded-lg border border-brown-200 divide-y divide-brown-200 text-xs">
                  {(parsedData.lines || []).map((l: any, idx: number) => (
                    <div key={idx} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-brown-900">{l.productName}</span>
                        <span className="text-brown-500 ml-2">Qty: {l.qty}</span>
                      </div>
                      <div className="font-mono font-bold text-brown-900">
                        ₹{l.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-brown-600">Total Computed:</span>
                <span className="text-sm font-bold text-emerald-800">
                  ₹{parsedData.totals?.grandTotal}
                </span>
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
            Apply to Bill Form
          </button>
        </div>
      </div>
    </div>
  );
};
