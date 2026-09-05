# PRD — Urban Furniture Accounting System

## 1. Problem

Below roughly ₹5 crore turnover, Indian businesses either use a billing app with no real ledger (Vyapar, myBillBook — invoices and a stock count, no balance sheet, no cost centres), or Tally locked to one desktop where only the accountant can see anything. The owner learns how the month went from their CA, weeks later. The customer has no idea what they owe and gets chased over WhatsApp.

Tally holds roughly 70% of computerised accounting in India. QuickBooks entered, failed, and exited the country in 2023. Odoo itself ships a fully localised Indian accounting suite.

**We are not claiming novelty in the category.** We are targeting three structural gaps:

1. The owner can't see live financials
2. The customer can't see or settle their own dues
3. The tier below Tally isn't doing double-entry at all — so a furniture business with two showrooms cannot tell which one is profitable

## 2. Positioning

> Below ₹5 crore, businesses either use a billing app with no real ledger, or Tally on one desktop where only the accountant can see anything. We built a proper double-entry system where every transaction posts to one ledger, the owner sees live reports, and customers can see and pay their own invoices — with analytic accounts so a furniture business can tell which showroom is making money.

**Never say:** "this replaces Tally" or "nothing like this exists."

## 3. Roles

| Role | Can |
|---|---|
| **Admin / Owner** | Everything. User management, archive master data, all reports, audit log |
| **Accountant** | Master data, transactions, invoices, bills, payments, journal entries, reports. **Cannot archive** master data |
| **Manager** | Products, contacts, orders, inventory, operational dashboards. **No** journal entries, CoA, posted payments, financial config, sensitive reports |
| **Contact (portal)** | View own invoices/bills and their paid/unpaid status. Pay dues. Nothing else, ever |

Public signup creates **Accountants only**. Admin is seeded. Contact users are created from Contact master and invited.

## 4. Core workflow

```
Master Data (Contacts, Products, CoA, Journals, Analytic Accounts)
        ↓
Purchase: PO → Vendor Bill → Payment
Sales:    SO → Customer Invoice → Payment
        ↓
Journal Entry (balanced, immutable once posted)
        ↓
Balance Sheet · Profit & Loss · Budget Report
```

**PO and SO produce no journal entries.** Only Bills and Invoices post to the ledger. This is deliberate and we say it out loud during the demo.

## 5. Receivables & credit sales (core, not stretch)

Furniture orders routinely run on credit with instalments. This is a first-class feature.

- Sell ₹2,00,000 on 1 Oct → revenue recognised **in October**
  `DR Debtors 2,00,000 / CR Sales Income 2,00,000`
- Customer pays ₹1,00,000 on 1 Dec → **no new sale**
  `DR Bank 1,00,000 / CR Debtors 1,00,000`
- Pays remaining ₹1,00,000 in Jan → invoice status flips to Paid

Payment timing never touches the P&L. It moves cash and receivables on the Balance Sheet. The economic cost of waiting shows as receivables aging and working capital, not reduced profit.

**Design point:** the original invoice amount is never mutated. Paid and Remaining are **computed** from the allocation table, never stored — so they cannot drift. Full history preserved: every payment, date, method.

Delivers: Accounts Receivable page, customer-wise outstanding, overdue invoices, aging.

## 6. Scope

### Tier 0 — mandatory
Everything in the mockup, including the fourteen requirements absent from the PDF (see `requirements.md`). Plus the Contact portal.

### Tier 1 — deepens the accounting
Ledger drill-down · customer/vendor statements · aging report · audit log · GST CGST/SGST split · PDF invoice/bill/PO · dashboard KPI strip · stock ledger · MRP & below-cost warning · slow-mover alert · SKU generator · load-test numbers

### Tier 2 — only if green at hour 20
Live report updates over Socket.IO · 360° viewer (image sequence) · keyboard-first entry · job costing

### Roadmap slide — designed, not built
3D catalog · room planner · variants · OCR · voice · predictive purchasing · recurring billing · bank reconciliation · multi-currency

**Test for any feature:** does it make the accounting *deeper*, or does it sit *next to* the accounting? Deeper wins.

## 7. Two warning severities

| Condition | Severity | Behaviour |
|---|---|---|
| Journal entry debits ≠ credits | **Blocking** | Cannot post |
| PO / Bill exceeds remaining budget | **Non-blocking** | Warn, allow confirm |

Budget overrun copy, verbatim from the mockup:
> ⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining budget amount for this budget line. Consider adjusting the value or revise the budget.

Getting this backwards fails a spec detail *and* breaks the demo, since "revise the budget" only makes sense if the transaction went through.

## 8. Success criteria

- A reviewer can enter any transaction and the trial balance stays at 0.00
- A manual journal entry with no source document moves the P&L
- Confirming a PO produces no journal entry
- Editing a posted invoice is impossible
- Changing the invoice ID in the portal URL returns 403
- Balance Sheet balances, with net profit flowing into equity
- Every team member can explain the whole architecture
