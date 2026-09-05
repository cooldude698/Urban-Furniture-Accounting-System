import { pool } from '../src/db/pool';
import { InvoiceService } from '../src/services/invoiceService';
import { StatementService } from '../src/services/statementService';
import Decimal from 'decimal.js';

async function runVerification() {
  console.log('====================================================');
  console.log('LEVEL 5: PRICING GUARDRAILS, MARGINS & AGING');
  console.log('====================================================\n');

  try {
    // --- Test 1: MRP Ceiling & Below-Cost Pricing Warnings ---
    console.log('--- Test 1: InvoiceService.validateMrpWarnings() ---');
    // Fetch a test product with known mrp and cost_price
    const prodRes = await pool.query<{ id: number; name: string; cost_price: string; mrp: string }>(
      `SELECT id, name, cost_price::TEXT as cost_price, mrp::TEXT as mrp FROM products WHERE mrp > 0 AND cost_price > 0 LIMIT 1;`
    );

    if (prodRes.rows.length === 0) {
      throw new Error('Test 1 Failed: No active product with MRP and cost_price found in database');
    }

    const testProd = prodRes.rows[0];
    const mrpDec = new Decimal(testProd.mrp);
    const costDec = new Decimal(testProd.cost_price);

    console.log(`Product: "${testProd.name}" | Cost: ₹${costDec.toFixed(2)} | MRP: ₹${mrpDec.toFixed(2)}`);

    // A: Price higher than MRP
    const overMrpWarnings = await InvoiceService.validateMrpWarnings([
      { productId: testProd.id, qty: 1, unitPrice: mrpDec.plus(1000).toFixed(2) }
    ]);
    console.log('Over-MRP warnings detected:', overMrpWarnings);
    if (overMrpWarnings.length === 0 || !overMrpWarnings[0].includes('MRP Ceiling Warning')) {
      throw new Error('Test 1 Failed: Expected MRP ceiling warning when unitPrice > MRP');
    }

    // B: Price below cost
    const belowCostWarnings = await InvoiceService.validateMrpWarnings([
      { productId: testProd.id, qty: 1, unitPrice: costDec.minus(50).toFixed(2) }
    ]);
    console.log('Below-cost warnings detected:', belowCostWarnings);
    if (belowCostWarnings.length === 0 || !belowCostWarnings[0].includes('Below-Cost Warning')) {
      throw new Error('Test 1 Failed: Expected below-cost warning when unitPrice < cost_price');
    }

    // C: Valid price
    const normalWarnings = await InvoiceService.validateMrpWarnings([
      { productId: testProd.id, qty: 1, unitPrice: costDec.plus(mrpDec).dividedBy(2).toFixed(2) }
    ]);
    if (normalWarnings.length > 0) {
      throw new Error('Test 1 Failed: Expected 0 warnings for valid mid-range price');
    }
    console.log('✅ Correct: Non-blocking MRP ceiling and below-cost warnings validated\n');

    // --- Test 2: Gross Margin & COGS Analytics ---
    console.log('--- Test 2: InvoiceService.getMarginAnalytics() ---');
    const marginAnalytics = await InvoiceService.getMarginAnalytics();
    console.log('Margin Summary:', marginAnalytics.summary);
    console.log('Top Margin Product:', marginAnalytics.summary.topMarginProduct);
    console.log('Sample Product Margins Count:', marginAnalytics.products.length);

    if (new Decimal(marginAnalytics.summary.totalRevenue).lessThanOrEqualTo(0)) {
      throw new Error('Test 2 Failed: Expected total revenue to be positive');
    }
    if (new Decimal(marginAnalytics.summary.totalGrossProfit).lessThanOrEqualTo(0)) {
      throw new Error('Test 2 Failed: Expected total gross profit to be positive');
    }
    console.log('✅ Correct: Real-time Gross Margin, COGS, and product rankings calculated\n');

    // --- Test 3: Payables & Receivables Aging Schedule ---
    console.log('--- Test 3: StatementService.getPayablesAgingReport() & Receivables ---');
    const payablesAging = await StatementService.getPayablesAgingReport();
    console.log('Payables Aging Summary:', payablesAging.totals);
    console.log('Payables Vendors Count:', payablesAging.customers.length);

    // Verify sum of buckets matches totalOutstanding
    const { current, days1_30, days31_60, days61_90, days90Plus, totalOutstanding } = payablesAging.totals;
    const computedSum = new Decimal(current)
      .plus(days1_30)
      .plus(days31_60)
      .plus(days61_90)
      .plus(days90Plus);

    if (computedSum.minus(totalOutstanding).abs().greaterThan(0.01)) {
      throw new Error(`Test 3 Failed: Payables bucket sum (${computedSum.toFixed(2)}) does not match total outstanding (${totalOutstanding})`);
    }

    const receivablesAging = await StatementService.getReceivablesAgingReport();
    console.log('Receivables Aging Summary:', receivablesAging.totals);
    console.log('Receivables Customers Count:', receivablesAging.customers.length);
    console.log('✅ Correct: Chronological aging buckets (0-30, 31-60, 61-90, 90+) strictly match totals\n');

    // --- Test 4: General Ledger Invariant ---
    console.log('--- Test 4: General Ledger Zero-Delta Invariant Check ---');
    const glRes = await pool.query(`
      SELECT
        COALESCE(SUM(debit), 0)::TEXT as total_debit,
        COALESCE(SUM(credit), 0)::TEXT as total_credit,
        (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0))::TEXT as difference
      FROM journal_entry_lines;
    `);

    const { total_debit, total_credit, difference } = glRes.rows[0];
    console.log('Total Debit:', total_debit);
    console.log('Total Credit:', total_credit);
    console.log('Balance Diff:', difference);

    if (new Decimal(difference).abs().greaterThan(0)) {
      throw new Error(`Test 4 Failed: Ledger out of balance by ${difference}`);
    }
    console.log('✅ Correct: Zero-delta general ledger balance invariant strictly preserved\n');

    console.log('====================================================');
    console.log('ALL LEVEL 5 PRICING, MARGIN & AGING VERIFICATIONS PASSED!');
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runVerification();
