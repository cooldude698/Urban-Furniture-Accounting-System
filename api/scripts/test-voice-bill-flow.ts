import http from 'http';
import { app } from '../src/app';
import { pool } from '../src/db/pool';

async function testVoiceBillFlow() {
  console.log('=== TESTING VOICE BILL CONVERSATIONAL & INVOICE FLOW ===\n');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(5097, resolve));
  const baseUrl = 'http://localhost:5097';

  try {
    // 1. Authenticate as Admin
    console.log('1. Admin Authentication:');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
    });
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw new Error('Failed to obtain auth cookie');
    console.log('✅ Admin authenticated\n');

    // 2. Multi-turn Conversational Flow in Hindi
    console.log('2. Multi-turn Conversational Input (Hindi):');
    const sessionId = `test_${Date.now()}`;

    // Turn 1: User says only product and price in Hindi
    console.log('Turn 1: "टीक डेस्क कीमत 6000"');
    const t1Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionId, text: 'टीक डेस्क कीमत 6000' }),
    });
    const t1Data = (await t1Res.json()) as any;
    console.log(`Assistant Reply (Turn 1): "${t1Data.data.reply}"`);
    if (!t1Data.data.reply.includes('मात्रा')) {
      throw new Error('Expected prompt for quantity in Hindi');
    }
    console.log('✅ Turn 1 targeted prompt for missing quantity verified');

    // Turn 2: User provides quantity in Hindi words
    console.log('\nTurn 2: "दो पीस"');
    const t2Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionId, text: 'दो पीस' }),
    });
    const t2Data = (await t2Res.json()) as any;
    console.log(`Assistant Reply (Turn 2): "${t2Data.data.reply}"`);
    if (!t2Data.data.reply.includes('ग्राहक का नाम')) {
      throw new Error('Expected prompt for customer name in Hindi');
    }
    console.log('✅ Turn 2 targeted prompt for missing customer name verified');

    // Turn 3: User provides customer name and phone
    console.log('\nTurn 3: "ग्राहक विक्रम सिंह फ़ोन 9876543299"');
    const t3Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionId, text: 'ग्राहक विक्रम सिंह फ़ोन 9876543299' }),
    });
    const t3Data = (await t3Res.json()) as any;
    console.log(`Assistant Reply (Turn 3): "${t3Data.data.reply}"`);
    console.log(`Session Status: ${t3Data.data.session.status}`);
    console.log(`Grand Total: ₹${t3Data.data.session.grandTotal}`);
    if (t3Data.data.session.status !== 'ready_for_confirm') {
      throw new Error('Expected session status ready_for_confirm');
    }
    console.log('✅ Turn 3 all slots filled, confirmation summary presented');

    // Turn 4: User updates quantity conversationally: "मात्रा 3 कर दो"
    console.log('\nTurn 4: Conversational correction "मात्रा 3 कर दो"');
    const t4Res = await fetch(`${baseUrl}/api/voice-bill/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionId, text: 'मात्रा 3 कर दो' }),
    });
    const t4Data = (await t4Res.json()) as any;
    console.log(`Assistant Reply (Turn 4): "${t4Data.data.reply}"`);
    console.log(`Updated Quantity: ${t4Data.data.session.lineItems[0].qty}`);
    console.log(`Updated Grand Total: ₹${t4Data.data.session.grandTotal}`);
    if (t4Data.data.session.lineItems[0].qty !== 3) {
      throw new Error('Expected quantity updated to 3');
    }
    console.log('✅ Turn 4 conversational slot update verified');

    // 3. Confirm Bill into Official Customer Invoice
    console.log('\n3. Confirm Bill & Generate Customer Invoice:');
    const confirmRes = await fetch(`${baseUrl}/api/voice-bill/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionId }),
    });
    const confirmData = (await confirmRes.json()) as any;
    console.log('Confirm Response:', confirmData);
    if (!confirmData.data?.invoiceId) {
      throw new Error('Invoice was not created on confirm');
    }

    const invoiceId = confirmData.data.invoiceId;
    const invoiceNumber = confirmData.data.invoiceNumber;
    console.log(`Created Invoice #${invoiceId} (${invoiceNumber})`);

    // 4. Verify Database Records: Invoice, Ledger Posting & Stock Move
    console.log('\n4. Database Double-Entry Ledger Verification:');
    const invDb = await pool.query('SELECT id, number, status, total FROM customer_invoices WHERE id = $1', [invoiceId]);
    console.log('Invoice DB Row:', invDb.rows[0]);
    if (invDb.rows[0].status !== 'confirmed') {
      throw new Error('Invoice status in DB must be confirmed');
    }

    const linesDb = await pool.query(
      `SELECT a.name, l.debit, l.credit
       FROM journal_entry_lines l
       JOIN accounts a ON a.id = l.account_id
       JOIN journal_entries j ON j.id = l.entry_id
       WHERE j.reference = $1;`,
      [invoiceNumber]
    );
    console.log('Ledger Lines Posted:');
    console.table(linesDb.rows);
    if (linesDb.rows.length < 2) {
      throw new Error('Expected at least 2 double-entry ledger lines');
    }

    // 5. Verify PDF Endpoint
    console.log('\n5. Single Invoice PDF Export:');
    const pdfRes = await fetch(`${baseUrl}${confirmData.data.pdfUrl}`, {
      headers: { Cookie: cookie },
    });
    console.log(`PDF HTTP Status: ${pdfRes.status}`);
    if (pdfRes.status !== 200) {
      throw new Error('PDF export failed');
    }
    console.log('✅ PDF export endpoint verified');

    console.log('\n🎉 ALL VOICE BILL INTEGRATION TESTS PASSED! 🎉');
  } finally {
    server.close();
  }
}

testVoiceBillFlow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
