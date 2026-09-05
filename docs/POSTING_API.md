# Posting Service API Contract (For Aman & Aryan)

> **Authority:** Vedesh (Backend Spine)  
> **Audience:** Aman (Purchase / Vendor Bills) & Aryan (Sales / Customer Invoices)  
> **Status:** Locked for Phase 3+

---

## 1. The Single Rule

**Never touch `journal_entries` or `journal_entry_lines` directly.**  
All ledger entries are written strictly by `PostingService.postDocument()`.

Confirming a Purchase Order (`purchase_orders`) or Sales Order (`sales_orders`) **creates zero journal entries**.  
Journal entries post **only** on Vendor Bill confirmation, Customer Invoice confirmation, or Payment processing.

---

## 2. Function Signature

```ts
import { PoolClient } from 'pg';

export type DocumentType = 'bill' | 'invoice' | 'payment';

export interface PostResult {
  entryId: number;
}

PostingService.postDocument(
  type: DocumentType,
  id: number,
  tx: PoolClient
): Promise<PostResult>
```

---

## 3. How to Call in Your Confirm Handlers

Per `docs/DECISIONS.md`, any transaction creating a journal entry **must run inside a raw `pg.PoolClient` transaction** (`withTransaction`), not Prisma's `$transaction()`. This guarantees that PostgreSQL's `DEFERRABLE INITIALLY DEFERRED` trigger (`trg_lines_balanced`) enforces balance on `COMMIT`.

### Example: Vendor Bill Confirm (Aman)

```ts
import { withTransaction } from '../db/withTransaction';
import { PostingService } from '../services/postingService';
import { SequenceService } from '../services/sequenceService';

export async function confirmVendorBill(billId: number) {
  return await withTransaction(async (tx) => {
    // 1. Assert bill is in draft
    const bill = await tx.query('SELECT * FROM vendor_bills WHERE id = $1 FOR UPDATE', [billId]);
    if (bill.rows[0].status !== 'draft') {
      throw new Error('Only draft bills can be confirmed');
    }

    // 2. Assign document number if not already set
    if (!bill.rows[0].number || bill.rows[0].number === '') {
      const docNumber = await SequenceService.nextDocNumber('BILL', tx);
      await tx.query('UPDATE vendor_bills SET number = $1 WHERE id = $2', [docNumber, billId]);
    }

    // 3. Post to the ledger (creates journal_entries + journal_entry_lines and updates bill)
    const { entryId } = await PostingService.postDocument('bill', billId, tx);

    // 4. Record stock moves (if physical goods) inside this same transaction
    // ...

    // 5. Write to audit_log inside this same transaction
    // ...

    return { billId, entryId };
  });
}
```

### Example: Customer Invoice Confirm (Aryan)

```ts
import { withTransaction } from '../db/withTransaction';
import { PostingService } from '../services/postingService';
import { SequenceService } from '../services/sequenceService';

export async function confirmCustomerInvoice(invoiceId: number) {
  return await withTransaction(async (tx) => {
    // 1. Assert invoice is in draft
    const inv = await tx.query('SELECT * FROM customer_invoices WHERE id = $1 FOR UPDATE', [invoiceId]);
    if (inv.rows[0].status !== 'draft') {
      throw new Error('Only draft invoices can be confirmed');
    }

    // 2. Assign document number if not already set
    if (!inv.rows[0].number || inv.rows[0].number === '') {
      const docNumber = await SequenceService.nextDocNumber('INV', tx);
      await tx.query('UPDATE customer_invoices SET number = $1 WHERE id = $2', [docNumber, invoiceId]);
    }

    // 3. Post to the ledger
    const { entryId } = await PostingService.postDocument('invoice', invoiceId, tx);

    // 4. Record stock moves & audit_log
    // ...

    return { invoiceId, entryId };
  });
}
```

---

## 4. Double-Entry Posting Mechanics

### Vendor Bill Confirm:
```
DR  Purchase Expense (per line, with line.analytic_account_id, partner = vendor)  [subtotal ex-tax]
DR  Input Tax Credit (partner = vendor, skipped if 0)                              [tax_total]
CR  Creditors (partner = vendor)                                                  [grand total]
```

### Customer Invoice Confirm:
```
DR  Debtors (partner = customer)                                                  [grand total]
CR  Sales Income (per line, with line.analytic_account_id, partner = customer)    [subtotal ex-tax]
CR  Output Tax Payable (partner = customer, skipped if 0)                          [tax_total]
```

### Payments:
```
Inbound (Customer Payment):
  DR Cash | Bank
  CR Debtors (partner = customer)
  (NEVER touches Income)

Outbound (Vendor Payment):
  DR Creditors (partner = vendor)
  CR Cash | Bank
  (NEVER touches Expense)
```

---

## 5. Guarantees Provided by `PostingService`

1. **Idempotent**: If the bill/invoice/payment already has `journal_entry_id` populated, it immediately returns `{ entryId: doc.journal_entry_id }`. Double-clicking confirm will never create duplicate entries.
2. **Gapless Numbers**: Journal entries receive sequential numbers (`JE/YYYY/XXXX`) generated with row-level locks on `doc_sequences`.
3. **Strict Balance Guarantee**: Entries are created in `draft` status, populated with lines, and flipped to `posted` last. PostgreSQL's deferred trigger validates that $\sum \text{debits} == \sum \text{credits}$ on `COMMIT`. If unbalanced, PostgreSQL rolls back the entire transaction.
