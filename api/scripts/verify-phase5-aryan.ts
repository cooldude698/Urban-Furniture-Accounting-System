import http from 'http';
import Decimal from 'decimal.js';
import { pool } from '../src/db/pool';
import { app } from '../src/app';
import { InvoiceService } from '../src/services/invoiceService';
import { PaymentService } from '../src/services/paymentService';

async function verifyPhase5() {
  console.log('========================================================================');
  console.log('PHASE 5 VERIFICATION: Customer Statements, Aging Report, Overdue & PDF');
  console.log('========================================================================\n');

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098';

  const client = await pool.connect();

  try {
    // Step 1: Admin Login
    console.log('--- Step 1: Admin Login ---');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
    });
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) {
      throw new Error('Failed to obtain auth cookie');
    }
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Create a dedicated Customer for Phase 5 verification
    console.log('--- Step 2: Setting up Customer & Product Prerequisites ---');
    const custRes = await client.query(
      `INSERT INTO contacts (name, type, email, mobile)
       VALUES ('Apex Architectural Interiors', 'customer', 'accounts@apexinteriors.com', '9898989898')
       RETURNING id, name`
    );
    const customer = custRes.rows[0];
    console.log(`Customer: #${customer.id} (${customer.name})`);

    const prodRes = await client.query('SELECT id, name, sales_price FROM products LIMIT 1');
    const product = prodRes.rows[0];

    // Step 3: Create 3 Confirmed Invoices with distinct dates to build statement history
    console.log('\n--- Step 3: Creating 3 Invoices with Different Dates ---');
    // Invoice 1: 10,000 on 2026-08-01 (Due 2026-08-31 - Overdue)
    const inv1 = await InvoiceService.createInvoice({
      customerId: customer.id,
      invoiceDate: '2026-08-01',
      dueDate: '2026-08-31',
      lines: [{ productId: product.id, qty: '1', unitPrice: '10000.00', taxRate: '0.00' }],
    });
    await InvoiceService.confirmInvoice(inv1.id);
    console.log(`Invoice 1: ${inv1.number} (₹10,000.00) on 2026-08-01 [CONFIRMED]`);

    // Invoice 2: 6,000 on 2026-08-15 (Due 2026-09-15 - Current)
    const inv2 = await InvoiceService.createInvoice({
      customerId: customer.id,
      invoiceDate: '2026-08-15',
      dueDate: '2026-09-15',
      lines: [{ productId: product.id, qty: '1', unitPrice: '6000.00', taxRate: '0.00' }],
    });
    await InvoiceService.confirmInvoice(inv2.id);
    console.log(`Invoice 2: ${inv2.number} (₹6,000.00) on 2026-08-15 [CONFIRMED]`);

    // Invoice 3: 4,000 on 2026-09-01 (Due 2026-10-01 - Current)
    const inv3 = await InvoiceService.createInvoice({
      customerId: customer.id,
      invoiceDate: '2026-09-01',
      dueDate: '2026-10-01',
      lines: [{ productId: product.id, qty: '1', unitPrice: '4000.00', taxRate: '0.00' }],
    });
    await InvoiceService.confirmInvoice(inv3.id);
    console.log(`Invoice 3: ${inv3.number} (₹4,000.00) on 2026-09-01 [CONFIRMED]`);

    // Step 4: Record 2 Inbound Payments on different dates
    console.log('\n--- Step 4: Recording 2 Inbound Payments with Interleaved Dates ---');
    // Payment 1: 5,000 on 2026-08-20 (Bank) settling part of Invoice 1
    const pay1 = await PaymentService.createPayment(
      {
        direction: 'inbound',
        partnerId: customer.id,
        method: 'bank',
        paymentDate: '2026-08-20',
        amount: '5000.00',
        allocations: [{ invoiceId: inv1.id, amount: '5000.00' }],
      },
      1
    );
    console.log(`Payment 1: ${pay1.number} (₹5,000.00 Bank) on 2026-08-20 for ${inv1.number}`);

    // Payment 2: 3,000 on 2026-09-02 (Cash) settling part of Invoice 2
    const pay2 = await PaymentService.createPayment(
      {
        direction: 'inbound',
        partnerId: customer.id,
        method: 'cash',
        paymentDate: '2026-09-02',
        amount: '3000.00',
        allocations: [{ invoiceId: inv2.id, amount: '3000.00' }],
      },
      1
    );
    console.log(`Payment 2: ${pay2.number} (₹3,000.00 Cash) on 2026-09-02 for ${inv2.number}`);

    // Step 5: Test Customer Statement with Running Balance (at least 5 rows)
    console.log('\n--- Step 5: Customer Statement with Chronological Running Balance ---');
    const stmtRes = await fetch(`${baseUrl}/api/receivables/statements/${customer.id}`, {
      headers: { Cookie: cookie },
    });
    const stmtBody = (await stmtRes.json()) as any;
    console.log(`Statement HTTP Status: ${stmtRes.status}`);
    console.log(`Customer: ${stmtBody.data.customerName}`);
    console.log(`Total Invoiced: ₹${stmtBody.data.totalInvoiced}`);
    console.log(`Total Paid: ₹${stmtBody.data.totalPaid}`);
    console.log(`Current Balance: ₹${stmtBody.data.currentBalance}`);
    console.log('\nStatement Chronological Ledger Rows:');
    console.table(
      stmtBody.data.lines.map((l: any) => ({
        Date: l.date,
        Type: l.type,
        Ref: l.ref,
        Debit: l.debit,
        Credit: l.credit,
        'Running Balance': l.runningBalance,
      }))
    );

    if (stmtBody.data.lines.length < 5) {
      throw new Error(`Statement must have at least 5 rows, got ${stmtBody.data.lines.length}`);
    }

    // Verify mathematical correctness of running balance on every single row
    let expectedBal = new Decimal('0.00');
    for (let i = 0; i < stmtBody.data.lines.length; i++) {
      const line = stmtBody.data.lines[i];
      expectedBal = expectedBal.plus(new Decimal(line.debit)).minus(new Decimal(line.credit));
      if (expectedBal.toFixed(2) !== line.runningBalance) {
        throw new Error(
          `Arithmetic mismatch at row ${i + 1}: expected ${expectedBal.toFixed(2)}, got ${line.runningBalance}`
        );
      }
    }
    console.log('✅ PASS: Statement has >= 5 rows and arithmetically correct running balance on every row!\n');

    // Step 6: Test Receivables Aging Report (0-30, 31-60, 61-90, 90+)
    console.log('--- Step 6: Receivables Aging Report ---');
    const agingRes = await fetch(`${baseUrl}/api/aging?type=receivable`, {
      headers: { Cookie: cookie },
    });
    const agingBody = (await agingRes.json()) as any;
    console.log(`Aging HTTP Status: ${agingRes.status}`);
    console.log('Aging Summary Totals:', JSON.stringify(agingBody.data.totals, null, 2));

    const totals = agingBody.data.totals;
    const bucketSum = new Decimal(totals.current)
      .plus(new Decimal(totals.days1_30))
      .plus(new Decimal(totals.days31_60))
      .plus(new Decimal(totals.days61_90))
      .plus(new Decimal(totals.days90Plus));

    console.log(`Sum of buckets: ${bucketSum.toFixed(2)}`);
    console.log(`Report totalOutstanding: ${totals.totalOutstanding}`);

    if (bucketSum.toFixed(2) !== totals.totalOutstanding) {
      throw new Error(
        `Aging bucket sum (${bucketSum.toFixed(2)}) does not equal totalOutstanding (${totals.totalOutstanding})`
      );
    }
    console.log('✅ PASS: Aging bucket totals sum EXACTLY to total outstanding!\n');

    // Step 7: Test Overdue Invoices Alert API
    console.log('--- Step 7: Overdue Invoices Alert API ---');
    const overdueRes = await fetch(`${baseUrl}/api/receivables/overdue`, {
      headers: { Cookie: cookie },
    });
    const overdueBody = (await overdueRes.json()) as any;
    console.log(`Overdue Invoices Count: ${overdueBody.data.overdueCount}`);
    console.log(`Total Overdue Amount: ₹${overdueBody.data.overdueAmount}`);
    if (overdueBody.data.overdueCount < 1) {
      throw new Error('Expected at least 1 overdue invoice (Invoice 1 due on 2026-08-31)');
    }
    console.log('✅ PASS: Overdue invoice alerts detected correctly!\n');

    // Step 8: Test PDF Export Endpoint
    console.log('--- Step 8: PDF / Print Export for Invoice ---');
    const pdfRes = await fetch(`${baseUrl}/api/invoices/${inv1.id}/pdf`, {
      headers: { Cookie: cookie },
    });
    console.log(`PDF HTTP Status: ${pdfRes.status}`);
    const contentType = pdfRes.headers.get('content-type');
    console.log(`PDF Content-Type: ${contentType}`);
    if (pdfRes.status !== 200 || (!contentType?.includes('application/pdf') && !contentType?.includes('text/html'))) {
      throw new Error(`PDF export failed with status ${pdfRes.status}, content-type: ${contentType}`);
    }
    console.log('✅ PASS: PDF export endpoint works seamlessly!\n');

    // Step 9: Global Trial Balance Check
    console.log('--- Step 9: Global Trial Balance Check ---');
    const tbRes = await client.query<{ diff: string }>(
      'SELECT (SUM(debit) - SUM(credit))::TEXT AS diff FROM journal_entry_lines;'
    );
    console.log(`Global Ledger Difference: ${tbRes.rows[0].diff}`);
    if (tbRes.rows[0].diff !== '0.00') {
      throw new Error(`Trial balance is unbalanced: ${tbRes.rows[0].diff}`);
    }
    console.log('✅ PASS: Global Trial Balance difference is exactly 0.00!\n');

    console.log('========================================================================');
    console.log('🎉 ALL PHASE 5 BACKEND VERIFICATION TESTS PASSED PERFECTLY! 🎉');
    console.log('========================================================================');
  } finally {
    client.release();
    server.close();
  }
}

verifyPhase5().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
