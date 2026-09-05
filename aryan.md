# Aryan — Sales & Contact Portal

**Tool:** Antigravity · **Owns:** sales flow (API + UI), then the Contact portal

The portal is a **required PS deliverable** that half the field will skip. It's your differentiator — don't let it slip to the end.

You are full-stack on your vertical: your own API routes, your own screens using Swapnil's components.

---

## Do not

- Write to `journal_entries` or `journal_entry_lines`. Call `postingService.postDocument()`
- Post a journal entry on **SO confirm**. Only the Invoice posts
- Record revenue at payment time. Revenue is recognised at invoice
- Enforce portal permissions in the controller. Use `scopeFor()` at the data layer

---

## Hours 0–6 — Sales Order

- Buttons: New · Confirm · **Create Invoice** · Cancel · Back
- Fields: Customer (from Contact master), Order Date
- Lines: Product, Budget Analytics, Qty, Unit Price, **Tax**, Total
- **No journal entry on confirm.** None.

## Hours 6–12 — Customer Invoice

- Number `Inv/2026/0001`
- Fields: Customer, Invoice Date, Due Date
- Lines: Product, Chart of Account (Sales Income by default), Budget Analytics, Qty, Unit Price, Tax Rate, Total
- Subtotal / Tax / Total
- Status computed: Paid / Partial / Not Paid, with Amount Due
- Create Invoice from SO copies everything and sets `so_id`

**On Confirm:** `postDocument('invoice', id, tx)` →
```
DR Debtors (partner = customer)      total
CR Sales Income (per line, analytic) ex-tax
CR Output Tax                        tax
```
Plus stock moves (−qty per goods line) and audit log, same transaction.

## Hours 12–16 — Payments (UI)

Vedesh owns the payment API; you own the receipt screen.

- Register payment against an invoice, method Cash or Bank
- **Partial payment must work.** ₹3,000 against ₹5,000 leaves ₹2,000 due and status Partial
- One payment can settle several invoices — the allocation UI
- Payment history on the invoice: every payment, date, method, amount

**Credit sales are core, not stretch.** Sell in October, get paid in December — revenue is October's, the December payment only moves cash and receivables. Never create a second sale.

## Hours 16–20 — Contact Portal

Separate restricted surface. Not the internal app with buttons hidden.

- Portal login (Contact users only, created from Contact master, invited by token)
- **My Invoices** — own invoices only, with Paid / Partial / Not Paid status
- Invoice detail: lines, total, paid, outstanding, payment history
- **Pay Now** — records a payment against the invoice, method Cash or Bank
- No access to anything else. No master data, no reports, no other customers

**The test that matters:** log in as customer A, change the invoice ID in the URL to customer B's invoice. Must return 403. Use `scopeFor(user, 'invoice')` — never a controller-level `if`. A reviewer will do exactly this.

## Hours 20+
- Customer statement: invoices, payments, running balance
- Aging: receivables at 30/60/90
- Accounts Receivable page: customer-wise outstanding, click through to their invoices
