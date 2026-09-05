# Data Model

DDL lives in `db/schema.sql`. This explains the reasoning — read it before touching the tables.

## The five decisions

### 1. One ledger, separate document tables

`journal_entries` + `journal_entry_lines` are the only source of financial truth. Bills, invoices and payments all post through them. Reports read **only** from the ledger — never summed from document tables.

Odoo unifies documents into one `account.move`. We kept `vendor_bills` and `customer_invoices` separate so Aman and Aryan can work in parallel without merge conflicts. The **ledger** is unified, which is the part that matters.

*If asked:* "Documents are separate for team parallelism; the ledger is unified. Both sides call the same posting service."

### 2. Payment allocation, not a paid flag

`payment_allocations` joins payments to invoices/bills many-to-many. One payment settles several documents; one document takes several payments.

`amount_paid`, `amount_due` and `payment_status` are **views** (`v_invoice_status`, `v_bill_status`), never stored columns. Stored values drift; computed ones can't.

This is what makes credit sales and instalments real rather than a boolean.

### 3. The invariant lives in Postgres

Two constraint triggers:

- `trg_lines_balanced` — DEFERRABLE, fires at COMMIT so lines can be inserted one at a time. Rejects any **posted** entry where `SUM(debit) ≠ SUM(credit)`
- `trg_je_immutable` / `trg_jel_immutable` — a posted entry cannot be edited or deleted. Corrections happen via `reversal_of`

Plus a line-level check: a line is either a debit or a credit, never both, never neither.

*On stage:* "You can't corrupt our ledger even with direct SQL access."

### 4. `source_type` is nullable — deliberately

A manual journal entry (rent, depreciation, opening capital) has no source document and must still hit the P&L. Reviewers test exactly this: record a manual entry, refresh the P&L, see it move.

### 5. Analytic account sits on every document line

`purchase_order_lines`, `vendor_bill_lines`, `sales_order_lines`, `customer_invoice_lines` and `journal_entry_lines` all carry `analytic_account_id`. `v_budget_line_progress` reads document lines directly, so Achieved Amount can never disagree with the underlying invoices.

---

## Tables

**Auth & master:** `users` · `contacts` · `products` · `accounts` · `journals` · `analytic_accounts`
**Ledger:** `journal_entries` · `journal_entry_lines`
**Purchase:** `purchase_orders` (+lines) · `vendor_bills` (+lines)
**Sales:** `sales_orders` (+lines) · `customer_invoices` (+lines)
**Money:** `payments` · `payment_allocations`
**Budget:** `budgets` · `budget_lines`
**Ops:** `stock_moves` · `audit_log` · `doc_sequences`

**Views:** `v_trial_balance` · `v_ledger_detail` · `v_invoice_status` · `v_bill_status` · `v_budget_line_progress` · `v_stock_on_hand` · `v_account_section`

---

## Details reviewers check

**Account types — eight, two report groups**
Balance Sheet: `asset` `liability` `bank` `capital` `cash`
P&L: `income` `expense` `other_expense`
Type drives report placement. `v_account_section` derives the group; it is never stored.

**Partner on the line, not the entry**
`journal_entry_lines.partner_id`. Mirrors Odoo's `account.move.line.partner_id`. The mockup shows it per-line.

**Bill Reference ≠ Bill Number**
`vendor_bills.number` = `Bill/2026/0001`, ours, sequenced.
`vendor_bills.bill_reference` = `ABC-26-001`, free text, the vendor's.

**Conditional smart button**
`vendor_bills.po_id` is nullable. NULL → the PO smart button hides entirely.

**Budget lineage**
`budgets.revised_of_id` is a self-FK pointing at the original. Revise creates a new row, moves the old to `revised`, and both directions are navigable. Name gets " Revised" appended.

**Gapless sequences**
`doc_sequences` + `next_doc_number()` using `SELECT ... FOR UPDATE`. Always call inside the same transaction as the document insert. Formats: `P00001`, `Bill/2026/0001`, `Inv/2026/0001`.

**Archive, never delete**
`is_archived` on contacts, products, accounts, journals, analytic accounts. Archiving hides from dropdowns and preserves history. Deletion is blocked once a record is referenced — the FKs enforce it.

**Stock is a sum of moves**
`products.stock_qty` is a cache. `v_stock_on_hand` is the truth: `SUM(stock_moves.qty_change)`. Never edit quantity directly.

---

## Posting rules

**Vendor Bill confirm**
```
DR  Purchase Expense (per line, with analytic)   ex-tax
DR  Input Tax                                    tax
CR  Creditors (partner = vendor)                 total
```

**Customer Invoice confirm**
```
DR  Debtors (partner = customer)                 total
CR  Sales Income (per line, with analytic)       ex-tax
CR  Output Tax                                   tax
```

**Inbound payment**
```
DR  Cash / Bank
CR  Debtors (partner = customer)
```
Never touches Income. Revenue was recognised at invoice.

**Outbound payment**
```
DR  Creditors (partner = vendor)
CR  Cash / Bank
```

**Opening capital** (run in seed)
```
DR  Cash / Bank
CR  Capital
```
Answers "where did the money come from?" — almost no team seeds this.

**PO confirm → no journal entry. SO confirm → no journal entry.**

---

## Two traps

**Net profit must reach the Balance Sheet.**
`Assets = Liabilities + Capital + (Income − Expenses)`
Compute the reports independently and the Balance Sheet silently won't balance.

**Balance Sheet and P&L take different date inputs.**
P&L is **between** two dates. Balance Sheet is cumulative **up to** one date. Wiring the same range filter to both is the most common failure.
