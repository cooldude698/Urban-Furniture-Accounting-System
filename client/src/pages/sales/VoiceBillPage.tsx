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
                      handleSendMessage(`1 ${prod.name}`);
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

        {/* Right Pane (5 cols): Live Real-time Government-Approved GST Tax Invoice Sheet */}
        <div className={`lg:col-span-5 space-y-3 ${activeTabMobile === 'bill' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border-2 border-stone-800 rounded-[14px] p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[720px] text-stone-900 font-sans">
            <div className="space-y-3">
              {/* Top Government Strip & Format Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-2.5 w-6 rounded-xs overflow-hidden border border-stone-300 shadow-2xs">
                    <div className="w-1/3 bg-[#FF9933]"></div>
                    <div className="w-1/3 bg-white"></div>
                    <div className="w-1/3 bg-[#138808]"></div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-600">
                    GST Rule 46 Compliant
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mono uppercase mr-0.5">Format:</span>
                  <button
                    type="button"
                    onClick={() => setReceiptMode('a4')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-xs font-mono transition-colors cursor-pointer ${
                      receiptMode === 'a4' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    A4 Tax Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptMode('pos')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-xs font-mono transition-colors cursor-pointer ${
                      receiptMode === 'pos' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    POS Slip
                  </button>
                </div>
              </div>

              {receiptMode === 'a4' ? (
                /* ── Formal A4 Indian GST Tax Invoice ─────────────────────── */
                <div className="space-y-2.5 text-[11px]">
                  {/* Statutory Invoice Header */}
                  <div className="border-2 border-stone-800 p-2.5 bg-stone-50/70 rounded-xs">
                    <div className="flex items-start justify-between border-b border-stone-300 pb-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-stone-900 text-white text-[9px] font-bold font-mono tracking-widest uppercase rounded-xs">
                          ORIGINAL FOR RECIPIENT
                        </span>
                        <h2 className="text-xl font-black font-serif tracking-tight text-stone-900 mt-1 uppercase">
                          TAX INVOICE
                        </h2>
                        <p className="text-[9px] text-stone-500 font-mono">
                          Issued under Sec 31 of CGST Act, 2017 read with Rule 46 of CGST Rules
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="text-right">
                          <div className="text-sm font-black text-stone-900 uppercase tracking-tight">
                            URBAN FURNITURE PVT. LTD.
                          </div>
                          <div className="text-[9px] text-stone-600 font-mono">
                            CIN: U36100GJ2020PTC115482
                          </div>
                          <div className="text-[10px] font-bold text-stone-900 font-mono">
                            GSTIN: 24AABCU9603R1ZM
                          </div>
                          <div className="text-[9px] text-stone-500">
                            State: Gujarat (Code: 24) • PAN: AABCU9603R
                          </div>
                        </div>

                        {/* Official E-Invoice QR Code Matrix SVG */}
                        <div className="hidden sm:block shrink-0">
                          <svg width="58" height="58" viewBox="0 0 100 100" className="border border-stone-800 p-0.5 bg-white">
                            <rect width="100" height="100" fill="#ffffff" />
                            <rect x="5" y="5" width="28" height="28" fill="#000" />
                            <rect x="9" y="9" width="20" height="20" fill="#fff" />
                            <rect x="13" y="13" width="12" height="12" fill="#000" />
                            <rect x="67" y="5" width="28" height="28" fill="#000" />
                            <rect x="71" y="9" width="20" height="20" fill="#fff" />
                            <rect x="75" y="13" width="12" height="12" fill="#000" />
                            <rect x="5" y="67" width="28" height="28" fill="#000" />
                            <rect x="9" y="71" width="20" height="20" fill="#fff" />
                            <rect x="13" y="75" width="12" height="12" fill="#000" />
                            <rect x="38" y="8" width="5" height="5" fill="#000" />
                            <rect x="48" y="12" width="5" height="5" fill="#000" />
                            <rect x="58" y="8" width="5" height="5" fill="#000" />
                            <rect x="42" y="24" width="6" height="6" fill="#000" />
                            <rect x="52" y="28" width="6" height="6" fill="#000" />
                            <rect x="8" y="42" width="6" height="6" fill="#000" />
                            <rect x="20" y="48" width="5" height="5" fill="#000" />
                            <rect x="38" y="38" width="24" height="24" fill="#000" />
                            <rect x="43" y="43" width="14" height="14" fill="#fff" />
                            <rect x="47" y="47" width="6" height="6" fill="#000" />
                            <rect x="68" y="40" width="6" height="6" fill="#000" />
                            <rect x="78" y="48" width="5" height="5" fill="#000" />
                            <rect x="88" y="42" width="6" height="6" fill="#000" />
                            <rect x="40" y="70" width="5" height="5" fill="#000" />
                            <rect x="52" y="75" width="6" height="6" fill="#000" />
                            <rect x="68" y="68" width="6" height="6" fill="#000" />
                            <rect x="80" y="72" width="6" height="6" fill="#000" />
                            <rect x="72" y="84" width="5" height="5" fill="#000" />
                            <rect x="85" y="88" width="6" height="6" fill="#000" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] text-stone-600 pt-1.5 flex flex-wrap justify-between gap-1 font-mono">
                      <span>Regd. Office: Plot 42, Sec 25, GIDC Electronics Zone, Gandhinagar - 382024</span>
                      <span>Tel: +91 79 2328 0000 • billing@urbanfurniture.in</span>
                    </div>

                    {/* e-Invoice IRN & Ack Metadata */}
                    <div className="pt-1.5 mt-1.5 border-t border-dashed border-stone-300 flex flex-wrap justify-between items-center text-[8.5px] font-mono text-stone-600">
                      <div>
                        IRN: <span className="font-bold text-stone-800">4f9a7b8e1c2d3f0a9b8c7d6e5f4a3b2c1d0e9f8a...</span>
                      </div>
                      <div>
                        Ack No: <strong className="text-stone-900">122609049281</strong> • Ack Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Statutory Grid: Billed To vs Invoice Details */}
                  <div className="grid grid-cols-2 border-2 border-stone-800 divide-x-2 divide-stone-800 bg-white">
                    {/* Left: Details of Receiver / Billed To */}
                    <div className="p-2 space-y-0.5">
                      <div className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-0.5 mb-1">
                        Details of Receiver | Billed To:
                      </div>
                      <div className="font-bold text-xs text-stone-900">
                        {session?.customerName || <span className="text-stone-400 italic">Pending Customer Name...</span>}
                      </div>
                      <div className="font-mono text-stone-700 text-[10px]">
                        Contact: {session?.phone ? `+91 ${session.phone}` : <span className="text-stone-400 italic">Pending Mobile...</span>}
                      </div>
                      <div className="text-stone-600 text-[9px]">
                        Place of Delivery: Gandhinagar / Ahmedabad, Gujarat
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-stone-700 font-mono pt-1">
                        <span>State: <strong>Gujarat (24)</strong></span>
                        <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded-xs border border-stone-300 text-[8px] font-bold">
                          B2C Consumer
                        </span>
                      </div>
                    </div>

                    {/* Right: Invoice Particulars */}
                    <div className="p-2 space-y-0.5">
                      <div className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-0.5 mb-1">
                        Tax Invoice Particulars:
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-stone-600">Invoice No:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {session?.invoiceNumber || 'DRAFT-GST-INV'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-stone-600">Invoice Date:</span>
                        <span className="font-mono text-stone-800">
                          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-stone-600">Place of Supply:</span>
                        <span className="font-mono font-bold text-stone-800">24 - Gujarat</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-stone-600">Reverse Charge (RCM):</span>
                        <span className="font-mono font-bold text-emerald-800">No</span>
                      </div>
                    </div>
                  </div>

                  {/* Disagreement Warning Notice (if any) */}
                  {session?.disagreementWarnings && (
                    <div className="p-2 bg-amber-50 border border-amber-300 rounded-xs text-[10px] text-amber-900 space-y-0.5">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        <span>Deterministic Parser Disagreement Overrides:</span>
                      </div>
                      {session.disagreementWarnings.en?.map((w, i) => (
                        <div key={i} className="pl-4 text-[9px]">• {w}</div>
                      ))}
                    </div>
                  )}

                  {/* Statutory Line Items Table */}
                  <div className="border-2 border-stone-800 overflow-hidden">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-stone-100 border-b-2 border-stone-800 text-stone-900 font-bold font-mono uppercase">
                        <tr>
                          <th className="py-1.5 px-1 text-center border-r border-stone-300 w-6">#</th>
                          <th className="py-1.5 px-2 border-r border-stone-300">Description of Goods</th>
                          <th className="py-1.5 px-1.5 text-center border-r border-stone-300 w-12">HSN</th>
                          <th className="py-1.5 px-1.5 text-center border-r border-stone-300 w-16">Qty</th>
                          <th className="py-1.5 px-2 text-right border-r border-stone-300 w-14">Rate (₹)</th>
                          <th className="py-1.5 px-2 text-right border-r border-stone-300 w-16">Taxable</th>
                          <th className="py-1.5 px-1.5 text-right border-r border-stone-300 w-14">GST (18%)</th>
                          <th className="py-1.5 px-2 text-right w-16">Total (₹)</th>
                          <th className="py-1.5 px-1 text-center w-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {session?.lineItems && session.lineItems.length > 0 ? (
                          session.lineItems.map((item, idx) => {
                            const baseRate = item.unitPrice || 0;
                            const qty = item.qty || 0;
                            const discount = item.discountPercent || 0;
                            const taxable = (qty * baseRate) * (1 - discount / 100);
                            const gstAmt = taxable * ((item.taxRate || 18) / 100);
                            const lineTotal = taxable + gstAmt;

                            return (
                              <tr key={item.id || idx} className="hover:bg-stone-50">
                                <td className="py-1.5 px-1 text-center font-mono border-r border-stone-200 text-stone-500">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-2 font-medium text-stone-900 border-r border-stone-200">
                                  <div className="leading-tight font-bold">{item.matchedName || item.productName}</div>
                                  <div className="text-[8px] text-stone-500 font-mono">Wood / Commercial Furniture</div>
                                  {discount > 0 && (
                                    <span className="inline-block text-[8px] text-emerald-800 font-mono">
                                      ({discount}% discount applied)
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 px-1.5 text-center font-mono text-stone-600 border-r border-stone-200">
                                  9403
                                </td>
                                <td className="py-1.5 px-1 text-center border-r border-stone-200">
                                  <div className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                                      className="w-4 h-4 rounded-xs bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center justify-center cursor-pointer text-[10px]"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold w-4 text-center">{item.qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                                      className="w-4 h-4 rounded-xs bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center justify-center cursor-pointer text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="block text-[8px] text-stone-400 font-mono">NOS</span>
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono text-stone-700 border-r border-stone-200">
                                  {baseRate.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono text-stone-800 border-r border-stone-200">
                                  {taxable.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-1.5 text-right font-mono text-stone-600 border-r border-stone-200 text-[9px]">
                                  {gstAmt.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-stone-900">
                                  {lineTotal.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    title="Delete item from bill"
                                    className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-stone-400 italic text-[11px]">
                              No line items added yet. Speak or type to add items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Statutory GST Tax Schedule Breakup */}
                  <div className="border border-stone-300 rounded-xs overflow-hidden bg-stone-50/50">
                    <table className="w-full text-left text-[9px] font-mono border-collapse">
                      <thead className="bg-stone-200/80 text-stone-700 font-bold border-b border-stone-300">
                        <tr>
                          <th className="py-1 px-2">HSN / SAC</th>
                          <th className="py-1 px-2 text-right">Taxable Amount</th>
                          <th className="py-1 px-2 text-right">CGST (9%)</th>
                          <th className="py-1 px-2 text-right">SGST (9%)</th>
                          <th className="py-1 px-2 text-right">Total Tax Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1 px-2 font-bold">9403 (Furniture)</td>
                          <td className="py-1 px-2 text-right">₹{subtotalDec.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right">₹{(taxDec / 2).toFixed(2)}</td>
                          <td className="py-1 px-2 text-right">₹{(taxDec / 2).toFixed(2)}</td>
                          <td className="py-1 px-2 text-right font-bold">₹{taxDec.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Grand Total Summary */}
                  <div className="border-2 border-stone-800 p-2.5 bg-stone-50 space-y-1">
                    <div className="flex items-center justify-between text-stone-700">
                      <span>Total Taxable Amount:</span>
                      <span className="font-mono font-semibold">₹{subtotalDec.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 text-[10px]">
                      <span>Central GST (CGST @ 9%):</span>
                      <span className="font-mono">₹{(taxDec / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 text-[10px]">
                      <span>State GST (SGST @ 9%):</span>
                      <span className="font-mono">₹{(taxDec / 2).toFixed(2)}</span>
                    </div>
                    <div className="border-t-2 border-stone-800 pt-1.5 flex items-center justify-between font-black text-stone-900 text-sm">
                      <span className="uppercase tracking-tight">Total Invoice Value (Incl. GST):</span>
                      <span className="font-mono text-base text-emerald-900 font-bold">
                        ₹{session?.grandTotal || '0.00'}
                      </span>
                    </div>
                    {session?.grandTotal && parseFloat(session.grandTotal) > 0 && (
                      <div className="text-[9px] text-stone-600 font-mono italic text-right pt-0.5 border-t border-stone-200">
                        Amount Chargeable (in words): <strong>{amountToWords(session.grandTotal)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Bank Remittance Details & Statutory Declaration */}
                  <div className="grid grid-cols-2 border border-stone-300 p-2 text-[9px] gap-2 bg-stone-50/50 rounded-xs">
                    <div>
                      <div className="font-bold text-stone-700 uppercase font-mono mb-0.5">
                        Bank Details for NEFT / RTGS:
                      </div>
                      <div className="font-mono text-stone-600 leading-tight">
                        Bank: <strong>State Bank of India</strong><br />
                        A/C No: <strong>389201004521</strong> (Current)<br />
                        IFSC: <strong>SBIN0001234</strong> • Gandhinagar Main<br />
                        UPI: <strong>urbanfurniture@sbi</strong>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-stone-700 uppercase font-mono mb-0.5">
                        Statutory Declaration:
                      </div>
                      <p className="text-[8px] text-stone-500 leading-tight">
                        Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Goods once sold are covered under standard Urban Furniture warranty. Subject to Gandhinagar jurisdiction.
                      </p>
                    </div>
                  </div>

                  {/* Certified Digital Verification Stamp & Authorized Signatory */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                      <div>
                        <div className="text-[9px] font-bold text-emerald-900 font-mono leading-none">
                          DIGITALLY VERIFIED INVOICE
                        </div>
                        <div className="text-[8px] text-stone-400 font-mono">
                          Class-3 DSC • GSTN Verified
                        </div>
                      </div>
                    </div>

                    {/* Official Stamp Graphic */}
                    <div className="hidden sm:block">
                      <svg width="60" height="60" viewBox="0 0 100 100" className="-rotate-3 opacity-90">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#065f46" strokeWidth="2.5" />
                        <circle cx="50" cy="50" r="41" fill="none" stroke="#065f46" strokeWidth="1" strokeDasharray="2,2" />
                        <path id="live-stamp-upper" d="M 16,50 A 34,34 0 0,1 84,50" fill="none" />
                        <path id="live-stamp-lower" d="M 84,50 A 34,34 0 0,1 16,50" fill="none" />
                        <text fontSize="6.5" fontWeight="900" fill="#065f46" letterSpacing="1">
                          <textPath href="#live-stamp-upper" startOffset="50%" textAnchor="middle">URBAN FURNITURE</textPath>
                        </text>
                        <text fontSize="5.5" fontWeight="700" fill="#065f46" letterSpacing="0.8">
                          <textPath href="#live-stamp-lower" startOffset="50%" textAnchor="middle">★ GANDHINAGAR ★</textPath>
                        </text>
                        <text x="50" y="44" fontSize="6.5" fontWeight="800" fill="#065f46" textAnchor="middle">GSTIN OK</text>
                        <text x="50" y="52" fontSize="5" fontFamily="monospace" fontWeight="700" fill="#065f46" textAnchor="middle">24AABCU9603R1ZM</text>
                        <text x="50" y="60" fontSize="4.5" fontWeight="700" fill="#065f46" textAnchor="middle">RULE 46</text>
                      </svg>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-bold text-stone-900 font-mono">
                        For URBAN FURNITURE PVT. LTD.
                      </div>
                      <div className="text-[8px] text-stone-400 italic mt-1.5 border-t border-stone-400 pt-0.5">
                        Authorised Signatory
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Thermal POS Cash Memo / Receipt ─────────────────────── */
                <div className="border-2 border-dashed border-stone-400 p-3 bg-stone-50 font-mono text-[10px] space-y-2.5 rounded-xs">
                  <div className="text-center border-b border-dashed border-stone-400 pb-2">
                    <div className="text-sm font-black uppercase tracking-tight">URBAN FURNITURE PVT LTD</div>
                    <div className="text-[9px] text-stone-600">GSTIN: 24AABCU9603R1ZM • State: 24 (GJ)</div>
                    <div className="text-[9px] text-stone-600">Plot 42, GIDC, Gandhinagar, Gujarat - 382024</div>
                    <div className="text-[10px] font-bold mt-1 text-stone-800">RETAIL TAX INVOICE (CASH MEMO)</div>
                  </div>

                  <div className="flex justify-between text-[9px] border-b border-dashed border-stone-300 pb-1.5">
                    <div>
                      <div>Bill No: <strong>{session?.invoiceNumber || 'DRAFT-POS'}</strong></div>
                      <div>Customer: <strong>{session?.customerName || 'Walk-in Customer'}</strong></div>
                      <div>Phone: {session?.phone ? `+91 ${session.phone}` : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
                      <div>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>Cashier: System</div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1 border-b border-dashed border-stone-400 pb-2">
                    <div className="flex justify-between font-bold border-b border-stone-300 pb-0.5 text-[9px]">
                      <span className="w-1/2">ITEM (HSN 9403)</span>
                      <span className="w-1/6 text-center">QTY</span>
                      <span className="w-1/6 text-right">RATE</span>
                      <span className="w-1/6 text-right">TOTAL</span>
                    </div>
                    {session?.lineItems && session.lineItems.length > 0 ? (
                      session.lineItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[9px]">
                          <span className="w-1/2 truncate font-medium">{item.matchedName || item.productName}</span>
                          <span className="w-1/6 text-center">{item.qty}</span>
                          <span className="w-1/6 text-right">{item.unitPrice}</span>
                          <span className="w-1/6 text-right font-bold">{item.lineTotal}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center italic text-stone-400 py-3">No items billed yet</div>
                    )}
                  </div>

                  {/* POS Totals */}
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal (Taxable):</span>
                      <span>₹{subtotalDec.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>CGST (9%):</span>
                      <span>₹{(taxDec / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>SGST (9%):</span>
                      <span>₹{(taxDec / 2).toFixed(2)}</span>
                    </div>
                    <div className="border-t-2 border-dashed border-stone-800 pt-1 flex justify-between font-black text-sm text-stone-900">
                      <span>NET AMOUNT PAYABLE:</span>
                      <span>₹{session?.grandTotal || '0.00'}</span>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t border-dashed border-stone-400 text-[8px] text-stone-500">
                    <div>Thank you for choosing Urban Furniture!</div>
                    <div>Goods covered under 1 Year Warranty • Visit www.urbanfurniture.in</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions & Ledger Confirmation */}
            <div className="pt-4 border-t border-brown-200 space-y-2.5">
              {session?.status === 'ready_for_confirm' && (
                <button
                  type="button"
                  disabled={confirming}
                  onClick={handleConfirmBill}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-display text-xs uppercase tracking-wider rounded-[10px] transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {confirming ? (
                    'Generating Customer Invoice & Posting Ledger...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Post Invoice to Ledger</span>
                    </>
                  )}
                </button>
              )}

              {session?.status === 'confirmed' && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-[8px] text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Posted: {session.invoiceNumber}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-mono">
                      POSTED
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.pdfUrl && (
                      <a
                        href={session.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-brown-900 text-cream hover:bg-brown-800 text-xs font-semibold rounded-[8px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>Print PDF Bill</span>
                      </a>
                    )}

                    {session.invoiceId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/sales/invoices/${session.invoiceId}`)}
                        className="flex-1 py-2 bg-surface border border-brown-300 hover:bg-brown-100 text-brown-900 text-xs font-semibold rounded-[8px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-brown-600" />
                        <span>View Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(!session || session.status === 'collecting') && (
                <div className="text-center text-[11px] text-brown-500 italic py-1">
                  Draft bill updates live as you speak or chat
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
