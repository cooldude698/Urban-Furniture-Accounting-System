import { ProductService } from '../src/services/product.service.js';
import { PurchaseOrderService } from '../src/services/purchaseOrder.service.js';
import { VendorBillService } from '../src/services/vendorBill.service.js';
import { localDB } from '../src/db/db.js';

async function main() {
  console.log('=== VERIFYING PHASE 6: TIER 1 EXTRAS (SKU GEN, ALERTS, PRICING CHECKS) ===\n');

  // 1. Test SKU Generator format: CATEGORY-INITIALS-####
  console.log('[Test 1] Testing SKU Generator:');
  const sku1 = ProductService.generateSku('Office Furniture', 'Executive Ergonomic Chair');
  const sku2 = ProductService.generateSku('Living Room', 'Solid Teak Coffee Table');
  const sku3 = ProductService.generateSku('Services', 'Full Assembly And Polishing Service');

  console.log(`- "Office Furniture" + "Executive Ergonomic Chair" -> SKU: ${sku1}`);
  console.log(`- "Living Room" + "Solid Teak Coffee Table" -> SKU: ${sku2}`);
  console.log(`- "Services" + "Full Assembly And Polishing Service" -> SKU: ${sku3}`);

  const skuRegex = /^[A-Z0-9]+-[A-Z0-9]+-\d{4}$/;
  if (!skuRegex.test(sku1) || !skuRegex.test(sku2)) {
    throw new Error(`Generated SKU does not match expected CATEGORY-INITIALS-#### format! Got: ${sku1}`);
  }
  console.log('  ✓ SKU format validation passed.');

  // 2. Test Stock Alerts (Low stock & Slow-mover detection)
  console.log('\n[Test 2] Testing Stock & Slow-Mover Alerts:');
  const alerts = ProductService.getStockAlerts(30);
  console.log(`- Total Low Stock items (qty <= min_threshold): ${alerts.lowStock.length}`);
  alerts.lowStock.forEach(p => {
    console.log(`  * ${p.sku}: ${p.name} (Stock: ${p.stock_qty || 0}, Threshold: ${p.min_stock_threshold ?? 5})`);
  });
  console.log(`- Total Slow Mover items (no movement in 30 days): ${alerts.slowMovers.length}`);
  console.log('  ✓ Inventory alert queries executed successfully.');

  // 3. Test Below-Cost Pricing Non-Blocking Warning
  console.log('\n[Test 3] Testing Below-Cost Warning Check:');
  // Get an existing product
  const products = ProductService.getAll();
  const testProd = products.find(p => Number(p.cost_price) > 0) || products[0];
  console.log(`- Test product: ${testProd.name} (Cost: ₹${testProd.cost_price}, MRP: ₹${testProd.mrp || '0.00'})`);

  // Below-cost price
  const belowCostPrice = (Number(testProd.cost_price) * 0.5).toFixed(2);
  const belowCostWarning = ProductService.checkPricingWarnings(testProd.id!, belowCostPrice);
  console.log(`- Testing price ₹${belowCostPrice} (< cost ₹${testProd.cost_price}):`);
  console.log(`  Warning: "${belowCostWarning}"`);
  if (!belowCostWarning || !belowCostWarning.includes('below product cost price')) {
    throw new Error('Expected below-cost warning was not triggered!');
  }
  console.log('  ✓ Below-cost warning triggered correctly.');

  // 4. Test MRP Ceiling Non-Blocking Warning
  console.log('\n[Test 4] Testing MRP Ceiling Warning Check:');
  const aboveMrpPrice = (Number(testProd.mrp || 1000) + 500).toFixed(2);
  const mrpWarning = ProductService.checkPricingWarnings(testProd.id!, aboveMrpPrice);
  console.log(`- Testing price ₹${aboveMrpPrice} (> MRP ₹${testProd.mrp}):`);
  console.log(`  Warning: "${mrpWarning}"`);
  if (!mrpWarning || !mrpWarning.includes('exceeds MRP ceiling')) {
    throw new Error('Expected MRP ceiling warning was not triggered!');
  }
  console.log('  ✓ MRP ceiling warning triggered correctly.');

  // 5. Test Non-Blocking Purchase Order Confirm with Below-Cost / Price Warning
  console.log('\n[Test 5] Testing Non-Blocking PO Confirm with Pricing Warning:');
  const po = PurchaseOrderService.create({
    vendor_id: 1,
    po_date: '2026-09-05',
    lines: [
      {
        product_id: testProd.id!,
        qty: 3,
        unit_price: belowCostPrice, // triggers below-cost warning
      },
    ],
  });

  const confirmRes = PurchaseOrderService.confirm(po.id!);
  if (!confirmRes) throw new Error('PO confirm failed');

  console.log(`- PO #${confirmRes.po.id} Status: ${confirmRes.po.status}`);
  console.log(`- PO Has Warning: ${confirmRes.budgetCheck.hasWarning}`);
  console.log(`- PO Warning Message: "${confirmRes.budgetCheck.warningMessage}"`);

  if (confirmRes.po.status !== 'confirmed') {
    throw new Error('PO confirmation should succeed despite non-blocking pricing warning!');
  }
  if (!confirmRes.budgetCheck.hasWarning) {
    throw new Error('Expected non-blocking pricing warning was not attached to PO result!');
  }
  console.log('  ✓ PO confirmed successfully with non-blocking pricing warning attached.');

  console.log('\n=== ALL PHASE 6 VERIFICATION CHECKS PASSED PERFECTLY ===');
}

main().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
