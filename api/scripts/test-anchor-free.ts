import assert from 'assert';
import { VoiceBillParser } from '../src/services/voiceBillParser';

console.log('=== Running Anchor-Free Positional Parser Elimination Pass Tests ===\n');

const knownProducts = ['Oak Wood Planks', 'Custom Executive Teak Desk', 'Teak Desk', 'Office Chair'];

// Test 1: Positional input without quantity and price ("rahul 5565428785 oak wood planks")
console.log('Test 1: Positional input without quantity and price');
const res1 = VoiceBillParser.parse('rahul 5565428785 oak wood planks', knownProducts);
console.log('Result 1:', JSON.stringify(res1, null, 2));

assert.strictEqual(res1.phone, '5565428785', 'Phone should be extracted as 5565428785');
assert.strictEqual(res1.customerName, 'Rahul', 'Customer name should be extracted as Rahul');
assert.strictEqual(res1.isNameInferred, true, 'isNameInferred flag should be true');
assert.strictEqual(res1.productName, 'Oak Wood Planks', 'Product should be matched to Oak Wood Planks');
assert.strictEqual(res1.quantity, undefined, 'Quantity should be undefined (triggering follow up)');
assert.strictEqual(res1.unitPrice, undefined, 'UnitPrice should be undefined (triggering follow up)');
assert.ok(res1.confidenceNotes?.en?.some(n => n.includes('detected — tap to correct')), 'Should have name detected note');
console.log('✓ Test 1 passed\n');

// Test 2: Full positional input with numbers ("rahul 5565428785 oak wood planks 2 4500")
console.log('Test 2: Full positional input with numbers');
const res2 = VoiceBillParser.parse('rahul 5565428785 oak wood planks 2 4500', knownProducts);
console.log('Result 2:', JSON.stringify(res2, null, 2));

assert.strictEqual(res2.phone, '5565428785', 'Phone should be 5565428785');
assert.strictEqual(res2.customerName, 'Rahul', 'Customer name should be Rahul');
assert.strictEqual(res2.isNameInferred, true, 'isNameInferred should be true');
assert.strictEqual(res2.productName, 'Oak Wood Planks', 'Product should be Oak Wood Planks');
assert.strictEqual(res2.quantity, 2, 'Quantity should be 2 (magnitude < 100)');
assert.strictEqual(res2.isQtyAssumed, true, 'isQtyAssumed should be true');
assert.strictEqual(res2.unitPrice, 4500, 'UnitPrice should be 4500 (magnitude >= 100)');
assert.strictEqual(res2.isPriceAssumed, true, 'isPriceAssumed should be true');
assert.strictEqual(res2.discountPercent, undefined, 'Discount should not be inferred');
console.log('✓ Test 2 passed\n');

// Test 3: Magnitude disambiguation with inverted number order ("rahul 5565428785 oak wood planks 4500 2")
console.log('Test 3: Magnitude disambiguation with inverted order');
const res3 = VoiceBillParser.parse('rahul 5565428785 oak wood planks 4500 2', knownProducts);
console.log('Result 3:', JSON.stringify(res3, null, 2));

assert.strictEqual(res3.quantity, 2, 'Quantity should still be 2');
assert.strictEqual(res3.unitPrice, 4500, 'UnitPrice should still be 4500');
assert.strictEqual(res3.isQtyAssumed, true, 'isQtyAssumed should be true');
assert.strictEqual(res3.isPriceAssumed, true, 'isPriceAssumed should be true');
console.log('✓ Test 3 passed\n');

// Test 4: Keyword-anchored input preservation (no assumed flags when explicitly anchored)
console.log('Test 4: Keyword-anchored input preservation');
const res4 = VoiceBillParser.parse('Customer Rahul Sharma, phone 9876543210, add 2 Teak Desk price 4500 discount 10%', knownProducts);
console.log('Result 4:', JSON.stringify(res4, null, 2));

assert.strictEqual(res4.phone, '9876543210');
assert.strictEqual(res4.customerName, 'Rahul Sharma');
assert.ok(!res4.isNameInferred, 'isNameInferred should be falsy on anchored input');
assert.strictEqual(res4.quantity, 2);
assert.ok(!res4.isQtyAssumed, 'isQtyAssumed should be falsy on anchored input');
assert.strictEqual(res4.unitPrice, 4500);
assert.ok(!res4.isPriceAssumed, 'isPriceAssumed should be falsy on anchored input');
assert.strictEqual(res4.discountPercent, 10);
console.log('✓ Test 4 passed\n');

// Test 5: Hindi anchor-free positional input ("राहुल 9876543210 ओक वुड 2 4500")
console.log('Test 5: Hindi anchor-free positional input');
const res5 = VoiceBillParser.parse('राहुल 9876543210 ओक वुड 2 4500', knownProducts);
console.log('Result 5:', JSON.stringify(res5, null, 2));

assert.strictEqual(res5.phone, '9876543210');
assert.strictEqual(res5.customerName, 'राहुल');
assert.strictEqual(res5.isNameInferred, true);
assert.strictEqual(res5.productName, 'Oak Wood Planks');
assert.strictEqual(res5.quantity, 2);
assert.strictEqual(res5.unitPrice, 4500);
assert.ok(res5.confidenceNotes?.hi?.some(n => n.includes('पहचाना गया')), 'Should have Hindi name detected note');
console.log('✓ Test 5 passed\n');

// Test 6: Unclassified leftover tokens (never force-assign unknown tokens)
console.log('Test 6: Unclassified leftover tokens');
const res6 = VoiceBillParser.parse('xyzunknown 5565428785 oak wood planks', knownProducts);
console.log('Result 6:', JSON.stringify(res6, null, 2));

assert.strictEqual(res6.phone, '5565428785');
assert.strictEqual(res6.productName, 'Oak Wood Planks');
assert.strictEqual(res6.customerName, undefined, 'Unknown name should NOT be guessed');
assert.ok(res6.rawTokens?.includes('xyzunknown'), 'xyzunknown should remain in rawTokens');
console.log('✓ Test 6 passed\n');

// Test 7: Never infer discount without explicit anchor or %
console.log('Test 7: Never infer discount without explicit anchor');
const res7 = VoiceBillParser.parse('rahul 5565428785 oak wood planks 2 4500 15', knownProducts);
console.log('Result 7:', JSON.stringify(res7, null, 2));

assert.strictEqual(res7.quantity, 2);
assert.strictEqual(res7.unitPrice, 4500);
assert.strictEqual(res7.discountPercent, undefined, '15 should not be assumed as discount');
console.log('✓ Test 7 passed\n');

console.log('=== All Anchor-Free Elimination Pass Tests Passed Successfully! ===');
