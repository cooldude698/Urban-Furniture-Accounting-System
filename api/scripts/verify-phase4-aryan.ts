import http from 'http';
import Decimal from 'decimal.js';
import { pool } from '../src/db/pool';
import { app } from '../src/app';
import { InvoiceService } from '../src/services/invoiceService';
import { PortalService } from '../src/services/portalService';

async function verifyPhase4() {
  console.log('===============================================================');
  console.log('PHASE 4 VERIFICATION: Contact Portal, Scoping & Authorization Barrier');
  console.log('===============================================================');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  const client = await pool.connect();

  try {
    // Step 0: Ensure Customer A and Customer B exist
    console.log('\n--- Step 0: Ensuring Customer A and Customer B exist ---');
    let custARes = await client.query('SELECT id, name FROM contacts WHERE id = 2');
    const customerA = custARes.rows[0];
    console.log(`Customer A: #${customerA.id} (${customerA.name})`);

    let custBRes = await client.query("SELECT id, name FROM contacts WHERE name = 'Modern Living Corp'");
    let customerB;
    if (custBRes.rows.length === 0) {
      const createB = await client.query(
        `INSERT INTO contacts (name, type, email, mobile)
         VALUES ('Modern Living Corp', 'customer', 'procure@modernliving.com', '9876543210')
         RETURNING id, name`
      );
      customerB = createB.rows[0];
    } else {
      customerB = custBRes.rows[0];
    }
    console.log(`Customer B: #${customerB.id} (${customerB.name})`);

    const productRes = await client.query('SELECT id, name, sales_price FROM products LIMIT 1');
    const product = productRes.rows[0];

    // Step 1: Create 5,000 invoice for Customer A (Invoice A) & 8,000 invoice for Customer B (Invoice B)
    console.log('\n--- Step 1: Creating Invoices for Customer A & Customer B ---');
    const invA = await InvoiceService.createInvoice({
      customerId: customerA.id,
      invoiceDate: '2026-10-05',
      lines: [
        {
          productId: product.id,
          qty: '1',
          unitPrice: '5000.00',
          taxRate: '0.00',
        },
      ],
    });
    await InvoiceService.confirmInvoice(invA.id);
    console.log(`Customer A Invoice: ${invA.number} (ID: ${invA.id}), Total: 5000.00 [CONFIRMED]`);

    const invB = await InvoiceService.createInvoice({
      customerId: customerB.id,
      invoiceDate: '2026-10-06',
      lines: [
        {
          productId: product.id,
          qty: '1',
          unitPrice: '8000.00',
          taxRate: '0.00',
        },
      ],
    });
    await InvoiceService.confirmInvoice(invB.id);
    console.log(`Customer B Invoice: ${invB.number} (ID: ${invB.id}), Total: 8000.00 [CONFIRMED]`);

    // Step 2: Invite Customer A and set password
    console.log('\n--- Step 2: Token Invite Flow for Customer A ---');
    const invite = await PortalService.inviteContact({
      contactId: customerA.id,
      email: 'contactA@urbanliving.in',
      fullName: 'Aman Shah (Urban Living Contact)',
      loginId: 'cust_urban_a',
    });
    console.log(`Invite generated with token: ${invite.inviteToken.slice(0, 16)}...`);

    const acceptRes = await PortalService.acceptInvite(invite.inviteToken, 'SecretPassword123!');
    console.log(`Invite accepted: ${acceptRes.message}`);

    // Step 3: Log in as Customer A to obtain A_cookies
    console.log('\n--- Step 3: Logging in as Customer A to get session cookie ---');
    const loginRes = await fetch(`${baseUrl}/api/portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login_id: 'cust_urban_a',
        password: 'SecretPassword123!',
      }),
    });

    const loginData = await loginRes.json();
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error(`Login failed to return set-cookie header. Response: ${JSON.stringify(loginData)}`);
    }

    // Extract token=... cookie
    const aCookie = setCookieHeader.split(';')[0];
    console.log(`Customer A authenticated successfully. A_cookie: ${aCookie.slice(0, 20)}...`);

    // Step 4: Verification Test 2 - Attempt to access Customer B's invoice using Customer A's cookie
    console.log('\n--- Step 4: Testing IDOR Prevention ---');
    console.log(`curl -b A_cookies ${baseUrl}/api/portal/invoices/${invB.id} (Customer B's Invoice)...`);
    const idorRes = await fetch(`${baseUrl}/api/portal/invoices/${invB.id}`, {
      headers: { Cookie: aCookie },
    });
    const idorData = await idorRes.json();

    console.log(`Response Status: ${idorRes.status}`);
    console.log(`Response Body: ${JSON.stringify(idorData)}`);

    if (idorRes.status !== 404 && idorRes.status !== 403) {
      throw new Error(`CRITICAL SECURITY FAILURE: Customer A accessed Customer B's invoice #${invB.id}! Status: ${idorRes.status}`);
    }
    console.log('✅ PASS: Access denied at data layer (returned 404/403). IDOR completely prevented!');

    // Customer A accessing own invoice MUST succeed
    const ownInvRes = await fetch(`${baseUrl}/api/portal/invoices/${invA.id}`, {
      headers: { Cookie: aCookie },
    });
    const ownInvData = await ownInvRes.json();
    if (ownInvRes.status !== 200) {
      throw new Error(`Failed to access own invoice: ${ownInvRes.status}`);
    }
    console.log(`✅ PASS: Customer A can access their own invoice #${invA.id} (Status 200)`);

    // Step 5: Verification Test 3 - Customer A attempts to access /api/contacts
    console.log('\n--- Step 5: Testing Access Barrier for /api/contacts ---');
    console.log(`curl -b A_cookies ${baseUrl}/api/contacts...`);
    const contactsRes = await fetch(`${baseUrl}/api/contacts`, {
      headers: { Cookie: aCookie },
    });
    const contactsData = await contactsRes.json();

    console.log(`Response Status: ${contactsRes.status}`);
    console.log(`Response Body: ${JSON.stringify(contactsData)}`);
    if (contactsRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden on /api/contacts for contact user, got ${contactsRes.status}`);
    }
    console.log('✅ PASS: /api/contacts returned 403 Forbidden for portal contact user.');

    // Step 6: Verification Test 4 - Customer A attempts to access /api/reports/balance-sheet
    console.log('\n--- Step 6: Testing Access Barrier for /api/reports/balance-sheet ---');
    console.log(`curl -b A_cookies ${baseUrl}/api/reports/balance-sheet...`);
    const reportsRes = await fetch(`${baseUrl}/api/reports/balance-sheet`, {
      headers: { Cookie: aCookie },
    });
    const reportsData = await reportsRes.json();

    console.log(`Response Status: ${reportsRes.status}`);
    console.log(`Response Body: ${JSON.stringify(reportsData)}`);
    if (reportsRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden on /api/reports/balance-sheet for contact user, got ${reportsRes.status}`);
    }
    console.log('✅ PASS: /api/reports/balance-sheet returned 403 Forbidden for portal contact user.');

    // Step 7: Verification Test 5 - Record manual Cash payment of 3000 against the 5000 invoice
    console.log(`\n--- Step 7: Customer A Records Manual Cash Payment of 3000 against 5000 Invoice ---`);
    const payRes = await fetch(`${baseUrl}/api/portal/invoices/${invA.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aCookie,
      },
      body: JSON.stringify({
        method: 'cash',
        amount: '3000.00',
      }),
    });
    const payData = await payRes.json();

    console.log(`Payment Status: ${payRes.status}`);
    console.log(`Payment Response: ${JSON.stringify(payData)}`);
    if (payRes.status !== 201) {
      throw new Error(`Failed to record manual portal payment: ${payRes.status}`);
    }

    // Step 8: Query v_invoice_status in postgres
    console.log('\n--- Step 8: Checking v_invoice_status View in Postgres ---');
    const statusRes = await client.query(
      `SELECT total, amount_paid, amount_due, payment_status 
       FROM v_invoice_status 
       WHERE invoice_id = $1`,
      [invA.id]
    );
    console.table(statusRes.rows);

    const st = statusRes.rows[0];
    if (
      new Decimal(st.total).toNumber() !== 5000 ||
      new Decimal(st.amount_paid).toNumber() !== 3000 ||
      new Decimal(st.amount_due).toNumber() !== 2000 ||
      st.payment_status !== 'partial'
    ) {
      throw new Error(`Unexpected v_invoice_status values: ${JSON.stringify(st)}. Expected 5000 / 3000 / 2000 / partial`);
    }
    console.log('✅ PASS: v_invoice_status returns 5000 / 3000 / 2000 / partial');

    // Step 9: Verify Trial Balance
    console.log('\n--- Step 9: Verifying Global Trial Balance ---');
    const tbRes = await client.query('SELECT SUM(debit) - SUM(credit) AS diff FROM journal_entry_lines');
    const diff = new Decimal(tbRes.rows[0].diff);
    console.log(`Global Trial Balance Difference: ${diff.toFixed(2)}`);
    if (!diff.isZero()) {
      throw new Error(`Ledger unbalanced! Diff: ${diff.toFixed(2)}`);
    }
    console.log('✅ PASS: Global Trial Balance difference is 0.00');

    console.log('\n🎉 ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');

    return {
      invoiceAId: invA.id,
      invoiceBId: invB.id,
      paymentId: (payData as any)?.data?.id,
    };
  } finally {
    server.close();
    client.release();
  }
}

verifyPhase4()
  .then(res => {
    console.log('\nFinished with output:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  });
