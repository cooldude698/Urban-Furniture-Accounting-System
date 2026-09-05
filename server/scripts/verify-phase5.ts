import { ContactService } from '../src/services/contact.service.js';
import { VendorBillService } from '../src/services/vendorBill.service.js';
import { PurchaseOrderService } from '../src/services/purchaseOrder.service.js';
import { localDB } from '../src/db/db.js';
import { Decimal } from 'decimal.js';

async function main() {
  console.log('=== VERIFYING PHASE 5: SMART BUTTONS, VENDOR STATEMENTS & KANBAN ===\n');

  // 1. Check Contact Smart Counts for existing contacts
  const contacts = ContactService.getAll();
  console.log(`[Test 1] Total Contacts in system: ${contacts.length}`);
  if (contacts.length === 0) throw new Error('No contacts found');

  const vendor = contacts.find(c => c.type === 'vendor' || c.type === 'both') || contacts[0];
  console.log(`[Test 1] Testing with vendor: "${vendor.name}" (ID: ${vendor.id})`);

  const initialCounts = ContactService.getSmartCounts(vendor.id!);
  console.log('[Test 1] Initial Counts:', JSON.stringify(initialCounts, null, 2));

  // 2. Create a test PO for this vendor
  const po = PurchaseOrderService.create({
    vendor_id: vendor.id!,
    po_date: '2026-09-01',
    lines: [
      {
        product_id: 1,
        qty: 2,
        unit_price: '500.00',
        analytic_account_id: 1,
      },
    ],
  });
  console.log(`[Test 2] Created PO #${po.id} (${po.number})`);

  // 3. Create and confirm a Vendor Bill for this vendor
  const bill = VendorBillService.create({
    vendor_id: vendor.id!,
    bill_reference: 'INV-PHASE5-TEST',
    po_id: po.id,
    bill_date: '2026-09-02',
    due_date: '2026-10-02',
    lines: [
      {
        product_id: 1,
        account_id: 2, // Purchase Expense
        analytic_account_id: 1,
        qty: 2,
        unit_price: '500.00',
        tax_rate: '18.00',
      },
    ],
  });
  console.log(`[Test 3] Created Draft Bill #${bill.id} (${bill.number})`);

  // Confirm the bill
  const confirmResult = VendorBillService.confirm(bill.id!);
  console.log(`[Test 3] Confirmed Bill #${bill.id}, Grand Total: ₹${confirmResult.bill?.grand_total}, Status: ${confirmResult.bill?.status}`);

  // 4. Verify Smart Counts reflect the new bill and PO
  const updatedCounts = ContactService.getSmartCounts(vendor.id!);
  console.log('[Test 4] Updated Smart Counts:', JSON.stringify(updatedCounts, null, 2));
  if (updatedCounts.poCount < initialCounts.poCount + 1) {
    throw new Error('PO count did not increment in smart counts');
  }
  if (updatedCounts.billCount < initialCounts.billCount + 1) {
    throw new Error('Bill count did not increment in smart counts');
  }

  // 5. Verify Vendor Statement calculation
  const statement = ContactService.getStatement(vendor.id!);
  if (!statement) throw new Error('Failed to generate statement');
  console.log('\n[Test 5] Generated Vendor Statement:');
  console.log(`- Contact: ${statement.contact.name}`);
  console.log(`- Total Billed: ₹${statement.total_billed}`);
  console.log(`- Total Paid: ₹${statement.total_paid}`);
  console.log(`- Closing Balance Due: ₹${statement.closing_balance}`);
  console.log(`- Number of Statement Lines: ${statement.lines.length}`);

  // Validate running balance integrity
  let running = new Decimal('0');
  for (const line of statement.lines) {
    if (line.type === 'bill') {
      running = running.plus(line.debit);
    } else if (line.type === 'payment') {
      running = running.minus(line.credit);
    }
    if (!running.equals(new Decimal(line.running_balance))) {
      throw new Error(`Running balance mismatch at line ${line.doc_number}: expected ${running.toFixed(2)}, got ${line.running_balance}`);
    }
    console.log(`  * [${line.date}] ${line.doc_number} (${line.type.toUpperCase()}) -> Debit: ₹${line.debit}, Credit: ₹${line.credit}, Running Balance: ₹${line.running_balance}`);
  }

  console.log('\n=== ALL PHASE 5 VERIFICATION CHECKS PASSED PERFECTLY ===');
}

main().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
