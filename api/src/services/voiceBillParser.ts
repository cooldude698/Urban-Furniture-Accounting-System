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
}

export type SupportedLanguage = 'en' | 'hi';

// Hindi number word to digit map
const HINDI_NUMBER_WORDS: Record<string, number> = {
  // Devanagari
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

export class VoiceBillParser {
  /**
   * Detect language based on presence of Devanagari Unicode block (U+0900 to U+097F)
   */
  static detectLanguage(text: string): SupportedLanguage {
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text) ? 'hi' : 'en';
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
  static parse(inputText: string): ParsedSlots {
    const slots: ParsedSlots = {};
    if (!inputText || !inputText.trim()) {
      return slots;
    }

    const normalizedText = this.normalizeNumberWordsInText(inputText);

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
    // Look for anchor OR raw 10-digit Indian phone number
    const phoneAnchorMatch = normalizedText.match(
      /(?:phone|number|mobile|contact|फ़ोन|फोन|नंबर|मोबाइल|mob)[\s:=]*(\+?91[\s-]?)?([6-9]\d{9})\b/i
    );
    if (phoneAnchorMatch) {
      slots.phone = phoneAnchorMatch[2];
    } else {
      // Direct 10-digit mobile number pattern
      const directPhoneMatch = normalizedText.match(/\b([6-9]\d{9})\b/);
      if (directPhoneMatch) {
        slots.phone = directPhoneMatch[1];
      }
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
      // Avoid interpreting phone numbers as price
      if (!isNaN(p) && p > 0 && String(p) !== slots.phone) {
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
          !/^\d+$/.test(potentialProd)
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
      // Check if it's not a conversational filler or quantity/price token
      const filler = [
        'yes', 'no', 'ok', 'okay', 'confirm', 'cancel', 'haan', 'ha', 'theek hai', 'done',
        'pieces', 'pcs', 'piece', 'पीस', 'नग', 'मात्रा', 'qty', 'रुपये', 'rupees', 'rs'
      ];
      if (!filler.some(f => trimmedInput.toLowerCase().includes(f))) {
        slots.productName = trimmedInput;
      }
    }

    return slots;
  }
}
