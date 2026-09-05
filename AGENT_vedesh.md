# Agent Prompt — Vedesh (Backend Spine)

Paste the block below into Claude Code / Antigravity. Then feed one phase at a time.

---

## Session opener

```
You are working on Urban Furniture, a double-entry accounting system for the Odoo
Hackathon 2026 finale. 24 hours, offline, no external APIs.

BEFORE WRITING ANY CODE, read these files completely:
  AGENTS.md
  db/schema.sql
  docs/architecture_flow.md
  docs/requirements.md
  docs/techstack.md

Then confirm back to me, in under 10 lines:
  1. The three tables only you may write to
  2. What happens to the ledger when a Purchase Order is confirmed
  3. The exact API response envelope
  4. How money is represented in Postgres, in JS, and across the wire

Do not write code until I reply "correct".

I own the backend spine: schema, auth/RBAC, posting service, sequences,
payments, reports. Three teammates depend on me, so auth, sequences and the
posting service must exist by hour 6.

Work ONE PHASE at a time. After each phase: run the verification command,
paste real output, then STOP and wait for me to say "next phase".
Never skip ahead. Never claim something works without running it.
```

---

## PHASE 1 — Database & Docker (hours 0–2)

```
PHASE 1.

Build:
1. docker-compose.yml with services: db (postgres:16-alpine, named volume),
   api (node:20), web (node:20). No other services.
2. Apply db/schema.sql. Do not modify it. If something looks wrong, tell me.
3. Write db/seed.sql containing ONLY:
   - 8 accounts: Bank(bank), Cash(cash), Debtors(asset), Creditors(liability),
     Sales Income(income), Purchase Expense(expense), Other Expense(other_expense),
     Capital(capital)
   - 4 journals with default accounts: Sales→Sales Income, Purchase→Purchase Expense,
     Bank→Bank, Cash→Cash
   - doc_sequences rows: PO(prefix 'P', use_year false, padding 5),
     BILL(prefix 'Bill'), INV(prefix 'Inv'), SO(prefix 'SO'), JE(prefix 'JE'), PAY(prefix 'PAY')
   - one admin user (role admin, Argon2id hash, login_id 'adminuf')
   - ONE opening capital journal entry, posted:
       DR Cash 500000 / CR Capital 500000
4. Verify the DEFERRABLE constraint trigger actually fires. Write a throwaway
   SQL test that tries to post an unbalanced entry and confirm it raises.

CRITICAL: test the deferred trigger against Prisma's transaction handling NOW.
If Prisma's interactive transactions conflict with DEFERRABLE INITIALLY DEFERRED,
I need to know at hour 2, not hour 20.

Verify:
  docker compose up -d db
  psql "$DATABASE_URL" -f db/schema.sql
  psql "$DATABASE_URL" -f db/seed.sql
  psql "$DATABASE_URL" -c "SELECT * FROM v_trial_balance;"
  psql "$DATABASE_URL" -c "SELECT SUM(debit)-SUM(credit) AS diff FROM journal_entry_lines;"

diff MUST be 0.00. Paste the real output. Then STOP.
```

---

## PHASE 2 — Auth & scoping (hours 2–4)

```
PHASE 2.

Build:
1. Express + TypeScript strict scaffold. Layers: routes/ middleware/ services/ db/
2. Argon2id password hashing.
3. POST /api/auth/signup — creates role='accountant' ONLY. Never admin, never contact.
   Validation: login_id unique 6-12 chars; email unique; password >8 chars with at
   least one lowercase, one uppercase, one special character.
4. POST /api/auth/login — JWT in httpOnly cookie, sameSite lax, secure false.
   Wrong credentials return EXACTLY: "Invalid Login Id or Password"
5. POST /api/auth/logout — explicit server-side route. httpOnly cannot be cleared client-side.
6. GET /api/auth/me
7. middleware/auth.ts — parse cookie, verify JWT, load user
8. middleware/role.ts — can this role touch this resource type at all
9. services/scope.ts — scopeFor(user, resource):
       admin | accountant | manager  -> {}
       contact                       -> { customerId: user.contactId }
   This is a RECORD RULE. It rewrites the query at the data layer.
   Never put authorisation in a controller if-statement.
10. CORS with credentials: true, origin from env.

Verify:
  curl -i -X POST localhost:5000/api/auth/login -H 'Content-Type: application/json' \
    -d '{"login_id":"adminuf","password":"<seeded>"}'
  -> 200 + Set-Cookie httpOnly
  curl -i ... -d '{"login_id":"adminuf","password":"wrong"}'
  -> error message exactly "Invalid Login Id or Password"
  curl -i localhost:5000/api/auth/me            -> 401 without cookie
  curl -i localhost:5000/api/auth/me -b cookies -> 200 with cookie

Paste real output. Then STOP.
```

---

## PHASE 3 — Sequences & posting service (hours 4–6)

```
PHASE 3. This unblocks Aman and Aryan. Highest priority in the whole build.

Build:
1. services/sequenceService.ts — wraps next_doc_number(code). Must be called inside
   the caller's transaction. Uses SELECT ... FOR UPDATE. Gapless.
2. services/postingService.ts — the ONLY module that writes journal_entries and
   journal_entry_lines. Signature:

     postDocument(type: 'bill'|'invoice'|'payment', id: number, tx: Transaction)
       : Promise<{ entryId: number }>

   Bill:
     DR Purchase Expense  per line, with analytic_account_id, partner = vendor, ex-tax
     DR Input Tax         tax total (skip line if zero)
     CR Creditors         partner = vendor, grand total
   Invoice:
     DR Debtors           partner = customer, grand total
     CR Sales Income      per line, with analytic, ex-tax
     CR Output Tax        tax total (skip if zero)
   Payment inbound:  DR Cash|Bank / CR Debtors(partner)
   Payment outbound: DR Creditors(partner) / CR Cash|Bank

3. Idempotency: if the document already has journal_entry_id set, return it.
   Double-clicking Confirm must never create two entries.
4. Set entry status to 'posted' last, so the deferred trigger validates at COMMIT.

Then write docs/POSTING_API.md — one page, the exact signature and behaviour,
for Aman and Aryan. They call this. They never touch ledger tables.

Verify: write a script that in ONE transaction creates a bill and posts it, then:
  psql -c "SELECT SUM(debit), SUM(credit) FROM journal_entry_lines WHERE entry_id=<id>;"
Both equal. Then deliberately post an unbalanced entry and confirm Postgres rejects it.

Paste real output. Then STOP.
```

---

## PHASE 4 — Journal entries & reversal (hours 6–10)

```
PHASE 4.

Build:
1. GET  /api/journal-entries      list: date, number, partner, journal, total, status
2. GET  /api/journal-entries/:id  with lines
3. POST /api/journal-entries      manual entry, status draft
4. POST /api/journal-entries/:id/post
     If SUM(debit) != SUM(credit), return error with severity 'blocking' and
     message "Debit and credit amounts do not match."
5. POST /api/journal-entries/:id/reverse
     Creates a mirrored entry with reversal_of set. Original stays posted.
6. Block edit/delete of posted entries at the service layer as well as the DB.

CRITICAL: a manual entry has source_type = NULL and MUST still appear in the P&L.
Reviewers test exactly this: record rent with no invoice, refresh P&L, watch it move.

Verify:
  Create manual entry DR Other Expense 10000 / CR Cash 10000, post it.
  psql -c "SELECT * FROM v_ledger_detail WHERE source_type IS NULL;"
  Attempt an unbalanced post -> blocking error, nothing written.
  Attempt to UPDATE a posted entry -> rejected.

Paste real output. Then STOP.
```

---

## PHASE 5 — Payments & reconciliation (hours 10–14)

```
PHASE 5.

Build:
1. POST /api/payments
     body: { direction, partnerId, method, paymentDate, amount, allocations: [{invoiceId|billId, amount}] }
     Validate: SUM(allocations) == payment.amount
     Validate: each allocation <= that document's amount_due (read from v_invoice_status / v_bill_status)
     Create payment + payment_allocations, then postDocument('payment', ...)
2. GET /api/invoices/:id/payments — full history: date, method, amount
3. GET /api/receivables — customer-wise: total invoiced, total paid, outstanding
4. GET /api/aging?type=receivable|payable — buckets 0-30, 31-60, 61-90, 90+

NEVER write a status column. Status comes from the views.
NEVER touch an Income account in a payment entry.

Verify:
  Create a 5000 invoice, confirm it.
  Pay 3000.
  psql -c "SELECT number, total, amount_paid, amount_due, payment_status FROM v_invoice_status;"
  -> 5000 / 3000 / 2000 / partial
  Pay 2000 -> paid, due 0.00
  psql -c "SELECT SUM(debit)-SUM(credit) FROM journal_entry_lines;" -> 0.00

Paste real output. Then STOP.
```

---

## PHASE 6 — Reports & /verify (hours 14–18)

```
PHASE 6.

All reports read ONLY from journal_entry_lines joined to journal_entries WHERE status='posted'.
Never sum document tables.

Build:
1. GET /api/reports/profit-loss?from=&to=
     BETWEEN two dates. Income (income) minus Expenses (expense, other_expense).
2. GET /api/reports/balance-sheet?asOf=
     CUMULATIVE UP TO one date. Different parameter shape from P&L — do not reuse the filter.
     Assets: asset, bank, cash. Liabilities: liability. Capital: capital PLUS current-period
     net profit. If profit does not flow into equity the sheet will not balance.
3. GET /api/reports/budget?budgetId=  from v_budget_line_progress
4. GET /api/reports/budget/:lineId/documents — invoices/bills with that analytic in period
     (this backs the clickable Achieved Amount)
5. GET /api/verify -> { totalDebit, totalCredit, difference }
6. GET /api/ledger?accountId=&from=&to= — backs the drill-down chain

Verify:
  curl localhost:5000/api/verify -> difference "0.00"
  Balance sheet: totalAssets == totalLiabilities + totalCapital. Print both.
  Post a new invoice, re-run both -> still balanced.

Paste real output. Then STOP.
```

---

## PHASE 7 — Audit, drill-down, load test (hours 18–24)

```
PHASE 7.

1. audit_log written on every create / confirm / post / cancel / pay.
   GET /api/audit?table=&recordId=
2. Seed 50,000 journal lines into a scratch dataset.
3. Run k6 or autocannon against /api/reports/balance-sheet and /api/reports/profit-loss.
   Record p50 and p95 BEFORE and AFTER idx_jel_report.
   Save EXPLAIN ANALYZE output to docs/PERFORMANCE.md.

I will quote these numbers on stage, so they must be real measurements, not estimates.

Verify: paste the k6 summary and both EXPLAIN ANALYZE outputs. Then STOP.
```
