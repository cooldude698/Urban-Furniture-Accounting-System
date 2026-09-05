import { VoiceBillParser } from '../src/services/voiceBillParser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== TESTING VOICE BILL DETERMINISTIC PARSER ===\n');

// Test 1: Language Detection
console.log('1. Language detection:');
assert(VoiceBillParser.detectLanguage('Hello customer John') === 'en', 'English detected');
assert(VoiceBillParser.detectLanguage('नमस्ते ग्राहक राहुल शर्मा') === 'hi', 'Hindi Devanagari detected');
console.log('✅ Language detection passed');

// Test 2: Number Words Normalization
console.log('\n2. Number words normalization:');
assert(VoiceBillParser.normalizeNumberWordsInText('दो सौ') === '200', 'दो सौ -> 200');
assert(VoiceBillParser.normalizeNumberWordsInText('five hundred') === '500', 'five hundred -> 500');
assert(VoiceBillParser.normalizeNumberWordsInText('तीन कुर्सी') === '3 कुर्सी', 'तीन -> 3');
assert(VoiceBillParser.normalizeNumberWordsInText('panch hazar') === '5000', 'panch hazar -> 5000');
console.log('✅ Number words normalization passed');

// Test 3: English full input
console.log('\n3. Full English input:');
const enInput = 'Customer John Doe, phone 9876543210, add 2 Teak Desk price 4500 discount 10%';
const enParsed = VoiceBillParser.parse(enInput);
console.log('Parsed English:', enParsed);
assert(enParsed.customerName === 'John Doe', `customerName: ${enParsed.customerName}`);
assert(enParsed.phone === '9876543210', `phone: ${enParsed.phone}`);
assert(enParsed.quantity === 2, `quantity: ${enParsed.quantity}`);
assert(enParsed.unitPrice === 4500, `unitPrice: ${enParsed.unitPrice}`);
assert(enParsed.discountPercent === 10, `discountPercent: ${enParsed.discountPercent}`);
assert(Boolean(enParsed.productName?.toLowerCase().includes('teak desk')), `productName: ${enParsed.productName}`);
console.log('✅ English full input parsed correctly');

// Test 4: Hindi Devanagari full input
console.log('\n4. Full Hindi Devanagari input:');
const hiInput = 'ग्राहक राहुल शर्मा फ़ोन 9812345678 दो टीक डेस्क कीमत 5000';
const hiParsed = VoiceBillParser.parse(hiInput);
console.log('Parsed Hindi:', hiParsed);
assert(hiParsed.customerName === 'राहुल शर्मा', `customerName: ${hiParsed.customerName}`);
assert(hiParsed.phone === '9812345678', `phone: ${hiParsed.phone}`);
assert(hiParsed.quantity === 2, `quantity: ${hiParsed.quantity}`);
assert(hiParsed.unitPrice === 5000, `unitPrice: ${hiParsed.unitPrice}`);
console.log('✅ Hindi full input parsed correctly');

// Test 5: Hinglish mixed input
console.log('\n5. Mixed Hinglish input:');
const hinglishInput = 'do desk chahiye price 5000, customer Aman phone 9876501234';
const hinglishParsed = VoiceBillParser.parse(hinglishInput);
console.log('Parsed Hinglish:', hinglishParsed);
assert(hinglishParsed.customerName === 'Aman', `customerName: ${hinglishParsed.customerName}`);
assert(hinglishParsed.phone === '9876501234', `phone: ${hinglishParsed.phone}`);
assert(hinglishParsed.quantity === 2, `quantity: ${hinglishParsed.quantity}`);
assert(hinglishParsed.unitPrice === 5000, `unitPrice: ${hinglishParsed.unitPrice}`);
console.log('✅ Hinglish mixed input parsed correctly');

// Test 6: Slot update / correction command
console.log('\n6. Update command:');
const updateInput = 'change quantity to 4';
const updateParsed = VoiceBillParser.parse(updateInput);
console.log('Parsed Update:', updateParsed);
assert(updateParsed.isUpdate === true, 'isUpdate is true');
assert(updateParsed.updateField === 'quantity', 'updateField is quantity');
assert(updateParsed.quantity === 4, 'quantity is 4');
assert(updateParsed.updateNote?.en === 'Quantity updated to 4', 'updateNote en correct');

const updateHindi = 'मात्रा 5 कर दो';
const updateHiParsed = VoiceBillParser.parse(updateHindi);
console.log('Parsed Hindi Update:', updateHiParsed);
assert(updateHiParsed.quantity === 5, 'quantity is 5');
assert(updateHiParsed.updateField === 'quantity', 'updateField is quantity');
console.log('✅ Update commands parsed correctly');

console.log('\n🎉 ALL PARSER TESTS PASSED! 🎉');
