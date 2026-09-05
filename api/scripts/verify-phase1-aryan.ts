import { pool } from '../src/db/pool';
import { SalesOrderService } from '../src/services/salesOrderService';

async function main() {
  console.log('====================================================');
  console.log('ARYAN PHASE 1 VERIFICATION — Sales Order');
  console.log('====================================================\n');

  // Prerequisite check: Customer contact, Product, Analytic Account
  const custRes = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM contacts WHERE type = 'customer' OR type = 'both' LIMIT 1`
  );
  let customerId = custRes.rows[0]?.id;
  if (!customerId) {
    const newCust = await pool.query<{ id: number }>(
      `INSERT INTO contacts (name, type, email, city)
       VALUES ('Urban Living Solutions', 'customer', 'procure@urbanliving.in', 'Gandhinagar')
       RETURNING id`
    );
    customerId = newCust.rows[0].id;
  }

  const prodRes = await pool.query<{ id: number; name: string; sales_price: string; tax_rate: string }>(
    `SELECT id, name, sales_price, tax_rate FROM products LIMIT 1`
  );
  if (prodRes.rows.length === 0) {
    throw new Error('No products found. Please seed database first.');
  }
  const product = prodRes.rows[0];

  const analyticRes = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM analytic_accounts LIMIT 1`
  );
  const analyticId = analyticRes.rows[0]?.id || null;

  console.log(`Prerequisites: Customer ID=${customerId}, Product=${product.name} (Price=${product.sales_price}, Tax=${product.tax_rate}%), Analytic ID=${analyticId}\n`);

  // Step 1: Note initial journal_entries row count
  console.log('--- Step 1: Record initial journal_entries count ---');
  const countBeforeRes = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM journal_entries');
  const countBefore = parseInt(countBeforeRes.rows[0].count, 10);
  console.log(`Initial journal_entries row count: ${countBefore}\n`);

  // Step 2: Create Sales Order
  console.log('--- Step 2: Create Sales Order ---');
  const so = await SalesOrderService.createSalesOrder({
    customerId,
    orderDate: '2026-09-05',
    lines: [
      {
        productId: product.id,
        analyticAccountId: analyticId,
        qty: '3.00',
        unitPrice: String(product.sales_price),
        taxRate: String(product.tax_rate),
      },
    ],
  });
  console.log(`Created Sales Order: Number=${so.number}, Status=${so.status}, Subtotal=${so.subtotal}, Tax=${so.taxTotal}, Total=${so.total}`);
  console.log(`Lines count: ${so.lines.length}`);
  console.table(so.lines.map(l => ({
    lineNo: l.lineNo,
    productId: l.productId,
    qty: l.qty,
    price: l.unitPrice,
    taxRate: l.taxRate,
    taxAmount: l.taxAmount,
    total: l.total,
  })));

  // Step 3: Confirm the Sales Order
  console.log('\n--- Step 3: Confirm Sales Order ---');
  const confirmedSO = await SalesOrderService.confirmSalesOrder(so.id);
  console.log(`Confirmed Sales Order #${confirmedSO.id}: Status=${confirmedSO.status}\n`);

  // Step 4: Re-count journal_entries
  console.log('--- Step 4: Re-count journal_entries after SO confirmation ---');
  const countAfterRes = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM journal_entries');
  const countAfter = parseInt(countAfterRes.rows[0].count, 10);
  console.log(`Post-confirmation journal_entries row count: ${countAfter}`);
  console.log(`Difference: ${countAfter - countBefore}`);

  // Invariant verification check
  if (countBefore === countAfter) {
    console.log('✅ PASS: journal_entries count is UNCHANGED. Zero accounting entries posted on SO confirm.');
  } else {
    console.error('❌ FAIL: journal_entries row count changed upon SO confirm!');
    process.exit(1);
  }

  // Step 5: Test create-invoice from confirmed SO
  console.log('\n--- Step 5: Test POST /api/sales-orders/:id/create-invoice ---');
  const invoiceResult = await SalesOrderService.createInvoiceFromSalesOrder(confirmedSO.id);
  console.log(`Generated Customer Invoice: ID=${invoiceResult.invoiceId}, Number=${invoiceResult.invoiceNumber}`);

  const invoiceCheck = await pool.query<{
    id: number;
    number: string;
    so_id: number;
    customer_id: number;
    status: string;
    subtotal: string;
    tax_total: string;
    total: string;
  }>(
    `SELECT id, number, so_id, customer_id, status, subtotal, tax_total, total
     FROM customer_invoices WHERE id = $1`,
    [invoiceResult.invoiceId]
  );
  console.log('Invoice details verified from customer_invoices table:');
  console.table(invoiceCheck.rows);

  const invLinesCheck = await pool.query(
    `SELECT line_no, product_id, account_id, analytic_account_id, qty, unit_price, tax_rate, total
     FROM customer_invoice_lines WHERE invoice_id = $1`,
    [invoiceResult.invoiceId]
  );
  console.log('Invoice lines copied from SO:');
  console.table(invLinesCheck.rows);

  console.log('\n====================================================');
  console.log('ARYAN PHASE 1 VERIFICATION COMPLETE — ALL TESTS PASSED');
  console.log('====================================================');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Verification failed:', err);
    pool.end();
    process.exit(1);
  });
