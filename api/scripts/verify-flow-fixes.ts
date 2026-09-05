import { VoiceBillService } from '../src/services/voiceBillService';
import { VoiceBillParser } from '../src/services/voiceBillParser';
import assert from 'assert';

async function runTests() {
  console.log('=== TEST 1: Phone Number Extraction Utility ===');
  const phonesToTest = [
    { input: '9876543210', expected: '9876543210' },
    { input: 'phone 9876543210', expected: '9876543210' },
    { input: '+91 98765 43210', expected: '9876543210' },
    { input: '98765-43210', expected: '9876543210' },
    { input: 'nine eight seven six five four three two one zero', expected: '9876543210' },
    { input: '९८७६५४३२१०', expected: '9876543210' },
    { input: 'Aryan 9876543210', expected: '9876543210' },
    { input: 'customer Aryan phone 9876543210', expected: '9876543210' },
    { input: '894656165165', expected: '4656165165' }, // 12 digits slice(-10)
  ];

  for (const tc of phonesToTest) {
    const extracted = VoiceBillParser.extractPhoneNumber(tc.input);
    console.log(`Input: "${tc.input}" -> Extracted: "${extracted}" (Expected: "${tc.expected}")`);
    assert.strictEqual(extracted, tc.expected, `Failed phone extraction on "${tc.input}"`);
  }
  console.log('✓ All phone extraction test cases passed.\n');

  console.log('=== TEST 2: Product Addition Asks For Quantity ===');
  const sess1Id = `test_sess_${Date.now()}_1`;
  const res1 = await VoiceBillService.processMessage('Teak Desk', sess1Id);
  console.log('User: "Teak Desk"');
  console.log('Bot:', res1.reply);
  assert(
    res1.session.pendingSlot === 'quantity',
    `Expected pendingSlot to be 'quantity', got: ${res1.session.pendingSlot}`
  );
  assert(
    res1.reply.toLowerCase().includes('quantity') || res1.reply.includes('मात्रा'),
    `Expected bot to ask for quantity, got: "${res1.reply}"`
  );
  console.log('✓ Prompted for quantity correctly.\n');

  console.log('=== TEST 3: Providing Quantity ===');
  const res2 = await VoiceBillService.processMessage('3 pieces', sess1Id);
  console.log('User: "3 pieces"');
  console.log('Bot:', res2.reply);
  assert.strictEqual(res2.session.lineItems[0].qty, 3, 'Expected quantity to be 3');
  assert(
    res2.session.pendingSlot === 'customerName',
    `Expected pendingSlot to be 'customerName', got: ${res2.session.pendingSlot}`
  );
  console.log('✓ Quantity saved as 3 and prompted for customer name.\n');

  console.log('=== TEST 4: Customer Name + Phone Together Never Asks Phone Again ===');
  const res3 = await VoiceBillService.processMessage('Aryan 9876543210', sess1Id);
  console.log('User: "Aryan 9876543210"');
  console.log('Bot:', res3.reply);
  assert.strictEqual(res3.session.customerName, 'Aryan', `Expected customerName 'Aryan', got: ${res3.session.customerName}`);
  assert.strictEqual(res3.session.phone, '9876543210', `Expected phone '9876543210', got: ${res3.session.phone}`);
  assert.strictEqual(res3.readyForConfirm, true, 'Expected readyForConfirm to be true');
  assert(
    !res3.reply.toLowerCase().includes('phone number'),
    'Expected bot NOT to ask for phone number again!'
  );
  console.log('✓ Bill reached ready_for_confirm without asking phone number again.\n');

  console.log('=== TEST 5: Prompted Phone Is Saved On First Attempt (Never Asked Twice) ===');
  const sess2Id = `test_sess_${Date.now()}_2`;
  await VoiceBillService.processMessage('Teak Desk', sess2Id);
  await VoiceBillService.processMessage('2', sess2Id);
  const namePrompt = await VoiceBillService.processMessage('Rahul', sess2Id);
  console.log('User: "Rahul"');
  console.log('Bot:', namePrompt.reply);
  assert(
    namePrompt.session.pendingSlot === 'phone',
    `Expected pendingSlot to be 'phone', got: ${namePrompt.session.pendingSlot}`
  );

  // Now user provides phone
  const phoneRes = await VoiceBillService.processMessage('9876543210', sess2Id);
  console.log('User: "9876543210"');
  console.log('Bot:', phoneRes.reply);
  assert.strictEqual(phoneRes.session.phone, '9876543210', 'Expected phone 9876543210');
  assert.strictEqual(phoneRes.readyForConfirm, true, 'Expected bill to be ready for confirm');
  assert(
    !phoneRes.reply.toLowerCase().includes('phone number'),
    'Bot asked for phone number again when it was already provided!'
  );
  console.log('✓ Phone saved and bill confirmed on first try without asking twice!\n');

  console.log('=== ALL FLOW TESTS PASSED! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
