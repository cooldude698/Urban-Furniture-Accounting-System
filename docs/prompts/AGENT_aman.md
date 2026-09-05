# Agent Prompt — Aman (Master Data & Purchase)

Paste the opener into Antigravity, then feed one phase at a time.

---

## Session opener

```
You are working on Urban Furniture, a double-entry accounting system for the Odoo
Hackathon 2026 finale. 24 hours, offline, no external APIs.

BEFORE WRITING ANY CODE, read completely:
  AGENTS.md
  db/schema.sql
  docs/requirements.md
  docs/architecture_flow.md

Then confirm back, under 10 lines:
  1. Which tables I may write to, and which I must never write to
  2. What happens to the ledger when a Purchase Order is confirmed
  3. Whether the budget-overrun warning blocks the transaction
  4. The difference between vendor_bills.number and vendor_bills.bill_reference

Do not write code until I reply "correct".

I own master data (API + UI) and the purchase flow. Master data blocks everyone,
so it must work by hour 6 even if it is ugly.

I am full-stack on my vertical: my own Express routes, my own React screens
using Swapnil's components from src/components/.

Work ONE PHASE at a time. After each phase, run the verification, paste real
output, then STOP and wait for "next phase".
```

---

## PHASE 1 — Contacts & Products (hours 0–3)

```
PHASE 1. Everyone is blocked until this ships. Speed over polish.

Backend:
1. CRUD routes for contacts: name, type (customer|vendor|both), email, mobile,
   address, city, state, pincode, image_path, gstin
2. CRUD routes for products: sku, name, type (goods|service|combo), category,
   sales_price, cost_price, mrp, tax_rate
3. Zod schemas in shared/schemas/. Import them on the client too.
4. Archive endpoints (set is_archived). NO delete endpoints — deletion is blocked
   entirely once a record is referenced.
5. Image upload to a local Docker volume. No S3, no CDN.

Frontend: list + form for each, using <ListView> and <FormView>.

Product type MUST include 'combo'. It is in the spec and most teams ignore it.
If combo needs behaviour beyond a label, ask me before designing it.

Verify:
  curl -b cookies localhost:5000/api/contacts   -> list
  Create a contact, archive it, confirm it disappears from dropdowns but the record survives.
  Screenshot both screens.
Then STOP.
```

---

## PHASE 2 — CoA, Journals, Analytics (hours 3–6)

```
PHASE 2.

Backend: CRUD for accounts, journals, analytic_accounts. Read from the seeded rows,
do not re-seed.

Frontend — Chart of Accounts:
  List columns: Account Name, Type
  Form: Account Name, Type dropdown

  The Type dropdown has EIGHT options in TWO GROUPS. The group headings are
  labels only and must NOT be selectable:

    Balancesheet   (heading, disabled)
      Asset
      Liability
      Bank
      Capital
      Cash
    Profit and Loss (heading, disabled)
      Income
      Expenses
      Other Expenses

Frontend — Journals: list (Journal Name, Type, Default Account), form with
Default Account as a many-to-one selector from Chart of Accounts.

Frontend — Analytic Accounts: list + form, Name and Type (Income|Expense).

Verify:
  Screenshot the Type dropdown showing both group headings unselectable.
  Confirm all 8 seeded accounts and 4 seeded journals render.
Then STOP.
```

---

## PHASE 3 — Purchase Order (hours 6–10)

```
PHASE 3.

Backend:
1. POST /api/purchase-orders — number from sequenceService, code 'PO', format P00001
2. Lines: product_id, analytic_account_id (Budget Analytics), qty, unit_price
3. POST /api/purchase-orders/:id/confirm
     Budget check: for each line with an analytic account, compare against remaining
     budget from v_budget_line_progress.
     If over -> return the PO as CONFIRMED, plus a warning in the response with
     severity 'warning'. THE CONFIRM STILL SUCCEEDS.
4. POST /api/purchase-orders/:id/create-bill — copies vendor, lines, prices, quantities,
   sets bill.po_id

ABSOLUTELY NO JOURNAL ENTRY ON PO CONFIRM. Do not call postDocument here.
A PO is commercial intent with zero accounting impact. Reviewers test this specifically.

Frontend:
  Buttons: New | Confirm | Create Bill | Cancel | Back
  Header: PO No. (read-only), Vendor Name, PO Date
  Grid: Sr No | Product | Budget Analytics | Qty | Unit Price | Total
  On over-budget confirm, render <NonBlockingWarning> with the exact spec copy.

Verify:
  Confirm a PO, then:
  psql -c "SELECT COUNT(*) FROM journal_entries WHERE source_type='bill' OR source_type IS NULL;"
  Count must be UNCHANGED from before the confirm.
  Confirm an over-budget PO -> succeeds, warning shown, status is 'confirmed'.
Paste real output. Then STOP.
```

---

## PHASE 4 — Vendor Bill (hours 10–14)

```
PHASE 4. This is where the ledger finally moves.

Backend:
1. POST /api/bills — number from sequenceService code 'BILL', format Bill/2026/0001
2. bill_reference is a SEPARATE free-text field for the VENDOR's own number
   (e.g. ABC-26-001). It is not generated and not validated for uniqueness.
3. Lines: product_id, account_id (default to Purchase Expense), analytic_account_id,
   qty, unit_price, tax_rate
4. POST /api/bills/:id/confirm — inside ONE transaction:
     a. same non-blocking budget check as the PO
     b. call postingService.postDocument('bill', id, tx)   <- DO NOT write ledger rows yourself
     c. create stock_moves: +qty for each goods line
     d. write audit_log
     e. set status = 'confirmed'
5. GET /api/bills/:id returns amount_paid, amount_due and payment_status
   READ FROM v_bill_status. Never store these on the bill.

Frontend:
  Buttons: New | Confirm | Pay | PO | Budget | Cancel | Back
  <SmartButton> "PO" renders ONLY when bill.po_id is not null. On a standalone
  bill it must not appear at all — not disabled, absent.
  <SmartButton> "Budget" opens the analytic report for this bill.
  Header: Vendor Bill No, Bill Reference, Vendor Name, Bill Date, Due Date,
          Status badge (Paid | Partial | Not Paid)
  Grid: Sr No | Product | Chart of Account | Budget Analytics | Qty | Unit Price | Total
  Footer: Paid Via Cash, Paid Via Bank, Amount Due

Verify:
  Confirm a bill, then:
  psql -c "SELECT account_id, partner_id, debit, credit FROM journal_entry_lines WHERE entry_id=<id>;"
  Expect: DR Purchase Expense, DR Input Tax (if any), CR Creditors with partner = vendor.
  psql -c "SELECT SUM(debit)-SUM(credit) FROM journal_entry_lines;" -> 0.00
  Create a bill WITHOUT a PO -> confirm the PO smart button is absent.
Paste real output. Then STOP.
```

---

## PHASE 5 — Smart buttons & statements (hours 14–18)

```
PHASE 5.

1. Smart buttons on the Contact form: bill count, invoice count, payment count.
   Each opens a filtered list. Counts come from the API.
2. GET /api/contacts/:id/statement — chronological bills, payments, running balance.
   Frontend page for it.
3. Kanban view for products (card: image, name, sales price, stock) if time allows.

Verify: screenshot a vendor statement where the running balance is arithmetically
correct across at least 5 rows. Then STOP.
```

---

## PHASE 6 — Tier 1 extras (hours 18+)

```
PHASE 6. Only after I confirm Tier 0 is green.

1. SKU generator on product create: CATEGORY-INITIALS-#### 
2. Low stock alert on the dashboard (qty below a threshold field)
3. Slow-mover / clearance alert: products with no sale in N days
4. MRP ceiling warning: if unit_price > product.mrp on a sales line, NON-BLOCKING warning
5. Below-cost warning: if unit_price < product.cost_price, NON-BLOCKING warning

All four reuse <NonBlockingWarning>. None of them block a transaction.
Then STOP.
```
