import http from 'http';
import { app } from '../src/app';

async function main() {
  console.log('=== TESTING REMOVAL, 0-QUANTITY, AND PHANTOM ITEM FIXES ===\n');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098';

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

    const sessionId = `test_removal_${Date.now()}`;
    console.log(`Using Session: ${sessionId}`);

    // Test 1: Add a real item
    console.log('\n--- Step 1: Add Custom Executive Teak Desk ---');
    const turn1Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: '2 Teak Desk price 5000',
        sessionId,
      }),
    });
    const turn1 = (await turn1Res.json()) as any;
    console.log(`Assistant: "${turn1.data.reply}"`);
    console.log(`Line items count: ${turn1.data.session.lineItems.length}`);
    console.log(`Item 1: ${turn1.data.session.lineItems[0].matchedName}`);

    // Test 2: Provide customer name and phone. Verify NO phantom chair is added!
    console.log('\n--- Step 2: Provide customer name & phone (Verify NO phantom item) ---');
    const turn2Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'customer rahul phone 9876543210',
        sessionId,
      }),
    });
    const turn2 = (await turn2Res.json()) as any;
    console.log(`Assistant: "${turn2.data.reply}"`);
    console.log(`Line items count: ${turn2.data.session.lineItems.length}`);
    if (turn2.data.session.lineItems.length !== 1) {
      throw new Error(`Expected 1 item, found ${turn2.data.session.lineItems.length}`);
    }
    console.log('✅ PASS: No phantom item was added on customer name & phone input!');

    // Test 3: Add a second item
    console.log('\n--- Step 3: Add Oak Wood Planks ---');
    const turn3Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'add 3 oak wood planks price 1200',
        sessionId,
      }),
    });
    const turn3 = (await turn3Res.json()) as any;
    console.log(`Assistant: "${turn3.data.reply}"`);
    console.log(`Line items count: ${turn3.data.session.lineItems.length}`);
    const oakItem = turn3.data.session.lineItems.find((i: any) => i.matchedName && i.matchedName.includes('Oak'));
    console.log(`Found item: ${oakItem?.matchedName}, id: ${oakItem?.id}`);

    // Test 4: Delete the second item via DELETE endpoint (simulating clicking trash in UI)
    console.log('\n--- Step 4: Delete Oak Wood Planks via DELETE endpoint ---');
    const deleteRes = await fetch(`${baseUrl}/api/voice-bill/session/${sessionId}/item/${oakItem.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const deleteData = (await deleteRes.json()) as any;
    console.log(`Items after delete: ${deleteData.data.lineItems.length}`);
    if (deleteData.data.lineItems.length !== 1) {
      throw new Error('Item was not deleted from session!');
    }
    console.log('✅ PASS: Item deleted via API!');

    // Test 5: Send another chat message. Verify the deleted item DOES NOT COME BACK!
    console.log('\n--- Step 5: Send another chat message (Verify deleted item does NOT come back) ---');
    const turn5Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'discount 5 percent',
        sessionId,
      }),
    });
    const turn5 = (await turn5Res.json()) as any;
    console.log(`Assistant: "${turn5.data.reply}"`);
    console.log(`Items after next message: ${turn5.data.session.lineItems.length}`);
    if (turn5.data.session.lineItems.length !== 1) {
      throw new Error('Deleted item came back!');
    }
    console.log('✅ PASS: Deleted item did NOT come back on next turn!');

    // Test 6: Test conversational zero (typing "0" to remove an item)
    console.log('\n--- Step 6: Test typing "0" to remove/cancel item ---');
    const sessionZero = `test_zero_${Date.now()}`;
    // Add item without quantity
    const turnZero1Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'teak desk',
        sessionId: sessionZero,
      }),
    });
    const turnZero1 = (await turnZero1Res.json()) as any;
    console.log(`Assistant: "${turnZero1.data.reply}"`);

    // User replies "0"
    const turnZero2Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: '0',
        sessionId: sessionZero,
      }),
    });
    const turnZero2 = (await turnZero2Res.json()) as any;
    console.log(`Assistant: "${turnZero2.data.reply}"`);
    console.log(`Session items: ${turnZero2.data.session.lineItems.length}`);
    if (turnZero2.data.session.lineItems.length !== 0) {
      throw new Error('Item was not removed when user entered 0!');
    }
    console.log('✅ PASS: Typing "0" removed the item cleanly without looping!');

    console.log('\n🎉 ALL REMOVAL & PHANTOM ITEM TESTS PASSED! 🎉');
  } finally {
    server.close();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
