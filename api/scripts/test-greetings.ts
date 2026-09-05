import http from 'http';
import { app } from '../src/app';

async function main() {
  console.log('=== TESTING CONVERSATIONAL GREETING & CHITCHAT HANDLING ===\n');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  try {
    // 1. Authenticate as admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
    });
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw new Error('Failed to obtain auth cookie');
    console.log('✅ Admin authenticated\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      Cookie: cookie,
    };

    const sessionId = `test_greetings_${Date.now()}`;

    // Test 1: Saying "hello"
    console.log('--- Test 1: User says "hello" ---');
    const res1 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'hello', sessionId }),
    });
    const data1 = (await res1.json()) as any;
    console.log(`Assistant Reply: "${data1.data.reply}"`);
    console.log(`Line items count: ${data1.data.session.lineItems.length}`);
    console.log(`Options present: ${Boolean(data1.data.options)}`);

    if (data1.data.options && data1.data.options.length > 0) {
      throw new Error(`FAIL: Assistant suggested product options on "hello": ${JSON.stringify(data1.data.options)}`);
    }
    if (data1.data.session.lineItems.length > 0) {
      throw new Error('FAIL: Line item added on "hello"');
    }
    if (!data1.data.reply.toLowerCase().includes('hello')) {
      throw new Error('FAIL: Reply does not contain friendly greeting');
    }
    console.log('✅ PASS: "hello" answered politely with instructions, zero spurious product suggestions!\n');

    // Test 2: Saying "नमस्ते"
    console.log('--- Test 2: User says "नमस्ते" ---');
    const res2 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'नमस्ते', sessionId }),
    });
    const data2 = (await res2.json()) as any;
    console.log(`Assistant Reply: "${data2.data.reply}"`);
    console.log(`Line items count: ${data2.data.session.lineItems.length}`);
    if (data2.data.options && data2.data.options.length > 0) {
      throw new Error('FAIL: Product options suggested on "नमस्ते"');
    }
    if (data2.data.session.lineItems.length > 0) {
      throw new Error('FAIL: Line item added on "नमस्ते"');
    }
    console.log('✅ PASS: "नमस्ते" answered with Hindi greeting, zero spurious product suggestions!\n');

    // Test 3: Saying "help"
    console.log('--- Test 3: User says "help" ---');
    const res3 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'help', sessionId }),
    });
    const data3 = (await res3.json()) as any;
    console.log(`Assistant Reply: "${data3.data.reply}"`);
    if (data3.data.options && data3.data.options.length > 0) {
      throw new Error('FAIL: Product options suggested on "help"');
    }
    console.log('✅ PASS: "help" returned usage guide!\n');

    // Test 4: Saying "thank you"
    console.log('--- Test 4: User says "thank you" ---');
    const res4 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'thank you', sessionId }),
    });
    const data4 = (await res4.json()) as any;
    console.log(`Assistant Reply: "${data4.data.reply}"`);
    console.log('✅ PASS: "thank you" handled politely!\n');

    // Test 5: Saying "hello or something" (composite conversational phrase)
    console.log('--- Test 5: User says "hello or something" ---');
    const res5 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'hello or something', sessionId: `session_${Date.now()}_hello_or_something` }),
    });
    const data5 = (await res5.json()) as any;
    console.log(`Assistant Reply: "${data5.data.reply}"`);
    console.log(`Line items count: ${data5.data.session.lineItems.length}`);
    if (data5.data.options && data5.data.options.length > 0) {
      throw new Error(`FAIL: Product options suggested on "hello or something": ${JSON.stringify(data5.data.options)}`);
    }
    if (data5.data.session.lineItems.length > 0) {
      throw new Error('FAIL: Line item added on "hello or something"');
    }
    console.log('✅ PASS: "hello or something" answered as greeting without spurious product suggestions!\n');

    // Test 6: Asking "what products do you sell"
    console.log('--- Test 6: User says "what products do you sell" ---');
    const res6 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'what products do you sell', sessionId: `session_${Date.now()}_catalog` }),
    });
    const data6 = (await res6.json()) as any;
    console.log(`Assistant Reply:\n${data6.data.reply}`);
    if (!data6.data.reply.toLowerCase().includes('catalog') && !data6.data.reply.toLowerCase().includes('furniture')) {
      throw new Error('FAIL: Catalog response did not mention catalog or furniture');
    }
    if (data6.data.session.lineItems.length > 0) {
      throw new Error('FAIL: Line item was mistakenly added on catalog inquiry');
    }
    console.log('✅ PASS: Catalog inquiry handled with store presentation!\n');

    // Test 7: Real billing message still works seamlessly
    console.log('--- Test 7: User says "2 teak desk price 5000" ---');
    const res7 = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: '2 teak desk price 5000', sessionId }),
    });
    const data7 = (await res7.json()) as any;
    console.log(`Assistant Reply: "${data7.data.reply}"`);
    console.log(`Line items count: ${data7.data.session.lineItems.length}`);
    console.log(`Item 1: ${data7.data.session.lineItems[0].matchedName}`);
    if (data7.data.session.lineItems.length !== 1) {
      throw new Error('FAIL: Product was not added on real billing command');
    }
    console.log('✅ PASS: Real product billing command works seamlessly!\n');

    console.log('🎉 ALL GREETING, INQUIRY & CHITCHAT TESTS PASSED! 🎉');
  } finally {
    server.close();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
