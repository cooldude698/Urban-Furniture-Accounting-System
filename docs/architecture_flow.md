# Architecture & Flow

## System

```
┌──────────────────────── Docker Compose ────────────────────────┐
│                                                                │
│  web (React + Vite)  ──httpOnly cookie──▶  api (Express + TS)  │
│    Admin app                                    │              │
│    Contact portal                               ▼              │
│                                          db (PostgreSQL 16)    │
│         ◀────────── Socket.IO (Tier 2) ──────────              │
└────────────────────────────────────────────────────────────────┘
                    No outbound network. Ever.
```

## Backend layers

```
routes/      thin — parse, call service, shape response
  ↓
middleware/  auth → role → scope
  ↓
services/    ALL business logic lives here
  ↓
db/          Prisma / pg
```

`postingService.ts` is the only module that writes to `journal_entries` and `journal_entry_lines`. Bills and invoices call `postDocument()`. Nobody else touches ledger tables.

## Authorisation — record rules, not route guards

Route guards fail when someone forgets one endpoint. That is how portal IDOR happens.

Instead, one scoping function every data path goes through:

```ts
scopeFor(user, 'invoice')
  admin | accountant | manager → {}
  contact                      → { customerId: user.contactId }
```

Rewrites the query at the data layer, modelled on Odoo's record rules. URL tampering becomes structurally impossible rather than defensively patched.

**Reviewers will log in as a customer and edit the invoice ID in the URL.** This is the check that matters most.

## Request flow

```
Browser
  → cookie parsed → JWT verified → user loaded
  → role check (can this role touch this resource at all?)
  → scope applied (which rows?)
  → Zod validates body
  → service runs inside a transaction
  → audit_log written
  → { data, error } returned
```

## API contract

Agree this in the first 30 minutes.

```ts
// success
{ data: T, error: null }

// failure
{ data: null, error: {
    code: string,
    message: string,
    severity: 'blocking' | 'warning',   // drives which UI component renders
    fields?: Record<string,string>
}}
```

`severity` is what lets Swapnil's two warning components work without special-casing each endpoint.

**Money crosses the wire as a string.** `"5000.00"`, parsed with decimal.js both ends. One JSON float and the correctness demo dies.

## Posting flow — Vendor Bill

```
POST /api/bills/:id/confirm
  ↓ BEGIN
  1. load bill + lines, assert status = draft
  2. budget check → if over, attach NON-BLOCKING warning (do not stop)
  3. number = next_doc_number('BILL')       -- FOR UPDATE, same txn
  4. create journal_entry (draft, journal = Purchase, source_type='bill')
  5. lines:
       DR Purchase Expense per line (analytic, partner = vendor)
       DR Input Tax
       CR Creditors (partner = vendor)
  6. set entry status = 'posted'
       → trg_lines_balanced fires at COMMIT
  7. bill.status = 'confirmed', bill.journal_entry_id = entry.id
  8. stock_moves +qty per goods line
  9. audit_log
  ↓ COMMIT
```

Steps 3–8 are one transaction. Partial failure must leave no orphan entry.

Customer Invoice is the mirror image. **Same service, same guarantees.**

## Payment flow

```
POST /api/payments
  ↓ BEGIN
  1. validate allocations: SUM(allocations) = payment.amount
  2. per target, assert allocation ≤ amount_due (from the view)
  3. create payment + payment_allocations
  4. journal entry:
       inbound:  DR Cash/Bank        CR Debtors(partner)
       outbound: DR Creditors(partner)  CR Cash/Bank
  5. audit_log
  ↓ COMMIT
```

Status is **never written**. `v_invoice_status` recomputes Paid / Partial / Not Paid on read.

## Reports

All three read from `journal_entry_lines` joined to posted `journal_entries`. Never from document tables.

| Report | Date semantics |
|---|---|
| Profit & Loss | **BETWEEN** start and end |
| Balance Sheet | Cumulative **UP TO** one date |
| Budget Report | Within budget period |

Balance Sheet equity must include current-period profit:
`Assets = Liabilities + Capital + (Income − Expenses)`

**Drill-down chain:** report line → account ledger → journal entries → source document. Each level is a filter on `v_ledger_detail`.

## Module boundaries

| Owner | Writes to |
|---|---|
| Vedesh | `users`, `journal_entries`, `journal_entry_lines`, `payments`, `payment_allocations`, `doc_sequences`, report queries |
| Aman | `contacts`, `products`, `accounts`, `journals`, `analytic_accounts`, `purchase_orders`, `vendor_bills` |
| Aryan | `sales_orders`, `customer_invoices`, portal routes |
| Swapnil | No tables — frontend only |

Aman and Aryan **call** `postDocument()`. They never insert ledger rows.

## Failure modes to test early

| Risk | Test at hour |
|---|---|
| DEFERRABLE trigger vs Prisma transaction handling | **2** |
| CORS `credentials: true` across container boundary | 2 |
| Sequence race under concurrent confirms | 6 |
| decimal.js serialisation round-trip | 4 |
| Report performance at 50k lines | 20 |
