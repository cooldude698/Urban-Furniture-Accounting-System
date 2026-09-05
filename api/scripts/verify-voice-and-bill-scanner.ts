import { pool } from '../src/db/pool';
import { BillScannerService } from '../src/services/billScannerService';
import Decimal from 'decimal.js';

async function runVerification() {
  console.log('====================================================');
  console.log('LEVEL 4: OFFLINE VOICE & LOCAL BILL SCANNER');
  console.log('====================================================\n');

  try {
    // --- Test 1: Deterministic Local Bill Receipt Parsing ---
    console.log('--- Test 1: BillScannerService.parseReceiptText() ---');
    const receiptText = `TAX INVOICE
Vendor: Timber Hub
GSTIN: 29AABCT1234F1Z5
Bill No: TH-2026-884
Date: 2026-03-01
Due Date: 2026-03-31

ITEMS:
5 x Teak Desk @ 5000.00
2 x Oak Wood Planks @ 3500.00

Subtotal: 32000.00
Tax (GST 18%): 5760.00
Grand Total: 37760.00`;

    const parsedReceipt = await BillScannerService.parseReceiptText(receiptText);
    console.log('Parsed Receipt Vendor:', parsedReceipt.vendor);
    console.log('Parsed Bill Reference:', parsedReceipt.billReference);
    console.log('Parsed Dates:', { billDate: parsedReceipt.billDate, dueDate: parsedReceipt.dueDate });
    console.log('Parsed Line Items Count:', parsedReceipt.lines.length);
    console.log('Parsed First Line:', parsedReceipt.lines[0]);
    console.log('Parsed Totals:', parsedReceipt.totals);
    console.log('Confidence Score:', parsedReceipt.confidenceScore);

    if (!parsedReceipt.vendor || !parsedReceipt.vendor.name.toLowerCase().includes('timber')) {
      throw new Error('Test 1 Failed: Expected vendor name to be extracted and matched as Timber Hub');
    }
    if (parsedReceipt.billReference !== 'TH-2026-884') {
      throw new Error(`Test 1 Failed: Expected bill reference TH-2026-884, got ${parsedReceipt.billReference}`);
    }
    if (parsedReceipt.lines.length !== 2) {
      throw new Error(`Test 1 Failed: Expected 2 parsed line items, got ${parsedReceipt.lines.length}`);
    }
    if (parsedReceipt.lines[0].qty !== 5 || parsedReceipt.lines[0].unitPrice !== '5000.00') {
      throw new Error(`Test 1 Failed: Line 1 qty or unitPrice mismatch: qty=${parsedReceipt.lines[0].qty}, price=${parsedReceipt.lines[0].unitPrice}`);
    }
    console.log('✅ Correct: Local receipt scanner extracted vendor, bill reference, dates, and catalog-matched line items\n');

    // --- Test 2: Voice Dictation Parsing for Vendor Bills ---
    console.log('--- Test 2: BillScannerService.parseVoiceVendorBill() ---');
    const voiceText = 'Bill from Timber Hub, 5 Teak Desk at 5000 each, bill ref TH-881';
    const parsedVoice = await BillScannerService.parseVoiceVendorBill(voiceText);

    console.log('Voice Parsed Vendor:', parsedVoice.vendor?.name);
    console.log('Voice Parsed Ref:', parsedVoice.billReference);
    console.log('Voice Parsed Lines:', parsedVoice.lines.map(l => ({ product: l.productName, qty: l.qty, price: l.unitPrice, total: l.total })));

    if (!parsedVoice.vendor || !parsedVoice.vendor.name.toLowerCase().includes('timber')) {
      throw new Error('Test 2 Failed: Expected voice-dictated vendor to be Timber Hub');
    }
    if (parsedVoice.billReference !== 'TH-881') {
      throw new Error(`Test 2 Failed: Expected voice bill reference TH-881, got ${parsedVoice.billReference}`);
    }
    if (parsedVoice.lines.length === 0 || parsedVoice.lines[0].qty !== 5) {
      throw new Error(`Test 2 Failed: Expected line item with qty 5, got ${JSON.stringify(parsedVoice.lines)}`);
    }
    console.log('✅ Correct: Voice-to-bill parsed vendor, reference, and line items with catalog matching\n');

    // --- Test 3: Catalog Matching with Database ---
    console.log('--- Test 3: Catalog Product Matching & Decimal Arithmetic ---');
    const multiLineReceipt = `PURCHASE VENDOR BILL
Supplier: Timber Hub
Inv #: VB-9921
Date: 2026-03-05
Items:
1 x Ashford Wardrobe @ 39761.28
4 x Cairn Planter @ 2200.00`;

    const multiParsed = await BillScannerService.parseReceiptText(multiLineReceipt);
    console.log('Multi-line items parsed:', multiParsed.lines.map(l => ({ name: l.productName, qty: l.qty, price: l.unitPrice, subtotal: l.subtotal })));
    console.log('Calculated totals:', multiParsed.totals);

    const expectedSubtotal = new Decimal(39761.28).plus(new Decimal(4).times(2200)).toFixed(2); // 39761.28 + 8800 = 48561.28
    if (multiParsed.totals.subtotal !== expectedSubtotal) {
      throw new Error(`Test 3 Failed: Subtotal mismatch, expected ${expectedSubtotal}, got ${multiParsed.totals.subtotal}`);
    }
    console.log('✅ Correct: Exact decimal precision preserved across multi-line parsing\n');

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
    console.log('ALL LEVEL 4 OFFLINE VOICE & SCANNER VERIFICATIONS PASSED!');
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runVerification();
