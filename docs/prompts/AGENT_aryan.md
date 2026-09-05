# Agent Prompt — Aryan (Sales & Contact Portal)

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
  2. When revenue is recognised — at invoice or at payment
  3. What a payment journal entry debits and credits, and which account it must NEVER touch
  4. How portal authorisation is enforced, and where

Do not write code until I reply "correct".

I own the sales flow (API + UI) and the Contact portal. The portal is a required
deliverable that half the field will skip — it is my differentiator, so it does
not slip to the end.

I am full-stack on my vertical: my own Express routes, my own React screens
using Swapnil's components from src/components/.

Work ONE PHASE at a time. After each phase, run the verification, paste real
output, then STOP and wait for "next phase".
```

---

## PHASE 1 — Sales Order (hours 0–4)

```
PHASE 1.

Backend:
1. POST /api/sales-orders — number from sequenceService, code 'SO'
2. Lines: product_id, analytic_account_id, qty, unit_price, tax_rate
3. POST /api/sales-orders/:id/confirm
4. POST /api/sales-orders/:id/create-invoice — copies customer, lines, prices, qty,
   sets invoice.so_id

ABSOLUTELY NO JOURNAL ENTRY ON SO CONFIRM. Do not call postDocument here.
A Sales Order is commercial intent with zero accounting impact.

Frontend:
  Buttons: New | Confirm | Create Invoice | Cancel | Back
  Header: SO No, Customer Name, SO Date
  Grid: Sr No | Product | Budget Analytics | Qty | Unit Price | Tax | Total

Verify:
  Note the journal_entries row count. Confirm an SO. Re-count. UNCHANGED.
Paste real output. Then STOP.
```

---

## PHASE 2 — Customer Invoice (hours 4–10)

```
PHASE 2.

Backend:
1. POST /api/invoices — number from sequenceService code 'INV', format Inv/2026/0001
2. Lines: product_id, account_id (default Sales Income), analytic_account_id,
   qty, unit_price, tax_rate
3. POST /api/invoices/:id/confirm — inside ONE transaction:
     a. call postingService.postDocument('invoice', id, tx)  <- never write ledger rows yourself
     b. create stock_moves: -qty for each goods line
     c. write audit_log
     d. status = 'confirmed'
4. GET /api/invoices/:id returns amount_paid, amount_due, payment_status
   READ FROM v_invoice_status. Never store these on the invoice.

Frontend:
  Buttons: New | Confirm | Pay | SO | Budget | Cancel | Back
  SO smart button renders ONLY when invoice.so_id is not null.
  Header: Invoice No, Customer, Invoice Date, Due Date, Status badge
  Grid: Sr No | Product | Chart of Account | Budget Analytics | Qty | Unit Price | Tax | Total
  Footer: Subtotal, Tax, Total, Paid Via Cash, Paid Via Bank, Amount Due

Verify:
  Confirm a 10000 invoice with no tax, then:
  psql -c "SELECT a.name, l.debit, l.credit FROM journal_entry_lines l
           JOIN accounts a ON a.id=l.account_id WHERE l.entry_id=<id>;"
  Expect: DR Debtors 10000, CR Sales Income 10000.
  Confirm Debtors line carries partner_id = the customer.
  psql -c "SELECT SUM(debit)-SUM(credit) FROM journal_entry_lines;" -> 0.00
Paste real output. Then STOP.
```

---

## PHASE 3 — Payments UI & credit sales (hours 10–16)

```
PHASE 3. Vedesh owns POST /api/payments. I own the screens.

Build:
1. Register Payment screen: invoice, method (Cash|Bank), date, amount.
   Amount defaults to amount_due but is EDITABLE — partial payment is core, not optional.
2. Allocation UI: one payment can settle several invoices for the same customer.
3. Payment history panel on the invoice: date, method, amount, running remaining.
4. GET /api/receivables page: per customer, total invoiced / total paid / outstanding.
   Click a customer -> their invoices with statuses.

THE ACCOUNTING RULE I MUST NOT BREAK:
  Sell 200000 on 1 Oct  -> revenue is OCTOBER's.  DR Debtors / CR Sales Income
  Customer pays 100000 on 1 Dec -> NO NEW SALE.   DR Bank / CR Debtors
  Invoice becomes 'partial' with 100000 due. P&L does not change in December.
  Never create a second invoice. Never touch an Income account on a payment.

Verify:
  Invoice 200000, confirm. Pay 100000. Then:
  psql -c "SELECT total, amount_paid, amount_due, payment_status FROM v_invoice_status WHERE id=<id>;"
  -> 200000 / 100000 / 100000 / partial
  Run P&L for the payment month -> the 200000 must NOT appear there.
Paste real output. Then STOP.
```

---

## PHASE 4 — Contact Portal (hours 16–20) — MY DIFFERENTIATOR

```
PHASE 4. This is a required PS deliverable. Do not treat it as optional.

It is a SEPARATE RESTRICTED SURFACE, not the internal app with buttons hidden.

Build:
1. Portal login at /portal. Contact users only.
   Contact users are created from Contact master and invited by token — they cannot
   self-signup. Signup creates accountants only.
2. Token invite flow: admin/accountant sends invite, contact sets their own password.
3. /portal/invoices — the logged-in contact's OWN invoices only.
   Columns: Invoice No, Date, Total, Paid, Outstanding, Status.
4. /portal/invoices/:id — lines, totals, full payment history.
5. Pay Now — records a payment against the invoice, method Cash or Bank.
6. Nothing else. No master data, no reports, no other customers, no navigation
   to the internal app.

AUTHORISATION — the single most important thing I build:
  Every portal query goes through scopeFor(user, 'invoice') which injects
  { customerId: user.contactId } AT THE DATA LAYER.
  Do NOT write `if (invoice.customerId !== user.contactId) return 403` in a controller.
  A forgotten controller check is how IDOR happens.

Verify — run this exact test and paste the output:
  1. Log in as customer A. Note one of A's invoice IDs and one of customer B's.
  2. curl -b A_cookies localhost:5000/api/portal/invoices/<B_invoice_id>
     -> MUST return 403 or 404. If it returns B's invoice, the portal is broken
        and nothing else I build matters.
  3. curl -b A_cookies localhost:5000/api/contacts -> 403
  4. curl -b A_cookies localhost:5000/api/reports/balance-sheet -> 403

A reviewer will do exactly step 2 by editing the URL in the browser.
Then STOP.
```

---

## PHASE 5 — Statements & aging (hours 20+)

```
PHASE 5. Only after I confirm Tier 0 is green.

1. Customer statement: chronological invoices and payments with running balance.
2. Aging report: receivables bucketed 0-30 / 31-60 / 61-90 / 90+ days past due.
3. Overdue invoice alert on the dashboard.
4. PDF export for a single invoice (server-side Puppeteer, not browser print).

Verify: screenshot a statement with an arithmetically correct running balance
over at least 5 rows, and an aging report where the bucket totals sum to total
outstanding. Then STOP.
```
