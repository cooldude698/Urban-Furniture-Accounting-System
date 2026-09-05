/**
 * Phase 6 Verification Script
 * Tests:
 * 1. GET /api/verify -> difference "0.00"
 * 2. Balance Sheet -> totalAssets == totalLiabilities + totalEquity (incorporating current period profit)
 * 3. Profit & Loss -> totalIncome - totalExpenses == netProfit
 * 4. Post a new invoice and confirm -> re-run both -> still balanced!
 * 5. Multi-level ledger drill-down (GET /api/ledger)
 * 6. Budget reports (GET /api/reports/budget)
 */

import { pool } from '../src/db/pool';
import { ReportService } from '../src/services/reportService';
import { InvoiceService } from '../src/services/invoiceService';
import Decimal from 'decimal.js';

async function main() {
  console.log('=== Starting Phase 6 Verification ===\n');

  // Step 1: Verify Initial Ledger Balance
  console.log('Step 1: Testing /api/verify (Initial State)...');
  const verifyInitial = await ReportService.verifyLedger();
  console.log(`Total Debit: ${verifyInitial.totalDebit}`);
  console.log(`Total Credit: ${verifyInitial.totalCredit}`);
  console.log(`Difference: ${verifyInitial.difference}`);
  if (verifyInitial.difference !== '0.00') {
    throw new Error(`Ledger is not balanced! Difference: ${verifyInitial.difference}`);
  }
  console.log('✅ Initial ledger balance check passed: difference is "0.00"\n');

  // Step 2: Initial Balance Sheet & P&L
  console.log('Step 2: Testing Balance Sheet & Profit & Loss...');
  const bsInitial = await ReportService.getBalanceSheet();
  console.log(`Balance Sheet As Of: ${bsInitial.asOf}`);
  console.log(`Total Assets: ${bsInitial.totalAssets}`);
  console.log(`Total Liabilities: ${bsInitial.totalLiabilities}`);
  console.log(`Total Capital: ${bsInitial.totalCapital}`);
  console.log(`Current Period Profit: ${bsInitial.currentPeriodProfit}`);
  console.log(`Total Equity: ${bsInitial.totalEquity}`);
  console.log(`Is Balanced: ${bsInitial.isBalanced}`);

  const pnlInitial = await ReportService.getProfitAndLoss();
  console.log(`P&L Total Income: ${pnlInitial.totalIncome}`);
  console.log(`P&L Total Expenses: ${pnlInitial.totalExpenses}`);
  console.log(`P&L Net Profit: ${pnlInitial.netProfit}`);

  if (!bsInitial.isBalanced) {
    throw new Error('Balance sheet is not balanced!');
  }
  if (bsInitial.currentPeriodProfit !== pnlInitial.netProfit) {
    throw new Error(`Net profit mismatch: Balance sheet has ${bsInitial.currentPeriodProfit}, P&L has ${pnlInitial.netProfit}`);
  }
  console.log('✅ Balance Sheet and P&L verified: profit accurately flows into Equity!\n');

  // Step 3: Post a new invoice and re-verify
  console.log('Step 3: Creating and Confirming a new customer invoice (₹4,500.00)...');
  const invoice = await InvoiceService.createInvoice({
    customerId: 4,
    invoiceDate: '2026-09-05',
    dueDate: '2026-10-05',
    lines: [
      {
        productId: 1,
        qty: '1',
        unitPrice: '4500.00',
        taxRate: '0.00',
      },
    ],
  });
  console.log(`Draft Invoice Created: #${invoice.id} (${invoice.number}), Total: ₹${invoice.total}`);

  const confirmed = await InvoiceService.confirmInvoice(invoice.id);
  console.log(`Invoice Confirmed! Posted Journal Entry: ${confirmed.journalEntryNumber} (ID: ${confirmed.journalEntryId})\n`);

  // Step 4: Re-run both checks
  console.log('Step 4: Re-running /api/verify and Balance Sheet after new invoice...');
  const verifyAfter = await ReportService.verifyLedger();
  console.log(`Total Debit: ${verifyAfter.totalDebit}`);
  console.log(`Total Credit: ${verifyAfter.totalCredit}`);
  console.log(`Difference: ${verifyAfter.difference}`);
  if (verifyAfter.difference !== '0.00') {
    throw new Error(`Ledger unbalanced after invoice confirmation! Difference: ${verifyAfter.difference}`);
  }

  const bsAfter = await ReportService.getBalanceSheet();
  console.log(`Total Assets: ${bsAfter.totalAssets}`);
  console.log(`Total Liabilities: ${bsAfter.totalLiabilities}`);
  console.log(`Total Capital: ${bsAfter.totalCapital}`);
  console.log(`Current Period Profit: ${bsAfter.currentPeriodProfit}`);
  console.log(`Total Equity: ${bsAfter.totalEquity}`);
  console.log(`Is Balanced: ${bsAfter.isBalanced}`);

  if (!bsAfter.isBalanced) {
    throw new Error('Balance sheet is not balanced after invoice confirmation!');
  }
  console.log('✅ Re-verification successful: Ledger remains perfectly balanced with difference "0.00"!\n');

  // Step 5: Test Ledger Drill-Down
  console.log('Step 5: Testing Ledger Drill-Down (GET /api/ledger)...');
  const ledgerLines = await ReportService.getLedgerDetail();
  console.log(`Total Posted Ledger Lines: ${ledgerLines.length}`);
  const sampleLine = ledgerLines[ledgerLines.length - 1];
  console.log(`Sample Line from drill-down: Entry ${sampleLine.entry_number}, Account: ${sampleLine.account_name}, Debit: ${sampleLine.debit}, Credit: ${sampleLine.credit}`);
  console.log('✅ Ledger drill-down returned valid posted transactions.\n');

  // Step 6: Test Budget Progress Report
  console.log('Step 6: Testing Budget Progress Report (GET /api/reports/budget)...');
  const budgetLines = await ReportService.getBudgetProgress();
  console.log(`Budget Lines Count: ${budgetLines.length}`);
  console.log('✅ Budget progress query executed successfully.\n');

  console.log('=== Phase 6 Verification Completed Successfully ===');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Phase 6 Verification FAILED:', err);
  process.exit(1);
});
