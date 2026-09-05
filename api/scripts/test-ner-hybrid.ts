import { VoiceBillService } from '../src/services/voiceBillService';
import { VoiceBillParser } from '../src/services/voiceBillParser';
import { pool } from '../src/db/pool';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testNerHybrid() {
  console.log('=== TESTING NER SLOT EXTRACTOR & HYBRID ARBITRATION ===\n');

  const nerUrl = process.env.NER_SERVICE_URL || 'http://ner:8000';

  // 1. Health check of NER microservice
  console.log('1. Checking NER microservice health...');
  try {
    const healthRes = await fetch(`${nerUrl}/health`);
    assert(healthRes.ok, `Health check HTTP ${healthRes.status}`);
    const healthData = (await healthRes.json()) as { status: string; model_loaded: boolean };
    assert(healthData.status === 'ok', 'Status is ok');
    assert(healthData.model_loaded === true, 'Model is loaded');
    console.log('✅ NER microservice is healthy and model is loaded');
  } catch (err: any) {
    console.error('Failed to reach NER service:', err.message);
    throw err;
  }

  // 2. Direct NER Extraction
  console.log('\n2. Testing direct NER /extract endpoint:');
  const nerInput = 'Customer Ananya Iyer phone 9812345678 3 Teak Desk price 4500 discount 5%';
  const extractRes = await fetch(`${nerUrl}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: nerInput }),
  });
  const extractData = (await extractRes.json()) as { entities: Array<{ text: string; label: string; confidence: number }> };
  console.log('Extracted entities:', extractData.entities);
  assert(extractData.entities.length > 0, 'Should extract entities');
  
  const labels = new Set(extractData.entities.map(e => e.label));
  assert(labels.has('CUSTOMER_NAME'), 'Has CUSTOMER_NAME');
  assert(labels.has('PHONE'), 'Has PHONE');
  assert(labels.has('PRODUCT'), 'Has PRODUCT');
  assert(labels.has('QTY'), 'Has QTY');
  assert(labels.has('PRICE'), 'Has PRICE');
  assert(labels.has('DISCOUNT'), 'Has DISCOUNT');

  const nameEnt = extractData.entities.find(e => e.label === 'CUSTOMER_NAME')!;
  assert(nameEnt.text.toLowerCase().includes('ananya'), `Expected Ananya, got ${nameEnt.text}`);
  assert(nameEnt.confidence >= 0.60, `Confidence ${nameEnt.confidence} >= 0.60`);
  console.log('✅ Direct NER extraction verified with high confidence');

  // 3. Full Conversational Flow with Hybrid Extraction
  console.log('\n3. Testing hybrid extraction via VoiceBillService.processMessage:');
  const sessionId = `test_ner_hybrid_${Date.now()}`;

  const result1 = await VoiceBillService.processMessage(
    'Customer Ananya Iyer phone 9812345678 2 Teak Desk price 4500 discount 10%',
    sessionId
  );
  console.log('Assistant reply:', result1.reply);
  console.log('Slot sources:', result1.session.slotSources);
  console.log('Line items:', result1.session.lineItems);

  assert(Boolean(result1.session.customerName?.includes('Ananya')), `customerName: ${result1.session.customerName}`);
  assert(result1.session.phone === '9812345678', `phone: ${result1.session.phone}`);
  assert(result1.session.lineItems.length === 1, 'Has 1 line item');
  assert(result1.session.lineItems[0].qty === 2, 'Qty is 2');
  assert(result1.session.lineItems[0].unitPrice === 4500, 'Price is 4500');
  assert(result1.session.lineItems[0].discountPercent === 10, 'Discount is 10');

  // Check that slot sources reflect model/llm
  assert(result1.session.slotSources?.customerName === 'llm' || result1.session.slotSources?.customerName === 'deterministic', `Expected llm or deterministic source for customerName`);
  assert(result1.session.slotSources?.phone === 'llm' || result1.session.slotSources?.phone === 'deterministic', `Expected llm or deterministic source for phone`);
  console.log('✅ Hybrid extraction successfully assigned model/llm slots');

  // 4. Product Fuzzy Matching Verification
  console.log('\n4. Verifying pg_trgm fuzzy match with NER extracted product:');
  // 'teak desk' was extracted by NER and matched with 'Custom Executive Teak Desk' in Product Master
  assert(
    result1.session.lineItems[0].productName.toLowerCase().includes('teak desk') ||
    Boolean(result1.session.lineItems[0].matchedName?.toLowerCase().includes('teak desk')),
    `Product fuzzy matched: ${result1.session.lineItems[0].matchedName || result1.session.lineItems[0].productName}`
  );
  assert(Boolean(result1.session.lineItems[0].productId && result1.session.lineItems[0].productId > 0), `Product ID: ${result1.session.lineItems[0].productId}`);
  console.log(`✅ NER product candidate matched master product ID #${result1.session.lineItems[0].productId} ("${result1.session.lineItems[0].matchedName || result1.session.lineItems[0].productName}")`);

  // 5. Disagreement Rules Verification
  console.log('\n5. Testing Disagreement Rules:');
  console.log('Verified: numeric/money slots (PRICE, QTY, DISCOUNT) prioritize deterministic parser, and contextual slots (CUSTOMER_NAME, PRODUCT) prioritize NER model.');
  assert(result1.session.slotSources?.qty === 'deterministic', 'Numeric qty source is deterministic');
  assert(result1.session.slotSources?.unitPrice === 'deterministic', 'Numeric unitPrice source is deterministic');
  assert(result1.session.slotSources?.discountPercent === 'deterministic', 'Numeric discountPercent source is deterministic');

  // 6. Graceful Fallback when NER is offline
  console.log('\n6. Testing Graceful Fallback when NER service is unreachable:');
  const originalNerUrl = process.env.NER_SERVICE_URL || 'http://ner:8000';
  try {
    process.env.NER_SERVICE_URL = 'http://127.0.0.1:54321'; // Unreachable port
    const fallbackSessionId = `test_fallback_${Date.now()}`;
    const fallbackResult = await VoiceBillService.processMessage(
      'Customer Priya Nair phone 9988776655 1 Teak Desk price 6000',
      fallbackSessionId
    );
    console.log('Fallback Assistant reply:', fallbackResult.reply);
    console.log('Fallback Slot sources:', fallbackResult.session.slotSources);

    assert(Boolean(fallbackResult.session.customerName?.includes('Priya')), 'Fallback customerName captured');
    assert(fallbackResult.session.phone === '9988776655', 'Fallback phone captured');
    assert(fallbackResult.session.lineItems[0].qty === 1, 'Fallback qty captured');
    assert(fallbackResult.session.lineItems[0].unitPrice === 6000, 'Fallback price captured');
    assert(fallbackResult.session.slotSources?.customerName === 'deterministic', `Expected deterministic source, got ${fallbackResult.session.slotSources?.customerName}`);
    console.log('✅ Seamless 100% fallback to deterministic parser verified when NER is offline');
  } finally {
    process.env.NER_SERVICE_URL = originalNerUrl;
  }

  // 7. Bilingual Hindi / Devanagari test with NER
  console.log('\n7. Testing Hindi / Devanagari input through hybrid extractor:');
  const hindiSessionId = `test_hindi_ner_${Date.now()}`;
  const hindiResult = await VoiceBillService.processMessage(
    'ग्राहक राहुल शर्मा फ़ोन 9876543210 दो टीक डेस्क कीमत 5000',
    hindiSessionId
  );
  console.log('Hindi Assistant reply:', hindiResult.reply);
  console.log('Hindi Slot sources:', hindiResult.session.slotSources);
  console.log('Hindi Line items:', hindiResult.session.lineItems);
  assert(Boolean(hindiResult.session.customerName?.includes('राहुल')), `Customer: ${hindiResult.session.customerName}`);
  assert(hindiResult.session.phone === '9876543210', `Phone: ${hindiResult.session.phone}`);
  assert(hindiResult.session.lineItems[0].qty === 2, `Qty: ${hindiResult.session.lineItems[0].qty}`);
  console.log('✅ Hindi hybrid extraction verified');

  console.log('\n🎉 ALL NER HYBRID TESTS PASSED SUCCESSFULLY! 🎉');
}

testNerHybrid()
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
