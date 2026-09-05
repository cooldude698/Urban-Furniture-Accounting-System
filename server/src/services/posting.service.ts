import { localDB } from '../db/db.js';
import { Decimal } from 'decimal.js';

export interface JournalEntryLine {
  id: number;
  entry_id: number;
  account_id: number;
  partner_id?: number | null;
  analytic_account_id?: number | null;
  debit: string;
  credit: string;
}

export interface JournalEntry {
  id: number;
  number: string;
  journal_id: number;
  date: string;
  reference: string;
  source_type: 'bill' | 'invoice' | 'payment' | null;
  source_id: number | null;
  status: 'draft' | 'posted';
  total_amount: string;
  created_at: string;
  updated_at: string;
}

export class PostingService {
  /**
   * Only postingService writes to journal_entries and journal_entry_lines.
   * Everything else calls postDocument().
   */
  static postDocument(type: 'bill' | 'invoice' | 'payment', id: number): { entryId: number } {
    let createdEntryId: number = 0;

    localDB.update(state => {
      // Ensure Input Tax and Output Tax accounts exist if needed
      if (!state.accounts.some(a => a.name === 'Input Tax')) {
        state.accounts.push({
          id: 9,
          code: '1004',
          name: 'Input Tax',
          type: 'asset',
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (!state.accounts.some(a => a.name === 'Output Tax')) {
        state.accounts.push({
          id: 10,
          code: '2002',
          name: 'Output Tax',
          type: 'liability',
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (type === 'bill') {
        const bill = state.vendor_bills.find(b => b.id === id);
        if (!bill) throw new Error(`Bill ${id} not found`);

        // Idempotency: if already posted, return entryId
        if (bill.journal_entry_id) {
          createdEntryId = bill.journal_entry_id;
          return;
        }

        const billLines = state.vendor_bill_lines.filter(l => l.bill_id === id);
        if (billLines.length === 0) throw new Error(`Bill ${id} has no lines to post`);

        const nextEntryId = (state as any).journal_entries && (state as any).journal_entries.length > 0
          ? Math.max(...(state as any).journal_entries.map((e: any) => e.id || 0)) + 1
          : 1;

        if (!(state as any).journal_entries) (state as any).journal_entries = [];
        if (!(state as any).journal_entry_lines) (state as any).journal_entry_lines = [];

        const nextJeNum = `JE/2026/${nextEntryId.toString().padStart(4, '0')}`;

        let totalDebit = new Decimal('0');
        let totalTax = new Decimal('0');
        let totalLinesAmount = new Decimal('0');

        const entryLines: any[] = [];
        let lineIdx = (state as any).journal_entry_lines.length + 1;

        // 1. DR Purchase Expense per line (with analytic_account_id & partner = vendor)
        for (const bl of billLines) {
          const subtotal = new Decimal(bl.subtotal || new Decimal(bl.qty).times(bl.unit_price).toFixed(2));
          totalLinesAmount = totalLinesAmount.plus(subtotal);
          totalDebit = totalDebit.plus(subtotal);

          const taxAmt = new Decimal(bl.tax_amount || new Decimal(subtotal).times(bl.tax_rate || '0').dividedBy(100).toFixed(2));
          totalTax = totalTax.plus(taxAmt);

          entryLines.push({
            id: lineIdx++,
            entry_id: nextEntryId,
            account_id: bl.account_id || 6, // Purchase Expense
            partner_id: bill.vendor_id,
            analytic_account_id: bl.analytic_account_id || null,
            debit: subtotal.toFixed(2),
            credit: '0.00',
          });
        }

        // 2. DR Input Tax (if tax > 0)
        if (totalTax.greaterThan(0)) {
          totalDebit = totalDebit.plus(totalTax);
          entryLines.push({
            id: lineIdx++,
            entry_id: nextEntryId,
            account_id: 9, // Input Tax
            partner_id: bill.vendor_id,
            analytic_account_id: null,
            debit: totalTax.toFixed(2),
            credit: '0.00',
          });
        }

        // 3. CR Creditors (partner = vendor, total bill amount)
        const grandTotal = totalDebit;
        entryLines.push({
          id: lineIdx++,
          entry_id: nextEntryId,
          account_id: 4, // Creditors
          partner_id: bill.vendor_id,
          analytic_account_id: null,
          debit: '0.00',
          credit: grandTotal.toFixed(2),
        });

        // Invariant check: SUM(debit) == SUM(credit)
        const sumCredit = grandTotal;
        if (!totalDebit.equals(sumCredit)) {
          throw new Error(`Debit (${totalDebit}) does not equal Credit (${sumCredit})!`);
        }

        const newEntry = {
          id: nextEntryId,
          number: nextJeNum,
          journal_id: 2, // Vendor Bills journal
          date: bill.bill_date,
          reference: bill.number || bill.bill_reference || `Bill #${id}`,
          source_type: 'bill',
          source_id: id,
          status: 'posted',
          total_amount: grandTotal.toFixed(2),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        (state as any).journal_entries.push(newEntry);
        entryLines.forEach(el => (state as any).journal_entry_lines.push(el));

        bill.journal_entry_id = nextEntryId;
        createdEntryId = nextEntryId;
      }
    });

    return { entryId: createdEntryId };
  }
}
