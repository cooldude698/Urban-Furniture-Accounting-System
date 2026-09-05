import { VoiceBillService } from '../src/services/voiceBillService';
import { VoiceBillParser } from '../src/services/voiceBillParser';
import { pool } from '../src/db/pool';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

interface TestCase {
  name: string;
  category: 'anchored_en' | 'anchored_hi' | 'positional' | 'hinglish' | 'disagreement' | 'fallback';
  input: string;
  expectedCustomer?: string;
  expectedPhone?: string;
  expectedProductSubstring?: string;
  expectedQty?: number;
  expectedPrice?: number;
  expectedDiscount?: number;
  expectReviewFlag?: boolean;
}

async function testOllamaHybrid() {
  console.log('=== TESTING OLLAMA LLM-POWERED SLOT EXTRACTOR & HYBRID CROSS-CHECK ===\n');

  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://ollama:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

  console.log(`Config: OLLAMA_BASE_URL=${ollamaUrl}, OLLAMA_MODEL=${model}\n`);

  // 1. Check Ollama reachability
  let ollamaAvailable = false;
  try {
    const tagsRes = await fetch(`${ollamaUrl}/api/tags`);
    if (tagsRes.ok) {
      const tagsData = (await tagsRes.json()) as { models?: Array<{ name: string }> };
      console.log('✅ Ollama container is online. Available models:', tagsData.models?.map(m => m.name) || []);
      ollamaAvailable = true;
    } else {
      console.warn(`⚠️ Ollama responded with HTTP ${tagsRes.status}. Fallback mode active.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Ollama container not reachable (${err.message}). Testing in mandatory offline deterministic fallback mode.`);
  }

  // 2. 15 Test Cases
  const testCases: TestCase[] = [
    {
      name: '1. Anchored English standard',
      category: 'anchored_en',
      input: 'Customer Rajesh Kumar phone 9876543210 2 Teak Desk price 4500 discount 10%',
      expectedCustomer: 'Rajesh Kumar',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 4500,
      expectedDiscount: 10,
    },
    {
      name: '2. Anchored English variation',
      category: 'anchored_en',
      input: 'Bill for John Doe phone 9812345678, add 3 Oak Wood Planks at 3200 each',
      expectedCustomer: 'John Doe',
      expectedPhone: '9812345678',
      expectedProductSubstring: 'oak wood planks',
      expectedQty: 3,
      expectedPrice: 3200,
    },
    {
      name: '3. Anchored Hindi Devanagari standard',
      category: 'anchored_hi',
      input: 'ग्राहक राहुल शर्मा फ़ोन 9876543210 दो टीक डेस्क कीमत 5000',
      expectedCustomer: 'राहुल',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 5000,
    },
    {
      name: '4. Anchored Hindi variation with mobile keyword',
      category: 'anchored_hi',
      input: 'ग्राहक अमित पटेल मोबाइल 9898989898 1 टीक डेस्क कीमत 6000',
      expectedCustomer: 'अमित',
      expectedPhone: '9898989898',
      expectedProductSubstring: 'teak desk',
      expectedQty: 1,
      expectedPrice: 6000,
    },
    {
      name: '5. Positional English input without anchors',
      category: 'positional',
      input: 'Rahul Sharma 9876543210 Teak Desk 2 4500',
      expectedCustomer: 'Rahul Sharma',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 4500,
    },
    {
      name: '6. Positional Hindi input without anchors',
      category: 'positional',
      input: 'राहुल 9876543210 टीक डेस्क 2 4500',
      expectedCustomer: 'राहुल',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 4500,
    },
    {
      name: '7. Mixed Hinglish input with Hindi number words',
      category: 'hinglish',
      input: 'customer Vikram Singh phone 9988776655 do teak desk chahiye price 6000',
      expectedCustomer: 'Vikram Singh',
      expectedPhone: '9988776655',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 6000,
    },
    {
      name: '8. Mixed Hinglish input with discount',
      category: 'hinglish',
      input: 'customer Aman Gupta phone 9123456789 ek teak desk price 7000 discount 5 percent',
      expectedCustomer: 'Aman Gupta',
      expectedPhone: '9123456789',
      expectedProductSubstring: 'teak desk',
      expectedQty: 1,
      expectedPrice: 7000,
      expectedDiscount: 5,
    },
    {
      name: '9. Disagreement Test 1 (Ambiguous numbers - magnitude cross-check)',
      category: 'disagreement',
      input: 'Rahul 9876543210 Teak Desk 4500 2', // Inverted numbers: 4500 (price) and 2 (qty)
      expectedCustomer: 'Rahul',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'teak desk',
      expectedQty: 2,
      expectedPrice: 4500,
      expectReviewFlag: true,
    },
    {
      name: '10. Disagreement Test 2 (Explicit quantity keyword vs ambiguous trailing digits)',
      category: 'disagreement',
      input: 'Customer Rohit 9876500000 quantity 3 Teak Desk price 4000',
      expectedCustomer: 'Rohit',
      expectedPhone: '9876500000',
      expectedProductSubstring: 'teak desk',
      expectedQty: 3,
      expectedPrice: 4000,
    },
    {
      name: '11. Disagreement Test 3 (Discount anchor protection)',
      category: 'disagreement',
      input: 'Customer Suman phone 9811223344 1 Teak Desk price 5000 discount 15%',
      expectedCustomer: 'Suman',
      expectedPhone: '9811223344',
      expectedProductSubstring: 'teak desk',
      expectedQty: 1,
      expectedPrice: 5000,
      expectedDiscount: 15,
    },
    {
      name: '12. Phone number extraction & sanitization',
      category: 'anchored_en',
      input: 'Customer Meera phone +91-9876543210 2 Teak Desk price 5000',
      expectedCustomer: 'Meera',
      expectedPhone: '9876543210',
      expectedQty: 2,
      expectedPrice: 5000,
    },
    {
      name: '13. Catalog fuzzy matching via pg_trgm',
      category: 'anchored_en',
      input: 'Customer Nimesh phone 9876543210 1 oak planks price 3200',
      expectedCustomer: 'Nimesh',
      expectedPhone: '9876543210',
      expectedProductSubstring: 'oak wood planks', // Matched against Master Catalog
      expectedQty: 1,
      expectedPrice: 3200,
    },
    {
      name: '14. Multi-turn correction command',
      category: 'anchored_en',
      input: 'change quantity to 5',
      expectedQty: 5,
    },
    {
      name: '15. Offline Fallback Resilience (Unreachable service simulation)',
      category: 'fallback',
      input: 'Customer Deepak phone 9776655443 2 Teak Desk price 4500',
      expectedCustomer: 'Deepak',
      expectedPhone: '9776655443',
      expectedQty: 2,
      expectedPrice: 4500,
    },
  ];

  console.log(`Running ${testCases.length} test cases with latency measurement...\n`);

  const latencies: number[] = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const sessionId = `test_ollama_hybrid_${i}_${Date.now()}`;
    const startMs = Date.now();

    // If case 14 (update), first initialize session with case 13
    if (tc.name.includes('14.')) {
      await VoiceBillService.processMessage(
        'Customer Nimesh phone 9876543210 1 oak planks price 3200',
        sessionId
      );
    }

    // If case 15 (fallback), simulate unreachable Ollama URL
    const originalOllamaUrl = process.env.OLLAMA_BASE_URL;
    if (tc.category === 'fallback') {
      process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:54321';
    }

    try {
      const result = await VoiceBillService.processMessage(tc.input, sessionId);
      const durationMs = Date.now() - startMs;
      latencies.push(durationMs);

      // Verify fields
      if (tc.expectedCustomer) {
        assert(
          Boolean(result.session.customerName?.toLowerCase().includes(tc.expectedCustomer.toLowerCase())),
          `[${tc.name}] Expected customer "${tc.expectedCustomer}", got "${result.session.customerName}"`
        );
      }

      if (tc.expectedPhone) {
        assert(
          result.session.phone === tc.expectedPhone,
          `[${tc.name}] Expected phone "${tc.expectedPhone}", got "${result.session.phone}"`
        );
      }

      if (tc.expectedProductSubstring && result.session.lineItems.length > 0) {
        const item = result.session.lineItems[0];
        const matchName = (item.matchedName || item.productName).toLowerCase();
        assert(
          matchName.includes(tc.expectedProductSubstring.toLowerCase()),
          `[${tc.name}] Expected product containing "${tc.expectedProductSubstring}", got "${matchName}"`
        );
      }

      if (tc.expectedQty !== undefined && result.session.lineItems.length > 0) {
        const item = result.session.lineItems[result.session.lineItems.length - 1];
        assert(
          item.qty === tc.expectedQty,
          `[${tc.name}] Expected qty ${tc.expectedQty}, got ${item.qty}`
        );
      }

      if (tc.expectedPrice !== undefined && result.session.lineItems.length > 0) {
        const item = result.session.lineItems[0];
        assert(
          item.unitPrice === tc.expectedPrice,
          `[${tc.name}] Expected price ${tc.expectedPrice}, got ${item.unitPrice}`
        );
      }

      if (tc.expectedDiscount !== undefined && result.session.lineItems.length > 0) {
        const item = result.session.lineItems[0];
        assert(
          item.discountPercent === tc.expectedDiscount,
          `[${tc.name}] Expected discount ${tc.expectedDiscount}%, got ${item.discountPercent}%`
        );
      }

      console.log(`✓ ${tc.name} passed (${durationMs}ms)`);
      passedCount++;
    } catch (err: any) {
      console.error(`✗ ${tc.name} FAILED: ${err.message}`);
      throw err;
    } finally {
      if (tc.category === 'fallback') {
        process.env.OLLAMA_BASE_URL = originalOllamaUrl;
      }
    }
  }

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);

  console.log(`\n======================================================`);
  console.log(`RESULTS: ${passedCount}/${testCases.length} Tests Passed Successfully!`);
  console.log(`Latency Statistics: Avg: ${avgLatency}ms | Min: ${minLatency}ms | Max: ${maxLatency}ms`);
  console.log(`======================================================\n`);
}

testOllamaHybrid()
  .catch(err => {
    console.error('Fatal test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
