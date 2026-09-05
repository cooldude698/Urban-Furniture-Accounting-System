import { isIndianName } from '../data/indianNames';

export interface ParsedSlots {
  customerName?: string;
  phone?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  isUpdate?: boolean;
  updateField?: 'quantity' | 'unitPrice' | 'customerName' | 'phone' | 'productName';
  updateNote?: { en: string; hi: string };
  rawTokens?: string[];
  // Elimination pass confidence & detection flags
  isNameInferred?: boolean;
  isPriceAssumed?: boolean;
  isQtyAssumed?: boolean;
  qtyNeedsReview?: boolean;
  priceNeedsReview?: boolean;
  discountNeedsReview?: boolean;
  confidenceNotes?: { en: string[]; hi: string[] };
  isRemoval?: boolean;
  removalTarget?: string;
}

export type SupportedLanguage = 'en' | 'hi';

// Hindi number word to digit map
const HINDI_NUMBER_WORDS: Record<string, number> = {
  // Devanagari
  'शून्य': 0,
  'ज़ीरो': 0,
  'zero': 0,
  'एक': 1,
  'दो': 2,
  'तीन': 3,
  'चार': 4,
  'पांच': 5,
  'पाँच': 5,
  'छह': 6,
  'छः': 6,
  'सात': 7,
  'आठ': 8,
  'नौ': 9,
  'दस': 10,
  'ग्यारह': 11,
  'बारह': 12,
  'तेरह': 13,
  'चौदह': 14,
  'पंद्रह': 15,
  'सोलह': 16,
  'सत्रह': 17,
  'अट्ठारह': 18,
  'उन्नीस': 19,
  'बीस': 20,
  'तीस': 30,
  'चालीस': 40,
  'पचास': 50,
  'साठ': 60,
  'सत्तर': 70,
  'अस्सी': 80,
  'नब्बे': 90,
  'सौ': 100,
  'हज़ार': 1000,
  'हजार': 1000,
  'लाख': 100000,

  // Romanized Hindi (Hinglish)
  'ek': 1,
  'do': 2,
  'teen': 3,
  'tin': 3,
  'char': 4,
  'chaar': 4,
  'panch': 5,
  'paanch': 5,
  'cheh': 6,
  'chhe': 6,
  'saat': 7,
  'sat': 7,
  'aath': 8,
  'ath': 8,
  'nau': 9,
  'das': 10,
  'dus': 10,
  'gyarah': 11,
  'barah': 12,
  'terah': 13,
  'chaudah': 14,
  'pandrah': 15,
  'solah': 16,
  'satrah': 17,
  'atharah': 18,
  'unnees': 19,
  'bees': 20,
  'tees': 30,
  'chalis': 40,
  'pachas': 50,
  'saath': 60,
  'sattar': 70,
  'assi': 80,
  'nabbe': 90,
  'sau': 100,
  'sai': 100,
  'hazar': 1000,
  'hazaar': 1000,
  'lakh': 100000,
};

// English number word to digit map
const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90,
  'hundred': 100,
  'thousand': 1000,
  'lakh': 100000,
};

export const PHONE_RELATED_WORDS = new Set<string>([
  'phone', 'mobile', 'cell', 'telephone', 'contact', 'call', 'number', 'no', 'num', 'mob', 'ph',
  'फ़ोन', 'फोन', 'मोबाइल', 'नंबर', 'कॉल', 'सम्पर्क', 'संपर्क'
]);

export const CONVERSATIONAL_STOP_WORDS = new Set<string>([
  'hello', 'hi', 'hey', 'namaste', 'namaskar', 'pranam', 'kem', 'cho', 'halo',
  'good', 'morning', 'afternoon', 'evening', 'day', 'greetings', 'howdy',
  'how', 'are', 'you', 'doing', 'whats', 'up', 'sup', 'wassup',
  'sir', 'ji', 'bro', 'brother', 'dear', 'buddy', 'friend', 'there', 'assistant', 'bot', 'bhai', 'bhaiya', 'saheb', 'sahab',
  'something', 'anything', 'nothing', 'someone', 'anyone', 'everything',
  'what', 'which', 'who', 'whom', 'where', 'when', 'why',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might',
  'do', 'does', 'did', 'done', 'doing',
  'sell', 'selling', 'sells', 'buy', 'buying', 'buys', 'order', 'orders',
  'product', 'products', 'item', 'items', 'furniture', 'goods', 'stock', 'inventory', 'catalog', 'catalogue',
  'show', 'tell', 'suggest', 'give', 'list', 'display', 'view',
  'please', 'plz', 'help', 'assist', 'support', 'thanks', 'thank', 'thx', 'welcome',
  'yes', 'no', 'ok', 'okay', 'fine', 'sure', 'alright',
  'have', 'has', 'had', 'available', 'avail',
  'phone', 'mobile', 'cell', 'telephone', 'contact', 'call', 'number', 'mob', 'ph',
  // Hindi / Hinglish
  'नमस्ते', 'नमस्कार', 'प्रणाम', 'हेलो', 'हाय', 'सुप्रभात', 'शुभ', 'संध्या', 'केम', 'छो',
  'क्या', 'कैसे', 'कहाँ', 'कब', 'कौन', 'बताओ', 'दिखाओ', 'सामान', 'चीज़', 'चीज', 'चीजें',
  'बेचते', 'बेचना', 'मिलता', 'मिलते', 'खरीदना', 'चाहिए', 'उपलब्ध', 'लिस्ट',
  'धन्यवाद', 'शुक्रिया', 'मदद', 'सहायता', 'जी', 'भाई', 'साहब', 'दोस्त',
  'फ़ोन', 'फोन', 'मोबाइल', 'नंबर', 'कॉल', 'सम्पर्क', 'संपर्क',
  'haan', 'nahi', 'kya', 'kaise', 'kaha', 'kab', 'batao', 'dikhao', 'saman', 'cheez',
  'bechte', 'milta', 'kharidna', 'shukriya', 'dhanyawad', 'madad'
]);

export class VoiceBillParser {
  /**
   * Detect language based on presence of Devanagari Unicode block (U+0900 to U+097F)
   */
  static detectLanguage(text: string): SupportedLanguage {
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text) ? 'hi' : 'en';
  }

  /**
   * Identifies polite greetings and pleasantries without product billing intent
   */
  static isGreeting(text: string): boolean {
    const clean = text.trim().toLowerCase();
    // Common furniture purchase keywords to ensure "hi 2 chairs" is not treated as a pure greeting
    const purchaseWords = /(?:desk|chair|table|sofa|planks|plank|wood|bed|cabinet|shelf|price|qty|quantity|phone|mobile|order|buy|bill|invoice|डेस्क|कुर्सी|टेबल|सोफा|तख्ता|खाट|अलमारी|कीमत|मात्रा|फ़ोन|बिल|खरीदना)/i;
    if (purchaseWords.test(clean) || /\d+/.test(clean)) {
      return false;
    }

    // Direct exact or common composite greeting regex
    const greetingPattern = /^(?:hello|hi|hey|hey there|hi there|namaste|namaskar|pranam|good morning|good afternoon|good evening|good day|how are you|how are you doing|howdy|greetings|what's up|sup|wassup|नमस्ते|नमस्कार|प्रणाम|हेलो|हाय|सुप्रभात|शुभ संध्या|केम छो|kem cho)(?:\s+(?:sir|ji|bro|brother|there|assistant|bot|friend|buddy|bhai|bhaiya|saheb|sahab|team|everyone|how are you|how are you doing|doing well))?[\s!,.]*$/i;
    if (greetingPattern.test(clean)) {
      return true;
    }

    // Token check: If every word is a greeting or honorific/pleasantry
    const greetingTokens = new Set([
      'hello', 'hi', 'hey', 'namaste', 'namaskar', 'pranam', 'kem', 'cho', 'halo',
      'good', 'morning', 'afternoon', 'evening', 'day', 'greetings',
      'how', 'are', 'you', 'doing', 'whats', 'up', 'sup', 'wassup',
      'sir', 'ji', 'bro', 'brother', 'dear', 'buddy', 'friend', 'there', 'assistant', 'bot', 'bhai', 'bhaiya', 'saheb', 'sahab',
      'or', 'something', 'anyone', 'someone', 'here',
      'नमस्ते', 'नमस्कार', 'प्रणाम', 'हेलो', 'हाय', 'सुप्रभात', 'शुभ', 'संध्या', 'केम', 'छो', 'जी', 'भाई', 'साहब'
    ]);

    const words = clean.replace(/[^a-z\u0900-\u097F\s]/gi, ' ').trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0 && words.length <= 5) {
      const hasGreetingWord = words.some(w => ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'pranam', 'halo', 'नमस्ते', 'नमस्कार', 'प्रणाम', 'हेलो', 'हाय'].includes(w));
      if (hasGreetingWord && words.every(w => greetingTokens.has(w))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identifies questions or requests to see the product catalog / what the store sells
   */
  static isCatalogInquiry(text: string): boolean {
    const clean = text.trim().toLowerCase();
    const inquiryPatterns = [
      /what\s+(?:products|items|furniture|goods)\s+(?:do\s+you\s+sell|do\s+you\s+have|are\s+available)/i,
      /what\s+(?:do\s+you\s+sell|do\s+you\s+have)/i,
      /what\s+can\s+i\s+(?:buy|order)/i,
      /show\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?(?:products|items|catalog|furniture|inventory|list)/i,
      /tell\s+me\s+(?:what\s+you\s+sell|the\s+products|the\s+items|about\s+your\s+products)/i,
      /list\s+(?:of\s+)?(?:all\s+)?(?:products|items|furniture)/i,
      /suggest\s+(?:me\s+)?(?:some\s+)?(?:products|furniture|items)/i,
      /available\s+(?:products|items|furniture)/i,
      /(?:kya\s+kya|kya)\s+(?:bechte\s+ho|milta\s+hai|products\s+hai|items\s+hai|saman\s+hai)/i,
      /(?:products|items|saman|furniture)\s+(?:dikhao|batao|list)/i,
      /kya\s+saman\s+hai/i,
      /(?:क्या\s*क्या|क्या|कौंस-सा|कौन\s*से|क्या-क्या)\s*(?:सामान|उत्पाद|आइटम|फ़र्निचर)?\s*(?:है|हैं|बेचते\s*हो|मिलता\s*है|उपलब्ध\s*है)/i,
      /(?:सामान|उत्पाद|आइटम|फ़र्निचर|कैटलॉग)\s*(?:दिखाओ|बताओ|लिस्ट)/i,
      /क्या\s*बेचते\s*हो/i,
    ];
    return inquiryPatterns.some(p => p.test(clean));
  }

  /**
   * Identifies help requests
   */
  static isHelp(text: string): boolean {
    const clean = text.trim().toLowerCase();
    return /^(?:help|assist|info|support|guide|how to use|how does this work|मदद|सहायता|गाइड|कैसे करें|क्या कर सकते हो)[\s!?.]*$/i.test(clean);
  }

  /**
   * Identifies thank you / gratitude expressions
   */
  static isThanks(text: string): boolean {
    const clean = text.trim().toLowerCase();
    return /^(?:thank you|thanks|thank you so much|thx|धन्यवाद|शुक्रिया|बहुत धन्यवाद|shukriya|dhanyawad)[\s!,.]*$/i.test(clean);
  }

  /**
   * Identifies intent to settle or confirm the bill into the database
   */
  static isSettleOrConfirm(text: string): boolean {
    const clean = text.trim().toLowerCase();
    const patterns = [
      /^(?:settle|confirm|finalize|done|pay|pay now|checkout|कन्फर्म|सेटल|पक्का|भुगतान)[\s!.]*$/i,
      /^(?:settle|confirm|finalize|pay)\s+(?:the\s+)?(?:bill|invoice|account|payment|order)[\s!.]*$/i,
      /^(?:bill|invoice)\s+(?:settle|confirm|finalize|pay)(?:\s+(?:kardo|karo|kijiye))?[\s!.]*$/i,
      /^(?:please\s+)?(?:settle|confirm|finalize|pay)\s+(?:the\s+)?(?:bill|invoice)[\s!.]*$/i,
      /^(?:okay|ok|yes|haan|ha|haa)?[\s,.]*(?:settle|confirm|finalize)\s+(?:the\s+)?(?:bill|invoice)?[\s!.]*$/i,
      /(?:बिल|इनवॉइस)\s*(?:सेटल|कन्फर्म|पक्का|फाइनल|पास)\s*(?:करो|कर\s*दो|कर\s*दीजिए|कीजिए|हो\s*गया)/i,
      /(?:सेटल|कन्फर्म|पक्का)\s*(?:करो|कर\s*दो|कर\s*दीजिए|कीजिए)/i,
    ];
    return patterns.some(p => p.test(clean));
  }

  /**
   * Converts word tokens or digits into a numeric value
   */
  static parseNumberToken(token: string): number | null {
    if (!token) return null;
    const clean = token.toLowerCase().trim().replace(/,/g, '');

    // Direct numeric string
    if (/^\d+(\.\d+)?$/.test(clean)) {
      return parseFloat(clean);
    }

    // Single Hindi or English word
    if (HINDI_NUMBER_WORDS[clean] !== undefined) {
      return HINDI_NUMBER_WORDS[clean];
    }
    if (ENGLISH_NUMBER_WORDS[clean] !== undefined) {
      return ENGLISH_NUMBER_WORDS[clean];
    }

    return null;
  }

  /**
   * Converts Devanagari numerals (०-९) to standard ASCII digits (0-9)
   */
  static normalizeDigits(text: string): string {
    const devanagariDigits: Record<string, string> = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    };
    return text.replace(/[०-९]/g, d => devanagariDigits[d] || d);
  }

  /**
   * Checks if text contains any digit or recognized number word (Hindi or English)
   */
  static hasNumberWord(text: string): boolean {
    if (/\d+/.test(text) || /[०-९]/.test(text)) return true;
    const words = text.toLowerCase().split(/[\s,.:;!?]+/);
    return words.some(w => HINDI_NUMBER_WORDS[w] !== undefined || ENGLISH_NUMBER_WORDS[w] !== undefined);
  }

  /**
   * Robust phone number extraction:
   * Handles 10-13 digits, +91 prefixes, spaces/dashes, Devanagari numerals, and spoken number words
   */
  static extractPhoneNumber(text: string): string | null {
    if (!text) return null;
    let normalized = this.normalizeDigits(text);
    normalized = this.normalizeNumberWordsInText(normalized);

    // 1. Explicit phone anchor e.g. phone: 9876543210 or mobile 98765 43210
    const anchorMatch = normalized.match(
      /(?:phone|number|mobile|contact|फ़ोन|फोन|नंबर|मोबाइल|mob)[\s:=]*(\+?91[\s-]?)?(\d[\d\s-]{8,14}\d)/i
    );
    if (anchorMatch) {
      const digits = anchorMatch[2].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) {
        return digits.slice(-10);
      }
    }

    // 2. Any contiguous or hyphen/space separated 10-13 digit number
    const phonePattern = /(?:^|(?<=[\s,.:;]))(?:\+?91[\s-]?)?(\d[\d\s-]{8,14}\d)(?=[\s,.:;]|$)/g;
    for (const match of normalized.matchAll(phonePattern)) {
      const digits = match[1].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) {
        return digits.slice(-10);
      }
    }

    // 3. Raw digits anywhere in the message (if 10 to 13 digits total)
    const rawDigits = normalized.replace(/\D/g, '');
    if (rawDigits.length >= 10 && rawDigits.length <= 13) {
      return rawDigits.slice(-10);
    }

    return null;
  }

  /**
   * Replaces multi-word numbers like "five hundred", "दो सौ", "panch hazar" with digits
   */
  static normalizeNumberWordsInText(text: string): string {
    let result = text;

    // Composite multipliers e.g. "5 hundred" -> 500, "दो हज़ार" -> 2000
    const compositePatterns = [
      // <number> सौ / sau / hundred
      { regex: /(?:^|(?<=[\s,.:;]))(\d+|[a-zA-Z\u0900-\u097F]+)\s+(?:सौ|sau|hundred)(?=[\s,.:;]|$)/gi, mult: 100 },
      // <number> हज़ार / हजार / hazar / hazaar / thousand
      { regex: /(?:^|(?<=[\s,.:;]))(\d+|[a-zA-Z\u0900-\u097F]+)\s+(?:हज़ार|हजार|hazar|hazaar|thousand)(?=[\s,.:;]|$)/gi, mult: 1000 },
      // <number> लाख / lakh
      { regex: /(?:^|(?<=[\s,.:;]))(\d+|[a-zA-Z\u0900-\u097F]+)\s+(?:लाख|lakh)(?=[\s,.:;]|$)/gi, mult: 100000 },
    ];

    for (const comp of compositePatterns) {
      result = result.replace(comp.regex, (match, numPart) => {
        const val = this.parseNumberToken(numPart);
        if (val !== null) {
          return String(val * comp.mult);
        }
        return match;
      });
    }

    // Individual standalone words
    const words = result.split(/\s+/);
    const mapped = words.map((w, idx) => {
      const prevWord = idx > 0 ? words[idx - 1].toLowerCase() : '';
      // If word is 'दो' or 'do' and previous word is 'कर' or 'kar', it is the verb "kar do" (make/do it), not the number 2
      if ((w === 'दो' && prevWord === 'कर') || (w.toLowerCase() === 'do' && prevWord === 'kar')) {
        return w;
      }
      const num = this.parseNumberToken(w);
      // Only replace if it was a recognized word and not already pure digits
      if (num !== null && (HINDI_NUMBER_WORDS[w.toLowerCase()] !== undefined || ENGLISH_NUMBER_WORDS[w.toLowerCase()] !== undefined)) {
        return String(num);
      }
      return w;
    });

    return mapped.join(' ');
  }

  /**
   * Main deterministic parsing method
   */
  static parse(inputText: string, knownProductNames?: string[]): ParsedSlots {
    const slots: ParsedSlots = {};
    if (!inputText || !inputText.trim()) {
      return slots;
    }

    // If pure greeting, catalog inquiry, help, or thanks, never extract invoice slots
    if (
      this.isGreeting(inputText) ||
      this.isCatalogInquiry(inputText) ||
      this.isHelp(inputText) ||
      this.isThanks(inputText)
    ) {
      return slots;
    }

    const normalizedText = this.normalizeNumberWordsInText(inputText);
    const trimmed = normalizedText.trim();

    // 0a. Check for standalone 0 or quantity set to 0 (user wants to cancel/remove item)
    if (
      /^(?:0|zero|shunya|शून्य|ज़ीरो)$/i.test(trimmed) ||
      /^(?:change|update|make|set)?\s*(?:quantity|qty|मात्रा)\s*(?:to|=|\s|को)?\s*(?:0|zero|शून्य)\s*(?:कर\s*दो|kardo)?$/i.test(trimmed)
    ) {
      slots.quantity = 0;
      slots.isUpdate = true;
      slots.updateField = 'quantity';
      slots.isRemoval = true;
      slots.updateNote = {
        en: 'Quantity set to 0 (item removed)',
        hi: 'मात्रा 0 कर दी गई (उत्पाद हटा दिया गया)',
      };
      return slots;
    }

    // 0b. Check for removal/deletion intent:
    // e.g. "remove chair", "delete item", "chair hata do", "हटा दो", "remove", "delete"
    const removeMatch = trimmed.match(
      /^(?:remove|delete|cancel|clear item|hata\s*do|hatao|nikal\s*do|हटा\s*दो|हटाओ|निकाल\s*दो|हटाएं|रद्द\s*करें)(?:\s+(.+))?$/i
    ) || trimmed.match(
      /^(.+?)\s+(?:hata\s*do|hatao|nikal\s*do|हटा\s*दो|हटाओ|निकाल\s*दो)$/i
    );

    if (removeMatch) {
      slots.isRemoval = true;
      slots.removalTarget = (removeMatch[1] || '').trim();
      return slots;
    }

    // 1. Check for update/correction patterns first:
    // e.g. "change quantity to 4", "make qty 3", "मात्रा 4 कर दो", "quantity ko 5 kardo"
    const updateQtyMatch = normalizedText.match(
      /(?:change|update|make|set)\s+(?:quantity|qty|kitne|मात्रा)\s+(?:to|=|\s)\s*(\d+)/i
    ) || normalizedText.match(
      /(?:मात्रा|quantity|qty)\s*(?:को|to)?\s*(\d+)\s*(?:कर\s*दो|kardo|karo|करो)/i
    );

    if (updateQtyMatch) {
      const qty = parseInt(updateQtyMatch[1], 10);
      if (!isNaN(qty) && qty > 0) {
        slots.quantity = qty;
        slots.isUpdate = true;
        slots.updateField = 'quantity';
        slots.updateNote = {
          en: `Quantity updated to ${qty}`,
          hi: `मात्रा बदलकर ${qty} कर दी गई`,
        };
        return slots;
      }
    }

    const updatePriceMatch = normalizedText.match(
      /(?:change|update|make|set)\s+(?:price|rate|कीमत|दाम)\s+(?:to|=|\s)\s*(\d+(?:\.\d+)?)/i
    ) || normalizedText.match(
      /(?:कीमत|दाम|price|rate)\s*(?:को|to)?\s*(\d+(?:\.\d+)?)\s*(?:कर\s*दो|kardo|karo|करो)/i
    );

    if (updatePriceMatch) {
      const price = parseFloat(updatePriceMatch[1]);
      if (!isNaN(price) && price > 0) {
        slots.unitPrice = price;
        slots.isUpdate = true;
        slots.updateField = 'unitPrice';
        slots.updateNote = {
          en: `Unit price updated to ₹${price.toFixed(2)}`,
          hi: `प्रति यूनिट कीमत बदलकर ₹${price.toFixed(2)} कर दी गई`,
        };
        return slots;
      }
    }

    // 2. Extract Phone Number
    const detectedPhone = this.extractPhoneNumber(inputText);
    if (detectedPhone) {
      slots.phone = detectedPhone;
    }

    // 3. Extract Customer Name
    // Anchors: customer, client, name, naam, naam hai, नाम, ग्राहक, कस्टमर
    const nameAnchorMatch = normalizedText.match(
      /(?:(?:customer|client|ग्राहक|कस्टमर)\s*(?:name|naam|नाम)?\s*(?:is|hai|he|है|हो)?[\s:=]+|(?:name|naam|नाम)\s*(?:is|hai|he|है|हो)?[\s:=]+|for\s+|के\s*लिए\s+)([A-Za-z\u0900-\u097F\s]{2,30}?)(?=(?:,|\.|\bphone|\bnumber|\bmobile|\bqty|\bquantity|\bprice|\brate|\bproduct|\badd|फ़ोन|फोन|मोबाइल|मात्रा|कीमत|दाम|जोड़ो|डालो|$))/i
    );

    if (nameAnchorMatch) {
      const extracted = nameAnchorMatch[1].trim();
      // Ensure it doesn't accidentally capture purely numbers or keywords
      if (extracted.length >= 2 && !/^\d+$/.test(extracted)) {
        slots.customerName = extracted;
      }
    }

    // Direct Indian Name Match (if no anchor was used, e.g. user said "rahul 5" or just "rahul")
    if (!slots.customerName) {
      const words = normalizedText.split(/[\s,.:;!?]+/).filter(w => w.length >= 2);
      for (let i = 0; i < words.length; i++) {
        if (isIndianName(words[i])) {
          let detectedName = this.capitalizeWords(words[i]);
          if (i + 1 < words.length && isIndianName(words[i + 1])) {
            detectedName += ' ' + this.capitalizeWords(words[i + 1]);
          }
          slots.customerName = detectedName;
          slots.isNameInferred = true;
          break;
        }
      }
    }

    // 4. Extract Discount
    // Anchors: discount, off, छूट, कमी
    const discountMatch = normalizedText.match(
      /(?:discount|off|छूट|कमी)[\s:=]*(\d+(?:\.\d+)?)\s*(?:%|percent|प्रतिशत|pratishat)?\b/i
    ) || normalizedText.match(
      /(\d+(?:\.\d+)?)\s*(?:%|percent|प्रतिशत)\s*(?:discount|off|छूट)?\b/i
    );

    if (discountMatch) {
      const disc = parseFloat(discountMatch[1]);
      if (!isNaN(disc) && disc >= 0 && disc <= 100) {
        slots.discountPercent = disc;
      }
    }

    // 5. Extract Price / Rate
    // Anchors: price, rate, rupees, rs, inr, कीमत, दाम, रुपये, रुपए, भाव, rupaye, rupya
    const priceMatch = normalizedText.match(
      /(?:price|rate|कीमत|दाम|भाव|at|at\s*rate)[\s:=]*(?:₹|rs\.?|inr|रुपये|रुपए|rupaye)?\s*(\d+(?:\.\d+)?)(?=[\s,.:;]|$)/i
    ) || normalizedText.match(
      /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)(?=[\s,.:;]|$)/i
    ) || normalizedText.match(
      /(?:^|(?<=[\s,.:;]))(\d+(?:\.\d+)?)\s*(?:rupees|rupaye|रुपये|रुपए|rs)(?=[\s,.:;]|$)/i
    );

    if (priceMatch) {
      const p = parseFloat(priceMatch[1]);
      // Avoid interpreting phone numbers or astronomical values as price (< 1 Crore)
      if (!isNaN(p) && p > 0 && p < 10000000 && String(p) !== slots.phone && (!slots.phone || !String(p).includes(slots.phone))) {
        slots.unitPrice = p;
      }
    }

    // 6. Extract Quantity
    // Anchors: qty, quantity, pieces, pcs, piece, kitne, kitna, मात्रा, कितने, कितना, नग, पीस
    const qtyAnchorMatch = normalizedText.match(
      /(?:qty|quantity|kitne|kitna|मात्रा|कितने|कितना|pieces|pcs|नग|पीस)[\s:=]*(\d+)(?=[\s,.:;]|$)/i
    ) || normalizedText.match(
      /(?:^|(?<=[\s,.:;]))(\d+)\s*(?:qty|pieces|pcs|piece|नग|पीस|items?|units?)(?=[\s,.:;]|$)/i
    );

    if (qtyAnchorMatch) {
      const q = parseInt(qtyAnchorMatch[1], 10);
      if (!isNaN(q) && q > 0 && String(q) !== slots.phone && q !== slots.unitPrice) {
        slots.quantity = q;
      }
    }

    // 7. Extract Product
    // Anchors: add, जोड़ो, डालो, chahiye, खरीदना, product, item, उत्पाद
    const productAnchorMatch = normalizedText.match(
      /(?:add|jo(?:d|r)o|dalo|खरीदना|चाहिए|जोड़ो|डालो|product|item|उत्पाद)[\s:=]+([A-Za-z\u0900-\u097F\s]{2,40}?)(?=(?:,|\.|\bprice|\brate|\bqty|\bquantity|\bpieces|\bdiscount|\bphone|\bfor|कीमत|दाम|मात्रा|छूट|फ़ोन|के\s*लिए|$))/i
    );

    if (productAnchorMatch) {
      const pName = productAnchorMatch[1].trim();
      if (pName.length >= 2 && !/^\d+$/.test(pName)) {
        slots.productName = pName;
      }
    }

    // Fallback product detection 1: If there is a pattern like "<qty> <product> at <price>"
    // e.g. "2 Teak Desk price 5000" or "दो टीक डेस्क कीमत 5000"
    if (!slots.productName) {
      const patternMatch = normalizedText.match(
        /(?:^|\s)(\d+)\s+([A-Za-z\u0900-\u097F\s]{2,30}?)(?=(?:\s+(?:price|rate|कीमत|दाम|rupees|rupaye|at|for|के\s*लिए|with|with\s*discount)(?=[\s,.:;]|$))|\s*[,.]|$)/i
      );
      if (patternMatch) {
        const potentialQty = parseInt(patternMatch[1], 10);
        const potentialProd = patternMatch[2].trim();
        const stopWords = [
          'customer', 'phone', 'name', 'ग्राहक', 'फ़ोन', 'नाम', 'mobile', 'discount', 'छूट',
          'pieces', 'pcs', 'piece', 'पीस', 'नग', 'मात्रा', 'qty', 'items', 'item', 'unit', 'units'
        ];
        if (
          !stopWords.includes(potentialProd.toLowerCase()) &&
          potentialProd.length >= 3 &&
          !/^\d+$/.test(potentialProd) &&
          potentialQty < 10000 &&
          String(potentialQty) !== slots.phone &&
          !/^\d{10}$/.test(patternMatch[1])
        ) {
          if (!slots.quantity) slots.quantity = potentialQty;
          slots.productName = potentialProd;
        }
      }
    }

    // Fallback product detection 2: If there is a pattern like "<product> price <price>" (no leading quantity)
    // e.g. "Teak Desk price 6000" or "टीक डेस्क कीमत 6000"
    if (!slots.productName) {
      const prodBeforePriceMatch = normalizedText.match(
        /(?:^|[\s,.:;])([A-Za-z\u0900-\u097F\s]{2,30}?)(?=(?:\s+(?:price|rate|कीमत|दाम|भाव|rupees|rupaye|at|for|के\s*लिए)(?=[\s,.:;]|$)))/i
      );
      if (prodBeforePriceMatch) {
        const potentialProd = prodBeforePriceMatch[1].trim();
        const stopWords = ['customer', 'phone', 'name', 'ग्राहक', 'फ़ोन', 'नाम', 'mobile', 'discount', 'छूट', 'qty', 'quantity', 'मात्रा'];
        if (
          !stopWords.includes(potentialProd.toLowerCase()) &&
          potentialProd.length >= 3 &&
          !/^\d+$/.test(potentialProd)
        ) {
          slots.productName = potentialProd;
        }
      }
    }

    // If still no product, check if the whole input is just a short product name answering a follow up
    // (e.g. user answered "Teak Desk" or "Oak Wood Planks")
    const trimmedInput = inputText.trim();
    if (
      !slots.productName &&
      !slots.phone &&
      !slots.unitPrice &&
      !slots.customerName &&
      !slots.quantity &&
      trimmedInput.length >= 3 &&
      trimmedInput.split(/\s+/).length <= 4 &&
      !/^\d+$/.test(trimmedInput)
    ) {
      const inputWords = trimmedInput.toLowerCase().split(/[\s,.:;!?]+/).filter(w => w.length > 0);
      const isConversational = inputWords.some(w => CONVERSATIONAL_STOP_WORDS.has(w));
      const hasPhoneKeyword = inputWords.some(w => PHONE_RELATED_WORDS.has(w)) ||
        /(?:phone|mobile|cell|telephone|contact|call|number|no|mob|ph|फ़ोन|फोन|मोबाइल|नंबर)/i.test(trimmedInput) ||
        /\d{4,}/.test(trimmedInput);
      const hasIndianName = inputWords.some(w => isIndianName(w));

      if (hasIndianName && !slots.customerName) {
        slots.customerName = this.capitalizeWords(trimmedInput);
        slots.isNameInferred = true;
      } else if (hasPhoneKeyword) {
        const ph = this.extractPhoneNumber(trimmedInput);
        if (ph) {
          slots.phone = ph;
        }
      } else if (!isConversational && !hasIndianName && !hasPhoneKeyword) {
        slots.productName = trimmedInput;
      }
    }

    // 8. ELIMINATION PASS (Runs only for slots that remain unfilled, on anchor-free positional inputs)
    const hasMissingSlots =
      !slots.phone || !slots.customerName || !slots.productName || !slots.quantity || !slots.unitPrice;
    if (hasMissingSlots && !slots.isUpdate) {
      this.runEliminationPass(normalizedText, slots, knownProductNames);
    }

    return slots;
  }

  /**
   * Fast trigram similarity calculation (equivalent to pg_trgm similarity)
   */
  static trigramSimilarity(s1: string, s2: string): number {
    if (!s1 || !s2) return 0;
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0;

    const getTrigrams = (str: string): Set<string> => {
      const padded = `  ${str} `;
      const set = new Set<string>();
      for (let i = 0; i < padded.length - 2; i++) {
        set.add(padded.substring(i, i + 3));
      }
      return set;
    };

    const t1 = getTrigrams(a);
    const t2 = getTrigrams(b);
    let common = 0;
    for (const tri of t1) {
      if (t2.has(tri)) common++;
    }
    const union = t1.size + t2.size - common;
    return union === 0 ? 0 : common / union;
  }

  /**
   * Capitalizes first letter of each word in a string
   */
  static capitalizeWords(str: string): string {
    return str
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Elimination Pass: Deterministically classifies remaining unconsumed tokens in exact priority order:
   * 1. Phone (10-13 digit regex)
   * 2. Numbers (magnitude disambiguation: >= 100 -> unitPrice, < 100 -> quantity). Strictly cap unitPrice < 10,000,000.
   * 3. Customer Name (match against bundled static Indian first names list)
   * 4. Product (fuzzy matching against Product Master / catalog)
   * 5. Leftovers (remain unclassified, triggering targeted slot follow-ups)
   */
  static runEliminationPass(normalizedText: string, slots: ParsedSlots, knownProductNames?: string[]): void {
    let workingText = normalizedText;

    // Remove tokens already consumed in Pass 1 to prevent double-matching
    if (slots.phone) {
      workingText = workingText.replace(/(?:^|(?<=[\s,.:;]))(?:\+?91[\s-]?)?\d{10,13}(?=[\s,.:;]|$)/g, ' ');
      workingText = workingText.replace(new RegExp(`(?:\\+?91[\\s-]?)?${slots.phone}`, 'g'), ' ');
    }
    if (slots.customerName) {
      const escaped = slots.customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      workingText = workingText.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ');
    }
    if (slots.productName) {
      const escaped = slots.productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      workingText = workingText.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ');
    }
    if (slots.quantity !== undefined) {
      workingText = workingText.replace(new RegExp(`(?:^|(?<=[\\s,.:;]))${slots.quantity}(?=[\\s,.:;]|$)`, 'g'), ' ');
    }
    if (slots.unitPrice !== undefined) {
      workingText = workingText.replace(new RegExp(`(?:^|(?<=[\\s,.:;]))${slots.unitPrice}(?=[\\s,.:;]|$)`, 'g'), ' ');
    }
    if (slots.discountPercent !== undefined) {
      workingText = workingText.replace(new RegExp(`(?:^|(?<=[\\s,.:;]))${slots.discountPercent}%?`, 'g'), ' ');
    }

    // Strip common filler, greetings, inquiry and anchor keywords
    workingText = workingText
      .replace(/\b(for|to|at|with|and|ko|hai|he|ke|liye|chahiye|dalo|jodo|add|customer|client|name|naam|phone|mobile|number|qty|quantity|price|rate|discount|hello|hi|hey|namaste|namaskar|help|thanks|thank|you|shukriya|dhanyawad|what|which|sell|buy|product|products|item|items|furniture|sir|bro|there|something|anything)\b/gi, ' ')
      .replace(/(?:के\s*लिए|को|है|चाहिए|डालो|जोड़ो|ग्राहक|नाम|फ़ोन|फोन|मोबाइल|नंबर|मात्रा|कीमत|दाम|छूट|नमस्ते|नमस्कार|हेलो|हाय|धन्यवाद|शुक्रिया|मदद|सहायता|सामान|चीज़|बेचते|बताओ|दिखाओ)/g, ' ');

    // --- STEP 1: Phone (10-13 digit regex) ---
    if (!slots.phone) {
      const p = this.extractPhoneNumber(workingText);
      if (p) {
        slots.phone = p;
        workingText = workingText.replace(new RegExp(`(?:\\+?91[\\s-]?)?${p}`, 'g'), ' ');
      }
    }

    // --- STEP 2: Numbers (Magnitude Disambiguation: >= 100 -> price, < 100 -> quantity) ---
    // Strictly cap price < 10,000,000 (1 Crore). Numbers with >= 10 digits or >= 10,000,000 are NEVER unit prices.
    if (!slots.unitPrice || !slots.quantity) {
      const numberMatches = Array.from(
        workingText.matchAll(/(?:^|(?<=[\s,.:;]))(\d+(?:\.\d+)?)(?=[\s,.:;]|$)/g)
      );

      for (const m of numberMatches) {
        const rawDigits = m[1].replace(/\D/g, '');
        const val = parseFloat(m[1]);
        if (isNaN(val) || val <= 0) continue;

        // If >= 10 digits or >= 10,000,000, treat as phone if needed, never as unit price
        if (rawDigits.length >= 10 || val >= 10000000) {
          if (!slots.phone && rawDigits.length >= 10) {
            slots.phone = rawDigits.slice(-10);
          }
          workingText = workingText.replace(m[0], ' ');
          continue;
        }

        if (val >= 100 && !slots.unitPrice) {
          slots.unitPrice = val;
          slots.isPriceAssumed = true;
          workingText = workingText.replace(m[0], ' ');
        } else if (val < 100 && !slots.quantity) {
          slots.quantity = Math.round(val);
          slots.isQtyAssumed = true;
          workingText = workingText.replace(m[0], ' ');
        }
      }
    }

    // --- STEP 3: Product Match (Catalog fuzzy matching) ---
    if (!slots.productName) {
      // 3a. Check Hindi transliterated keywords first
      const hindiMap: Record<string, string> = {
        'टीक डेस्क': 'Teak Desk',
        'टीक': 'Teak Desk',
        'डेस्क': 'Desk',
        'ओक वुड तख्ता': 'Oak Wood Planks',
        'ओक वुड': 'Oak Wood Planks',
        'ओक': 'Oak Wood Planks',
        'लकड़ी तख्ता': 'Oak Wood Planks',
        'तख्ता': 'Planks',
        'कुर्सी': 'Office Chair',
        'टेबल': 'Dining Table',
        'मेज़': 'Desk',
        'सोफा': 'Sofa',
        'अलमारी': 'Wooden Bookshelf',
      };

      const sortedHindiKeys = Object.keys(hindiMap).sort((a, b) => b.length - a.length);
      for (const hk of sortedHindiKeys) {
        if (workingText.includes(hk)) {
          slots.productName = hindiMap[hk];
          workingText = workingText.replace(hk, ' ');
          break;
        }
      }

      // 3b. If still not matched, check known catalog products
      if (!slots.productName) {
        const defaultCatalog = [
          'Oak Wood Planks',
          'Custom Executive Teak Desk',
          'Teak Desk',
          'Ergonomic Office Chair',
          'Dining Table',
          'Conference Table',
          'Wooden Bookshelf',
          'Office Chair',
        ];
        const catalog = Array.from(new Set([...(knownProductNames || []), ...defaultCatalog]));
        const sortedCatalog = [...catalog].sort((a, b) => b.length - a.length);

        // Substring / direct match (case-insensitive)
        const lowerWorking = workingText.toLowerCase();
        for (const prod of sortedCatalog) {
          const lowerProd = prod.toLowerCase();
          if (lowerWorking.includes(lowerProd)) {
            slots.productName = prod;
            workingText = workingText.replace(new RegExp(prod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
            break;
          }
        }

        // Trigram / multi-word candidate matching
        if (!slots.productName) {
          const cleanTokens = workingText
            .trim()
            .split(/\s+/)
            .filter(t => t.length > 0 && !/^\d+$/.test(t) && !CONVERSATIONAL_STOP_WORDS.has(t.toLowerCase()) && !isIndianName(t));
          let bestScore = 0;
          let bestProduct: string | null = null;
          let bestCandidateWords: string[] = [];

          // Try word n-grams of lengths 4, 3, 2, 1
          for (let len = Math.min(4, cleanTokens.length); len >= 1; len--) {
            for (let i = 0; i <= cleanTokens.length - len; i++) {
              const candidate = cleanTokens.slice(i, i + len).join(' ');
              if (candidate.length < 3) continue;

              for (const prod of sortedCatalog) {
                const score = this.trigramSimilarity(candidate, prod);
                const candWords = candidate.toLowerCase().split(/\s+/);
                const prodWords = prod.toLowerCase().split(/\s+/);
                const allWordsMatch =
                  candWords.length >= 2 &&
                  candWords.every(cw => prodWords.some(pw => pw.includes(cw) || cw.includes(pw)));

                const effectiveScore = allWordsMatch ? Math.max(score, 0.8) : score;

                if (effectiveScore > bestScore && effectiveScore >= 0.45) {
                  bestScore = effectiveScore;
                  bestProduct = prod;
                  bestCandidateWords = cleanTokens.slice(i, i + len);
                }
              }
            }
          }

          if (bestProduct && bestScore >= 0.45) {
            slots.productName = bestProduct;
            const candidateStr = bestCandidateWords.join(' ');
            workingText = workingText.replace(new RegExp(candidateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
          }
        }
      }
    }

    // --- STEP 4: Customer Name (Match against bundled static Indian first names list) ---
    if (!slots.customerName) {
      const remainingTokens = workingText
        .trim()
        .split(/\s+/)
        .filter(t => t.length > 0 && !/^\d+$/.test(t));

      for (let i = 0; i < remainingTokens.length; i++) {
        const token = remainingTokens[i];
        if (isIndianName(token)) {
          let nameToSet = this.capitalizeWords(token);
          let consumedCount = 1;

          // Check if next token is also a recognized Indian name/surname
          if (i + 1 < remainingTokens.length && isIndianName(remainingTokens[i + 1])) {
            nameToSet = `${this.capitalizeWords(token)} ${this.capitalizeWords(remainingTokens[i + 1])}`;
            consumedCount = 2;
          }

          slots.customerName = nameToSet;
          slots.isNameInferred = true;

          // Remove consumed tokens from remainingTokens
          remainingTokens.splice(i, consumedCount);
          break;
        }
      }

      // --- STEP 5: Leftovers (Remain unclassified) ---
      if (remainingTokens.length > 0) {
        slots.rawTokens = remainingTokens;
      }
    } else {
      // Customer name was already present; check leftovers
      const remainingTokens = workingText
        .trim()
        .split(/\s+/)
        .filter(t => t.length > 0 && !/^\d+$/.test(t));
      if (remainingTokens.length > 0) {
        slots.rawTokens = remainingTokens;
      }
    }

    // Populate confidenceNotes
    const enNotes: string[] = [];
    const hiNotes: string[] = [];

    if (slots.isNameInferred && slots.customerName) {
      enNotes.push(`Name "${slots.customerName}" (detected — tap to correct)`);
      hiNotes.push(`नाम "${slots.customerName}" (पहचाना गया — सुधार के लिए टैप करें)`);
    }
    if (slots.isQtyAssumed && slots.quantity) {
      enNotes.push(`Quantity ${slots.quantity} (assumed — please confirm)`);
      hiNotes.push(`मात्रा ${slots.quantity} (मानी गई — कृपया पुष्टि करें)`);
    }
    if (slots.isPriceAssumed && slots.unitPrice) {
      enNotes.push(`Price ₹${slots.unitPrice} (assumed — please confirm)`);
      hiNotes.push(`कीमत ₹${slots.unitPrice} (मानी गई — कृपया पुष्टि करें)`);
    }

    if (enNotes.length > 0) {
      slots.confidenceNotes = {
        en: enNotes,
        hi: hiNotes,
      };
    }
  }
}
