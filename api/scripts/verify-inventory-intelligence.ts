import { ProductService } from '../src/services/productService';
import { pool } from '../src/db/pool';

async function run() {
  console.log('====================================================');
  console.log('LEVEL 3: INVENTORY INTELLIGENCE & STOCK ANALYTICS');
  console.log('====================================================\n');

  // Test 1: Inventory Analytics Retrieval
  console.log('--- Test 1: ProductService.getInventoryAnalytics() ---');
  const analytics = await ProductService.getInventoryAnalytics();

  console.log('Summary metrics:', analytics.summary);
  console.log(`Fast-moving items found: ${analytics.fastMoving.length}`);
  if (analytics.fastMoving.length > 0) {
    console.log('Top Fast Mover:', analytics.fastMoving[0]);
  }

  console.log(`Slow-moving items found: ${analytics.slowMoving.length}`);
  if (analytics.slowMoving.length > 0) {
    console.log('Top Slow Mover / Clearance:', analytics.slowMoving[0]);
  }

  console.log('Location Breakdown:', analytics.locationBreakdown);

  const warehouseLoc = analytics.locationBreakdown.find((l) => l.code === 'WH-BLR-01');
  const showroomLoc = analytics.locationBreakdown.find((l) => l.code === 'SHW-IND-01');

  if (
    analytics.fastMoving.length > 0 &&
    analytics.slowMoving.length > 0 &&
    warehouseLoc &&
    warehouseLoc.percentage === 70 &&
    showroomLoc &&
    showroomLoc.percentage === 30 &&
    analytics.summary.totalStockUnits > 0
  ) {
    console.log('✅ Correct: Real-time fast/slow movers and multi-location breakdown calculated\n');
  } else {
    console.error('❌ Failed Test 1: getInventoryAnalytics failed verification');
    process.exit(1);
  }

  // Test 2: Deterministic SKU Generation
  console.log('--- Test 2: ProductService.generateDeterministicSku() ---');
  const sku1 = await ProductService.generateDeterministicSku('Seating', 'Teak Chair', '26');
  const sku2 = await ProductService.generateDeterministicSku('Tables', 'Oak Desk', '26');
  const sku3 = await ProductService.generateDeterministicSku('Storage', 'Wardrobe', '2026');

  console.log('Generated SKU 1 (Seating, Teak):', sku1);
  console.log('Generated SKU 2 (Tables, Oak):', sku2);
  console.log('Generated SKU 3 (Storage, Wardrobe):', sku3);

  const skuPattern = /^[A-Z0-9]{3,4}-[A-Z0-9]{3,4}-\d{2}-\d{4}$/;

  if (skuPattern.test(sku1) && skuPattern.test(sku2) && skuPattern.test(sku3)) {
    console.log('✅ Correct: Generated SKUs match deterministic CAT-MAT-YEAR-SEQ format\n');
  } else {
    console.error('❌ Failed Test 2: SKU format does not match CAT-MAT-YEAR-SEQ pattern');
    process.exit(1);
  }

  // Test 3: Stock Alerts (Low Stock & Slow Movers)
  console.log('--- Test 3: ProductService.getStockAlerts() ---');
  const alerts = await ProductService.getStockAlerts();
  console.log(`Low stock alerts count: ${alerts.lowStock.length}`);
  console.log(`Slow movers count: ${alerts.slowMovers.length}`);

  if (Array.isArray(alerts.lowStock) && Array.isArray(alerts.slowMovers)) {
    console.log('✅ Correct: Low stock and slow movers alerts retrieved successfully\n');
  } else {
    console.error('❌ Failed Test 3: getStockAlerts output is invalid');
    process.exit(1);
  }

  // Test 4: General Ledger Invariant
  console.log('--- Test 4: General Ledger Zero-Delta Invariant Check ---');
  const ledgerRes = await pool.query(
    'SELECT SUM(debit) as debit, SUM(credit) as credit, SUM(debit) - SUM(credit) as diff FROM journal_entry_lines;'
  );
  const { debit, credit, diff } = ledgerRes.rows[0];
  console.log(`Total Debit: ${debit}`);
  console.log(`Total Credit: ${credit}`);
  console.log(`Balance Diff: ${diff}`);

  if (diff === '0.00' || Number(diff) === 0) {
    console.log('✅ Correct: Zero-delta general ledger balance invariant strictly preserved\n');
  } else {
    console.error('❌ Failed Test 4: Ledger balance delta is non-zero!');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('ALL LEVEL 3 INVENTORY INTELLIGENCE VERIFICATIONS PASSED!');
  console.log('====================================================');
  await pool.end();
}

run().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
