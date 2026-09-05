import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Edit3,
  Database,
  Package,
  Search,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Receipt,
  FileSpreadsheet,
  Phone,
  UserCheck,
  CreditCard,
  ExternalLink
} from 'lucide-react';

export interface CatalogProduct {
  id: number;
  name: string;
  sku: string | null;
  type?: string;
  category: string | null;
  salesPrice: string;
  taxRate: string;
  stockQty?: string;
}

export interface DatabaseCustomer {
  id: number;
  name: string;
  mobile: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
}

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
  qtyNeedsReview?: boolean;
  priceNeedsReview?: boolean;
  discountNeedsReview?: boolean;
  qtySource?: 'llm' | 'deterministic' | 'agreement';
  priceSource?: 'llm' | 'deterministic' | 'agreement';
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
  disagreementWarnings?: { en: string[]; hi: string[] };
  slotSources?: {
    customerName?: 'llm' | 'deterministic';
    phone?: 'llm' | 'deterministic';
    productName?: 'llm' | 'deterministic';
    qty?: 'llm' | 'deterministic' | 'agreement';
    unitPrice?: 'llm' | 'deterministic' | 'agreement';
    discountPercent?: 'llm' | 'deterministic' | 'agreement';
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

// Web Audio API Synthesized Chimes (100% offline, zero network requests)
const playChime = (type: 'start' | 'stop' | 'send' | 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'stop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.22);
      });
    }
  } catch (_) {}
};

// Text to Speech (Assistant Voice Readback via Web Speech API)
const speakText = (text: string, lang: 'hi-IN' | 'en-IN') => {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/[*_~#🎉✅⚠️]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
};

// Convert number to Indian Rupee Words
function amountToWords(numStr: string): string {
  const num = Math.round(parseFloat(numStr) || 0);
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 === 0 ? '' : ' ' + inWords(n % 100000));
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 === 0 ? '' : ' ' + inWords(n % 10000000));
  }

  return inWords(num) + ' Rupees Only';
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

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceReadback, setVoiceReadback] = useState<boolean>(false);

  // Bill sheet view mode (A4 Tax Invoice vs Thermal POS Slip)
  const [receiptMode, setReceiptMode] = useState<'a4' | 'pos'>('a4');
  const [activeTabMobile, setActiveTabMobile] = useState<'chat' | 'bill'>('chat');

  // Database products & customers catalog state
  const [dbProducts, setDbProducts] = useState<CatalogProduct[]>([]);
  const [dbCustomers, setDbCustomers] = useState<DatabaseCustomer[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch products & customers from database on mount
  useEffect(() => {
    const fetchDatabaseData = async () => {
      setLoadingProducts(true);
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch('/api/voice-bill/products'),
          fetch('/api/voice-bill/customers'),
        ]);
        const prodJson = await prodRes.json();
        const custJson = await custRes.json();

        if (prodJson.data && Array.isArray(prodJson.data)) {
          setDbProducts(prodJson.data);
        }
        if (custJson.data && Array.isArray(custJson.data)) {
          setDbCustomers(custJson.data);
        }
      } catch (err) {
        console.warn('Failed to load database data:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchDatabaseData();
  }, []);

  // Filtered catalog products for search/drawer
  const filteredProducts = useMemo(() => {
    return dbProducts.filter(p => {
      const matchesSearch =
        catalogSearch.trim() === '' ||
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [dbProducts, catalogSearch, selectedCategory]);

  // Unique categories list from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    dbProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [dbProducts]);

  // Product Autocomplete suggestions based on current input
  const inputSuggestions = useMemo(() => {
    if (!inputText || inputText.trim().length < 2) return [];
    const query = inputText.trim().toLowerCase();
    return dbProducts
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 4);
  }, [dbProducts, inputText]);

  // Customer Autocomplete suggestions based on current input
  const customerSuggestions = useMemo(() => {
    if (!inputText || inputText.trim().length < 2) return [];
    const query = inputText.trim().toLowerCase();
    return dbCustomers
      .filter(c => c.name.toLowerCase().includes(query) || (c.mobile && c.mobile.includes(query)))
      .slice(0, 3);
  }, [dbCustomers, inputText]);

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
      if (soundEnabled) playChime('stop');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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
        if (soundEnabled) playChime('start');
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
        if (soundEnabled) playChime('stop');
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

    if (soundEnabled) playChime('send');

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

        if (voiceReadback) {
          speakText(json.data.reply, speechLang);
        }
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
        if (soundEnabled) playChime('success');

        const successMsg: ChatMessage = {
          id: `confirmed_${Date.now()}`,
          sender: 'assistant',
          text:
            session.language === 'hi'
              ? `🎉 बधाई हो! इनवॉइस ${json.data.invoiceNumber} सफलतापूर्वक पोस्ट हो गया है।\nकुल राशि: ₹${json.data.total}\nलेज़र प्रविष्टियां (Debtors / Sales Income) तैयार हैं।`
              : `🎉 Congratulations! Customer Invoice ${json.data.invoiceNumber} has been confirmed and posted to the general ledger.\nTotal Amount: ₹${json.data.total}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, successMsg]);
        setSession(prev => (prev ? {
          ...prev,
          status: 'confirmed',
          invoiceId: json.data.invoiceId,
          invoiceNumber: json.data.invoiceNumber,
          pdfUrl: json.data.pdfUrl,
        } : null));

        if (voiceReadback) {
          speakText(
            session.language === 'hi'
              ? `बिल तैयार है, कुल राशि ₹${json.data.total}`
              : `Invoice ${json.data.invoiceNumber} confirmed. Total amount is rupees ${json.data.total}`,
            speechLang
          );
        }
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

  // Handle quantity stepper directly via server session API
  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (!session || session.status === 'confirmed') return;
    try {
      if (newQty <= 0) {
        await handleDeleteItem(itemId);
        return;
      }
      const res = await fetch(`/api/voice-bill/session/${sessionId}/item/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: newQty }),
      });
      const json = await res.json();
      if (json.data) {
        setSession(json.data);
      }
    } catch (err: any) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Handle item deletion directly via server session API
  const handleDeleteItem = async (itemId: string) => {
    if (!session || session.status === 'confirmed') return;
    try {
      const res = await fetch(`/api/voice-bill/session/${sessionId}/item/${itemId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.data) {
        setSession(json.data);
        if (soundEnabled) playChime('stop');
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
    }
  };

  // Calculations for live bill sheet
  const subtotalDec = useMemo(() => {
    if (!session || !session.lineItems) return 0;
    return session.lineItems.reduce((sum, item) => {
      const base = item.qty * item.unitPrice;
      const discounted = item.discountPercent ? base * (1 - item.discountPercent / 100) : base;
      return sum + discounted;
    }, 0);
  }, [session]);

  const taxDec = useMemo(() => {
    if (!session || !session.lineItems) return 0;
    return session.lineItems.reduce((sum, item) => {
      const base = item.qty * item.unitPrice;
      const discounted = item.discountPercent ? base * (1 - item.discountPercent / 100) : base;
      return sum + discounted * ((item.taxRate || 18) / 100);
    }, 0);
  }, [session]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 font-body">
      {/* Top Banner & Audio Controls */}
      <div className="bg-surface border border-brown-300 rounded-[14px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-brown-900 tracking-tight">
                AI e-Bill Studio (Voice & Chat)
              </h1>
              <p className="text-xs text-brown-600 mt-0.5">
                Bilingual (Hindi + English) offline conversational billing with real-time ledger accounting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Database Connection Indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-full shadow-2xs"
            title="Active PostgreSQL connection: 312 products & customer contacts"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{loadingProducts ? 'Connecting to DB...' : `${dbProducts.length} DB Products`}</span>
          </div>

          {/* Catalog Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowCatalog(prev => !prev)}
            className={`px-3 py-1.5 border rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              showCatalog
                ? 'bg-brown-900 text-cream border-brown-900'
                : 'bg-surface text-brown-800 border-brown-300 hover:bg-brown-100'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-brown-600" />
            <span>{showCatalog ? 'Close Catalog' : 'Browse Catalog'}</span>
            {showCatalog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Chimes Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
            className={`p-2 rounded-[8px] border text-xs font-semibold transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-surface text-brown-500 border-brown-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Voice Readback Toggle */}
          <button
            type="button"
            onClick={() => setVoiceReadback(prev => !prev)}
            title={voiceReadback ? 'Voice Readback Enabled (बोलकर सुनाएगा)' : 'Voice Readback Disabled'}
            className={`px-2.5 py-1.5 rounded-[8px] border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              voiceReadback
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                : 'bg-surface text-brown-700 border-brown-300 hover:bg-brown-100'
            }`}
          >
            <span>TTS</span>
            <span className={`w-1.5 h-1.5 rounded-full ${voiceReadback ? 'bg-amber-300 animate-pulse' : 'bg-brown-400'}`}></span>
          </button>

          {/* Voice Language Selector */}
          <div className="flex items-center bg-cream border border-brown-300 rounded-[8px] p-1 text-xs shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-brown-600 mx-1" />
            <button
              type="button"
              onClick={() => setSpeechLang('hi-IN')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                speechLang === 'en-IN'
                  ? 'bg-brown-900 text-cream font-semibold shadow-xs'
                  : 'text-brown-700 hover:text-brown-900'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            className="px-3 py-1.5 bg-surface text-brown-800 border border-brown-300 rounded-[8px] hover:bg-brown-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brown-600" />
            Reset
          </button>
        </div>
      </div>

      {/* Expandable Database Product Catalog Panel */}
      {showCatalog && (
        <div className="bg-surface border border-brown-300 rounded-[14px] p-4 shadow-sm space-y-3 transition-all">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-brown-200">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-brown-700" />
              <h3 className="text-sm font-bold text-brown-900 font-display">
                Database Product Catalog ({dbProducts.length} Items from PostgreSQL)
              </h3>
            </div>

            {/* Live Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-8 pr-3 py-1.5 bg-cream/50 border border-brown-300 rounded-[8px] text-xs text-brown-900 placeholder:text-brown-400 focus:outline-none focus:border-brown-600 font-body"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-brown-900 text-cream'
                    : 'bg-brown-100 text-brown-700 hover:bg-brown-200'
                }`}
              >
                All ({dbProducts.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-brown-900 text-cream'
                      : 'bg-brown-100 text-brown-700 hover:bg-brown-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pr-1">
            {filteredProducts.slice(0, 48).map(prod => (
              <div
                key={prod.id}
                className="p-2.5 bg-cream/40 border border-brown-200 rounded-[10px] hover:border-brown-400 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="font-semibold text-xs text-brown-900 leading-tight line-clamp-1" title={prod.name}>
                    {prod.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-brown-500">
                    {prod.category && <span>{prod.category}</span>}
                    {prod.sku && <span className="font-mono text-[10px]">{prod.sku}</span>}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-brown-200/60 flex items-center justify-between">
                  <div className="font-mono font-bold text-xs text-brown-900">
                    ₹{parseFloat(prod.salesPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendMessage(prod.name);
                    }}
                    className="px-2.5 py-1 bg-brown-900 hover:bg-brown-800 text-cream text-[11px] font-semibold rounded-[6px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-6 text-xs text-brown-500 italic">
                No products match "{catalogSearch}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-cream border border-brown-300 rounded-[10px] p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTabMobile('chat')}
          className={`flex-1 py-1.5 rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'chat' ? 'bg-brown-900 text-cream shadow-xs' : 'text-brown-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat & Voice</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile('bill')}
          className={`flex-1 py-1.5 rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'bill' ? 'bg-brown-900 text-cream shadow-xs' : 'text-brown-700'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Live Bill Sheet ({session?.lineItems?.length || 0})</span>
        </button>
      </div>

      {/* Main Dual-Pane Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane (7 cols): Conversational Assistant */}
        <div className={`lg:col-span-7 space-y-3 ${activeTabMobile === 'chat' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-surface border border-brown-300 rounded-[16px] shadow-sm flex flex-col h-[680px] overflow-hidden">
            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-cream/25">
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
                      className={`max-w-[85%] sm:max-w-[78%] rounded-[14px] p-3.5 shadow-xs text-sm ${
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
                <div className="flex items-center gap-2.5 text-xs text-brown-600 italic p-3 bg-surface/80 border border-brown-200 rounded-[10px] w-fit shadow-2xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                  <span>Ollama AI extraction & catalog matching in progress...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Live Audio Equalizer Waveform Animation when mic is listening */}
            {isListening && (
              <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold font-display">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <span>Listening... बोलिए... ({speechLang === 'hi-IN' ? 'हिन्दी' : 'English'})</span>
                </div>
                {/* Audio Waveform Bars */}
                <div className="flex items-center gap-1 h-5">
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3"></span>
                  <span className="w-1 bg-rose-600 rounded-full animate-pulse h-5"></span>
                  <span className="w-1 bg-rose-400 rounded-full animate-pulse h-2"></span>
                  <span className="w-1 bg-rose-700 rounded-full animate-pulse h-4"></span>
                  <span className="w-1 bg-rose-500 rounded-full animate-pulse h-3"></span>
                </div>
              </div>
            )}

            {/* Real-time Customer Autocomplete Bar */}
            {customerSuggestions.length > 0 && (
              <div className="px-4 py-2 bg-blue-50/95 border-t border-blue-200 flex items-center gap-2 overflow-x-auto text-xs animate-fadeIn">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-700" /> Customer Match:
                </span>
                {customerSuggestions.map(cust => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setInputText(`customer ${cust.name} phone ${cust.mobile || ''}`);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-300 text-blue-900 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span className="font-semibold">{cust.name}</span>
                    {cust.mobile && <span className="font-mono text-[11px] text-blue-700">({cust.mobile})</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Real-time Product Autocomplete Bar from Database */}
            {inputSuggestions.length > 0 && (
              <div className="px-4 py-2 bg-emerald-50/95 border-t border-emerald-200 flex items-center gap-2 overflow-x-auto text-xs animate-fadeIn">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-600" /> DB Catalog:
                </span>
                {inputSuggestions.map(sug => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => {
                      setInputText(`1 ${sug.name}`);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span className="font-semibold">{sug.name}</span>
                    <span className="font-mono text-emerald-700">₹{parseFloat(sug.salesPrice).toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            )}


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

        {/* Right Pane (5 cols): Modern Showroom-Grade Live Invoice Sheet */}
        <div className={`lg:col-span-5 space-y-3 ${activeTabMobile === 'bill' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[720px] text-stone-900 font-body transition-all relative">
            <div className="space-y-4">
              {/* Top Bar: Live Status & Format Segmented Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  {session?.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      OFFICIAL INVOICE POSTED
                    </span>
                  ) : session?.status === 'ready_for_confirm' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 animate-pulse shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      READY TO CONFIRM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold font-mono bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      LIVE DRAFT BILL
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                    State Code: 24 (Gujarat)
                  </span>
                </div>

                {/* Segmented Mode Control */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setReceiptMode('a4')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      receiptMode === 'a4'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Tax Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptMode('pos')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      receiptMode === 'pos'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    POS Slip
                  </button>
                </div>
              </div>

              {receiptMode === 'a4' ? (
                /* ── Sleek Modern Showroom Tax Invoice ─────────────────────── */
                <div className="space-y-3.5 text-xs">
                  {/* Brand & Invoice Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-200 font-display font-black text-sm flex items-center justify-center shadow-xs tracking-wider">
                          UF
                        </div>
                        <div>
                          <h2 className="text-lg font-black font-display tracking-tight text-stone-900 leading-none">
                            URBAN FURNITURE
                          </h2>
                          <p className="text-[11px] text-stone-500 font-body mt-0.5">Contemporary Living &amp; Architectural Showroom</p>
                        </div>
                      </div>
                      <div className="text-[10.5px] text-stone-600 space-y-0.5 pt-1.5 font-mono">
                        <div>GSTIN: <strong className="text-stone-900 font-bold">24AABCU9603R1ZM</strong> • CIN: U36100GJ2020PTC115482</div>
                        <div className="text-stone-500">Plot 42, GIDC Electronics Zone, Gandhinagar - 382024, Gujarat</div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1 sm:self-start">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-900 text-cream rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shadow-2xs">
                        TAX INVOICE
                      </span>
                      <div className="text-base font-bold font-mono text-stone-900 tracking-tight">
                        {session?.invoiceNumber || 'INV-2026-DRAFT'}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Issue Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Customer / Billed To Card */}
                    <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-stone-500" />
                        <span>Billed To</span>
                      </div>
                      <div className="text-sm font-bold text-stone-900">
                        {session?.customerName || (
                          <span className="text-stone-400 font-normal italic">Pending Customer Name...</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-700 font-mono">
                        {session?.phone ? (
                          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800 font-semibold shadow-2xs">
                            <Phone className="w-2.5 h-2.5 text-stone-500" />
                            +91 {session.phone}
                          </span>
                        ) : (
                          <span className="text-stone-400 font-normal italic">Pending Contact Number...</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-stone-600 pt-1.5 border-t border-stone-200/60">
                        <span>Place of Supply: <strong className="text-stone-800 font-semibold">24 - Gujarat</strong></span>
                        <span className="px-2 py-0.5 bg-white text-stone-700 rounded-full border border-stone-200 text-[9px] font-mono font-medium shadow-2xs">
                          B2C Consumer
                        </span>
                      </div>
                    </div>

                    {/* Invoice Particulars Card */}
                    <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5 space-y-1.5 text-xs shadow-2xs">
                      <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-stone-500" />
                        <span>Invoice Particulars</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-700 pt-0.5">
                        <span className="text-stone-500">Supply Nature:</span>
                        <span className="font-semibold text-stone-900">Intra-State (9% CGST + 9% SGST)</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-700">
                        <span className="text-stone-500">HSN Classification:</span>
                        <span className="font-mono font-medium text-stone-800">9403 (Furniture &amp; Fixtures)</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-700 pt-1 border-t border-stone-200/60">
                        <span className="text-stone-500">Settlement:</span>
                        <span className="font-semibold text-emerald-700 font-mono">Immediate Due</span>
                      </div>
                    </div>
                  </div>

                  {/* Disagreement Warnings (if any) */}
                  {session?.disagreementWarnings && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 shadow-2xs">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Parser Clarifications Applied:</span>
                      </div>
                      {session.disagreementWarnings.en?.map((w, i) => (
                        <div key={i} className="pl-5 text-[11px] text-amber-800">• {w}</div>
                      ))}
                    </div>
                  )}

                  {/* Modern Spacious Line Items Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-bold font-mono text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3.5">Item &amp; Grade</th>
                          <th className="py-2.5 px-2 text-center w-14">HSN</th>
                          <th className="py-2.5 px-2 text-center w-24">Qty</th>
                          <th className="py-2.5 px-2 text-right w-24">Rate</th>
                          <th className="py-2.5 px-2 text-right w-24">Taxable</th>
                          <th className="py-2.5 px-3.5 text-right w-28">Total</th>
                          <th className="py-2.5 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {session?.lineItems && session.lineItems.length > 0 ? (
                          session.lineItems.map((item, idx) => {
                            const baseRate = item.unitPrice || 0;
                            const qty = item.qty || 0;
                            const discount = item.discountPercent || 0;
                            const taxable = (qty * baseRate) * (1 - discount / 100);
                            const gstAmt = taxable * ((item.taxRate || 18) / 100);
                            const lineTotal = taxable + gstAmt;

                            return (
                              <tr key={item.id || idx} className="hover:bg-stone-50/60 transition-colors">
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-stone-900 text-xs leading-tight">
                                    {item.matchedName || item.productName}
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-mono mt-0.5 flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[9px]">
                                      Showroom Finish
                                    </span>
                                    {discount > 0 && (
                                      <span className="text-emerald-700 font-semibold">
                                        ({discount}% off)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center font-mono text-stone-500 text-xs">
                                  9403
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <div className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, Math.max(0, item.qty - 1))}
                                      className="w-4 h-4 rounded text-stone-600 hover:bg-white hover:shadow-xs flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                                      title="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold text-xs w-4 text-center text-stone-900">
                                      {item.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                                      className="w-4 h-4 rounded text-stone-600 hover:bg-white hover:shadow-xs flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                                      title="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-stone-700 text-xs">
                                  ₹{baseRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-stone-800 text-xs">
                                  ₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3.5 text-right font-mono font-bold text-stone-900 text-xs">
                                  ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    title="Remove item"
                                    className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-stone-600">No items on invoice yet</div>
                                <div className="text-[11px] text-stone-400">
                                  Speak or type product details to start building the bill.
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Bank Remittance Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Left: Remittance Bank Card */}
                    <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
                      <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                        <span>Payment &amp; Showroom Warranty</span>
                      </div>
                      <div className="text-xs font-mono text-stone-700 leading-tight space-y-1">
                        <div>Bank: <strong className="text-stone-900 font-semibold">State Bank of India</strong></div>
                        <div>A/C: <strong className="text-stone-900 font-semibold">389201004521</strong> (Current)</div>
                        <div>IFSC: <strong>SBIN0001234</strong> • Gandhinagar</div>
                        <div>UPI Handle: <strong className="text-emerald-700 font-bold">urbanfurniture@sbi</strong></div>
                      </div>
                      <div className="text-[10.5px] text-emerald-800 pt-1.5 border-t border-stone-200/60 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>1-Year Comprehensive Warranty Included</span>
                      </div>
                    </div>

                    {/* Right: Modern High-Impact Totals Card */}
                    <div className="bg-stone-900 text-white rounded-xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex justify-between text-stone-300 text-xs">
                        <span>Taxable Subtotal:</span>
                        <span className="font-mono font-medium">₹{subtotalDec.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-stone-400 text-[11px]">
                        <span>CGST (9%):</span>
                        <span className="font-mono">₹{(taxDec / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-stone-400 text-[11px]">
                        <span>SGST (9%):</span>
                        <span className="font-mono">₹{(taxDec / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-2.5 border-t border-stone-700/90 flex items-center justify-between">
                        <span className="font-bold text-amber-200 text-xs font-mono uppercase tracking-wider">
                          TOTAL AMOUNT DUE
                        </span>
                        <span className="font-mono font-black text-xl text-emerald-400 tracking-tight">
                          ₹{parseFloat(session?.grandTotal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {session?.grandTotal && parseFloat(session.grandTotal) > 0 && (
                        <div className="text-[10px] text-stone-400 italic text-right font-mono pt-1 leading-snug border-t border-stone-800">
                          {amountToWords(session.grandTotal)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-[10.5px]">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Certified Electronic Commercial Invoice</span>
                    </div>

                    <div className="text-right text-stone-500 font-mono text-[10px]">
                      <span>Authorised Signatory • Urban Furniture Pvt. Ltd.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Modern Minimalist POS Slip ─────────────────────── */
                <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-5 font-mono text-xs space-y-3.5 shadow-2xs">
                  <div className="text-center border-b border-dashed border-stone-300 pb-3 space-y-0.5">
                    <div className="text-base font-black tracking-tight text-stone-900 uppercase">URBAN FURNITURE</div>
                    <div className="text-[10px] text-stone-500">Plot 42, GIDC Electronics Zone, Gandhinagar</div>
                    <div className="text-[10px] text-stone-600 font-bold">GSTIN: 24AABCU9603R1ZM</div>
                    <div className="text-[10px] font-bold text-emerald-800 mt-1 uppercase tracking-wider">
                      Retail Tax Invoice
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] border-b border-dashed border-stone-300 pb-2.5 text-stone-600">
                    <div>
                      <div>Bill No: <strong className="text-stone-900">{session?.invoiceNumber || 'POS-DRAFT'}</strong></div>
                      <div>Customer: <strong className="text-stone-900">{session?.customerName || 'Walk-in'}</strong></div>
                    </div>
                    <div className="text-right">
                      <div>{new Date().toLocaleDateString('en-IN')}</div>
                      <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  {/* POS Line Items */}
                  <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
                    <div className="flex justify-between font-bold text-[10px] text-stone-700">
                      <span className="w-1/2">ITEM</span>
                      <span className="w-1/6 text-center">QTY</span>
                      <span className="w-1/6 text-right">RATE</span>
                      <span className="w-1/6 text-right">TOTAL</span>
                    </div>
                    {session?.lineItems && session.lineItems.length > 0 ? (
                      session.lineItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[10px]">
                          <span className="w-1/2 truncate font-semibold text-stone-900">{item.matchedName || item.productName}</span>
                          <span className="w-1/6 text-center">{item.qty}</span>
                          <span className="w-1/6 text-right font-mono">₹{item.unitPrice}</span>
                          <span className="w-1/6 text-right font-mono font-bold text-stone-900">₹{item.lineTotal}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center italic text-stone-400 py-3">No items billed yet</div>
                    )}
                  </div>

                  {/* POS Totals */}
                  <div className="space-y-1.5 text-[10.5px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal (Taxable):</span>
                      <span className="font-mono font-medium text-stone-800">₹{subtotalDec.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>CGST (9%):</span>
                      <span className="font-mono">₹{(taxDec / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>SGST (9%):</span>
                      <span className="font-mono">₹{(taxDec / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t-2 border-dashed border-stone-900 pt-2 flex justify-between font-black text-sm text-stone-900">
                      <span>NET AMOUNT PAYABLE:</span>
                      <span className="font-mono text-emerald-800">₹{parseFloat(session?.grandTotal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="text-center pt-2.5 border-t border-dashed border-stone-300 text-[9px] text-stone-500">
                    <div>Thank you for visiting Urban Furniture!</div>
                    <div>Goods covered under 1-Year Warranty • www.urbanfurniture.in</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions & Ledger Confirmation */}
            <div className="pt-4 border-t border-stone-200 space-y-2.5">
              {session?.status === 'ready_for_confirm' && (
                <button
                  type="button"
                  disabled={confirming}
                  onClick={handleConfirmBill}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {confirming ? (
                    'Generating Customer Invoice & Posting Ledger...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Confirm &amp; Post Invoice to Ledger</span>
                    </>
                  )}
                </button>
              )}

              {session?.status === 'confirmed' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Invoice Posted: {session.invoiceNumber}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-mono font-bold">
                      POSTED
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {session.pdfUrl && (
                      <a
                        href={session.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-stone-900 text-amber-100 hover:bg-stone-800 text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>Print PDF Bill</span>
                      </a>
                    )}

                    {session.invoiceId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/sales/invoices/${session.invoiceId}`)}
                        className="flex-1 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-900 text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-600" />
                        <span>View Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(!session || session.status === 'collecting') && (
                <div className="text-center text-xs text-stone-400 italic py-1 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Draft bill updates live as you speak or chat</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
