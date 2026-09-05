import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  ArrowRight,
  Globe,
  Edit3
} from 'lucide-react';

interface DraftLineItem {
  id: string;
  productId?: number;
  productName: string;
  matchedName?: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: string;
  isPriceAssumed?: boolean;
  isQtyAssumed?: boolean;
  qtySource?: 'model' | 'deterministic';
  priceSource?: 'model' | 'deterministic';
}

interface VoiceBillSession {
  sessionId: string;
  customerName?: string;
  phone?: string;
  customerId?: number;
  lineItems: DraftLineItem[];
  language: 'hi' | 'en';
  status: 'collecting' | 'ready_for_confirm' | 'confirmed';
  notes: string[];
  lastUpdateNote?: string;
  ambiguousCandidates?: { id: number; name: string; salesPrice: string }[];
  invoiceId?: number;
  invoiceNumber?: string;
  pdfUrl?: string;
  grandTotal: string;
  updatedAt: string;
  isNameInferred?: boolean;
  isPriceAssumed?: boolean;
  isQtyAssumed?: boolean;
  confidenceNotes?: { en: string[]; hi: string[] };
  slotSources?: {
    customerName?: 'model' | 'deterministic';
    phone?: 'model' | 'deterministic';
    productName?: 'model' | 'deterministic';
    qty?: 'model' | 'deterministic';
    unitPrice?: 'model' | 'deterministic';
    discountPercent?: 'model' | 'deterministic';
  };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  options?: string[];
  sessionSnapshot?: VoiceBillSession;
}

export const VoiceBillPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>(() => `voice_${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [session, setSession] = useState<VoiceBillSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Voice recording state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }

    // Initial greeting
    const initialGreeting: ChatMessage = {
      id: 'msg_0',
      sender: 'assistant',
      text:
        'Namaste! Welcome to Urban Furniture e-Bill Assistant. You can speak or type in Hindi or English to generate an invoice.\n\nनमस्ते! अर्बन फ़र्निचर ई-बिल सहायक में आपका स्वागत है। बिल बनाने के लिए आप हिंदी या अंग्रेज़ी में बोल या लिख सकते हैं।',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialGreeting]);
  }, []);

  // Handle Speech Recognition toggle
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
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or type in the chatbox.');
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
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInputText(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (interimTranscript) {
          setInputText(interimTranscript);
        }
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

  // Send message to backend
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || loading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/voice-bill/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId }),
      });

      const json = await res.json();
      if (json.data) {
        const replyMsg: ChatMessage = {
          id: `reply_${Date.now()}`,
          sender: 'assistant',
          text: json.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: json.data.options,
          sessionSnapshot: json.data.session,
        };
        setMessages(prev => [...prev, replyMsg]);
        setSession(json.data.session);
      } else if (json.error) {
        setError(json.error.message || 'Failed to process message');
      }
    } catch (err: any) {
      setError(err.message || 'Network error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  // Confirm bill and generate invoice
  const handleConfirmBill = async () => {
    if (!session || session.status === 'confirmed' || confirming) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await fetch('/api/voice-bill/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const json = await res.json();
      if (json.data) {
        const successMsg: ChatMessage = {
          id: `confirmed_${Date.now()}`,
          sender: 'assistant',
          text:
            session.language === 'hi'
              ? `🎉 बधाई हो! बिल सफलतापूर्वक बन गया है। इनवॉइस नंबर: ${json.data.invoiceNumber}\nकुल राशि: ₹${json.data.total}`
              : `🎉 Congratulations! Customer Invoice ${json.data.invoiceNumber} has been confirmed and posted to the ledger.\nTotal Amount: ₹${json.data.total}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, successMsg]);
        setSession(prev => (prev ? { ...prev, status: 'confirmed', invoiceId: json.data.invoiceId, invoiceNumber: json.data.invoiceNumber, pdfUrl: json.data.pdfUrl } : null));
      } else if (json.error) {
        setError(json.error.message || 'Failed to confirm bill');
      }
    } catch (err: any) {
      setError(err.message || 'Network error confirming bill');
    } finally {
      setConfirming(false);
    }
  };

  // Reset session
  const handleResetSession = () => {
    const newId = `voice_${Date.now()}`;
    setSessionId(newId);
    setSession(null);
    setError(null);
    const greeting: ChatMessage = {
      id: `reset_${Date.now()}`,
      sender: 'assistant',
      text:
        speechLang === 'hi-IN'
          ? 'नया बिल शुरू किया गया है। ग्राहक का नाम, फ़ोन या उत्पाद बताएं।'
          : 'New bill started! Please tell me the customer name, phone, or product to add.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
    if (inputRef.current) inputRef.current.focus();
  };

  const sampleChips = [
    '2 Teak Desk price 5000 for Rahul, phone 9876543210',
    'ग्राहक राहुल शर्मा फ़ोन 9812345678 दो टीक डेस्क कीमत 5000',
    'Oak Wood Planks qty 5 at 3500, customer Aman phone 9811223344',
    'change quantity to 3',
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4 font-body">
      {/* Top Banner & Controls */}
      <div className="bg-surface border border-brown-300 rounded-[12px] p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-brown-900">
              e-Bill Assistant (Voice & Chat)
            </h1>
          </div>
          <p className="text-xs text-brown-600 mt-1">
            Bilingual (Hindi + English) conversational invoicing with offline double-entry ledger posting
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Voice Language Selector */}
          <div className="flex items-center bg-cream border border-brown-300 rounded-[8px] p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-brown-600 mx-1.5" />
            <button
              type="button"
              onClick={() => setSpeechLang('hi-IN')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                speechLang === 'hi-IN'
                  ? 'bg-brown-900 text-cream font-semibold shadow-xs'
                  : 'text-brown-700 hover:text-brown-900'
              }`}
            >
              हिन्दी (HI)
            </button>
            <button
              type="button"
              onClick={() => setSpeechLang('en-IN')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors ${
                speechLang === 'en-IN'
                  ? 'bg-brown-900 text-cream font-semibold shadow-xs'
                  : 'text-brown-700 hover:text-brown-900'
              }`}
            >
              English (EN)
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            className="px-3 py-1.5 bg-surface text-brown-800 border border-brown-300 rounded-[8px] hover:bg-brown-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brown-600" />
            New Bill (रीसेट)
          </button>
        </div>
      </div>

      {/* Main Chatbox Area (WhatsApp Style) */}
      <div className="bg-surface border border-brown-300 rounded-[14px] shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-cream/30">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-[14px] p-3.5 shadow-xs text-sm ${
                    isUser
                      ? 'bg-brown-900 text-cream rounded-br-xs'
                      : 'bg-surface text-brown-900 border border-brown-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Candidate Options (if Ambiguous Product) */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-brown-200/60 flex flex-wrap gap-1.5">
                      <span className="text-[11px] font-semibold text-brown-500 w-full block">
                        Select an option:
                      </span>
                      {msg.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleSendMessage(opt)}
                          className="px-2.5 py-1 bg-cream hover:bg-brown-100 border border-brown-300 text-brown-800 text-xs font-medium rounded-full transition-colors cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      isUser ? 'text-brown-300' : 'text-brown-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-brown-200 text-brown-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-brown-500 italic p-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Assistant is thinking / समझ रहा है...
            </div>
          )}

          {/* Confirmation Summary Card (when ready_for_confirm) */}
          {session && session.status === 'ready_for_confirm' && (
            <div className="p-5 bg-surface border-2 border-emerald-600/40 rounded-[12px] shadow-md my-4 space-y-4">
              <div className="flex items-center justify-between border-b border-brown-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold font-display text-brown-900 text-base">
                    Draft Bill Confirmation / बिल सारांश
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  Ready to Post
                </span>
              </div>

              {/* Confidence Notice Banner (if any slot was inferred without anchors) */}
              {(session.isNameInferred || session.isPriceAssumed || session.isQtyAssumed) && (
                <div className="flex items-start sm:items-center gap-2.5 p-3 bg-amber-50/90 border border-amber-300 rounded-[8px] text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1">
                    <span className="font-semibold">
                      {session.language === 'hi' ? 'सूचना: ' : 'Note: '}
                    </span>
                    {session.language === 'hi'
                      ? 'कुछ विवरण बिना कीवर्ड के सीधे क्रम से पहचाने गए हैं। कृपया पुष्टि करने से पहले जाँच लें।'
                      : 'Some values were inferred from positional input without keywords. Please verify before confirming.'}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-cream/50 p-3 rounded-lg border border-brown-200/60">
                <div>
                  <span className="text-brown-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Customer (ग्राहक)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-brown-900 font-bold text-sm">
                      {session.customerName || '—'}
                    </span>
                    {(session.isNameInferred || session.slotSources?.customerName === 'deterministic') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (inputRef.current) {
                            inputRef.current.focus();
                            setInputText('name is ');
                          }
                        }}
                        className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors font-medium cursor-pointer shadow-xs"
                        title="Tap to correct customer name"
                      >
                        (detected — tap to correct)
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-brown-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Phone (फ़ोन)
                  </span>
                  <span className="text-brown-900 font-mono font-semibold text-sm block mt-0.5">
                    {session.phone || '—'}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-brown-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brown-100/70 text-brown-700 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Discount</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-200">
                    {session.lineItems.map((item, idx) => {
                      const isQtyFallback = item.isQtyAssumed || session.isQtyAssumed || item.qtySource === 'deterministic';
                      const isPriceFallback = item.isPriceAssumed || session.isPriceAssumed || item.priceSource === 'deterministic';

                      return (
                        <tr key={item.id || idx} className="hover:bg-cream/40">
                          <td className="py-2.5 px-3 font-medium text-brown-900">
                            {item.matchedName || item.productName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <div>{item.qty}</div>
                            {isQtyFallback && (
                              <span
                                className="inline-block text-[10px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-sans font-medium"
                                title="Quantity assumed / fallback — please confirm"
                              >
                                (assumed — please confirm)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <div>₹{item.unitPrice.toFixed(2)}</div>
                            {isPriceFallback && (
                              <span
                                className="inline-block text-[10px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-sans font-medium"
                                title="Price assumed / fallback — please confirm"
                              >
                                (assumed — please confirm)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '0%'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-brown-900">
                            ₹{item.lineTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-sm">
                  <span className="text-brown-600 mr-2">Grand Total:</span>
                  <span className="text-xl font-bold font-display text-emerald-800">
                    ₹{session.grandTotal}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.focus();
                        setInputText('change quantity to ');
                      }
                    }}
                    className="px-3.5 py-2 bg-surface border border-brown-300 hover:bg-brown-100 text-brown-800 font-semibold text-xs rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brown-600" />
                    Edit (बदलाव करें)
                  </button>

                  <button
                    type="button"
                    disabled={confirming}
                    onClick={handleConfirmBill}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-display text-xs uppercase tracking-wider rounded-[8px] transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {confirming ? (
                      'Generating Invoice...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Generate Bill
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Invoice Banner (when confirmed) */}
          {session && session.status === 'confirmed' && (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-[12px] shadow-sm my-4 space-y-3 text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-bold font-display text-base text-emerald-900">
                    Official Customer Invoice Created: {session.invoiceNumber}
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Double-entry ledger posted (DR Debtors / CR Sales Income) and stock moved automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {session.pdfUrl && (
                  <a
                    href={session.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-brown-900 text-cream hover:bg-brown-800 text-xs font-semibold rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    Print / Download PDF Bill
                  </a>
                )}

                {session.invoiceId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/sales/invoices/${session.invoiceId}`)}
                    className="px-4 py-2 bg-surface border border-brown-300 hover:bg-brown-100 text-brown-900 text-xs font-semibold rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-brown-600" />
                    View in Customer Invoices
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetSession}
                  className="px-4 py-2 bg-emerald-200/60 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Create Another Bill
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-cream/60 border-t border-brown-200/80 overflow-x-auto flex items-center gap-2 text-xs">
          <span className="text-[10px] font-semibold text-brown-500 uppercase tracking-wider shrink-0">
            Try asking:
          </span>
          {sampleChips.map(chip => (
            <button
              key={chip}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 bg-surface hover:bg-brown-100 border border-brown-300/80 text-brown-700 text-xs rounded-full whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 my-2 p-2.5 bg-danger-bg border border-danger/30 text-danger rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Control Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-surface border-t border-brown-200 flex items-center gap-2"
        >
          {/* Voice Mic Button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Click to stop listening' : `Click to speak (${speechLang === 'hi-IN' ? 'Hindi' : 'English'})`}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-sm ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                  : 'bg-brown-100 hover:bg-brown-200 text-brown-800'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... बोलिए...'
                : speechLang === 'hi-IN'
                ? "हिंदी या English में लिखें (जैसे '2 Teak Desk price 5000 for Rahul, phone 9876543210')..."
                : "Type or speak in Hindi or English (e.g. '2 Teak Desk price 5000 for Rahul, phone 9876543210')..."
            }
            className="flex-1 bg-cream/40 border border-brown-300 rounded-[10px] px-4 py-2.5 text-sm text-brown-900 placeholder:text-brown-400 focus:outline-none focus:border-brown-600 focus:ring-1 focus:ring-brown-600 transition-all font-body"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-brown-900 hover:bg-brown-800 text-cream rounded-full transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
