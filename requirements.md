# Requirements Checklist

Tick these before touching anything in Tier 1. **§A and §B are the whole grade.**

---

## A. From the PDF

### Master data
- [ ] Contact: Name, Type (Customer/Vendor/Both), Email, Mobile, Address, City, State, Pincode, Profile Image
- [ ] Product: Name, Type (Goods/Service/**Combo**), Sales Price, Cost, Category
- [ ] Chart of Accounts: Name, Type
- [ ] Journal: Name, Type, Default Accounts
- [ ] Journal Entry: Journal, Date, Reference, Items, Account, Debit, Credit
- [ ] Analytic Account: Name, Type (Income/Expense)
- [ ] Budget: Name, Period, Responsible Person

> **Combo product type is in the spec and everyone ignores it.** Implement it or have a crisp reason for deferring.

### Transactions
- [ ] Purchase Order — Vendor, Product, Qty, Unit Price
- [ ] Vendor Bill — converted from PO, bill date, due date, register payment (Cash/Bank)
- [ ] Sales Order — Customer, Product, Qty, Unit Price, **Tax**
- [ ] Customer Invoice — generated from SO, receive payment via Cash/Bank
- [ ] Payment registered against bill/invoice, select bank or cash

### Reports
- [ ] Balance Sheet — real-time Assets, Liabilities, Capital
- [ ] Profit & Loss — income minus purchases/expenses, net profit
- [ ] Budget Report

### Roles
- [ ] Admin — create / modify / **archive** master data, record transactions, view reports
- [ ] Invoicing User (Accountant) — create master data, record transactions, view reports
- [ ] **Contact — view own invoices/bills only, make payment**
- [ ] System — validates data, computes taxes, updates ledgers, generates reports

---

## B. From the mockup (NOT in the PDF — this is the differentiator)

### Auth
- [ ] Login ID unique, 6–12 characters
- [ ] Email not duplicate
- [ ] Password >8 chars, one lowercase, one uppercase, one special character
- [ ] Login error text exactly: `Invalid Login Id or Password`
- [ ] Signup creates **Accountants only**
- [ ] Forgot Password page

### Pre-seeded data
- [ ] CoA seeded: Bank, Purchase Expense, Debtors, Creditors, Sales Income, Cash, Other Expense, Capital
- [ ] Journals seeded with defaults: Sales→Sales Income, Purchase→Purchase Expense, Bank→Bank, Cash→Cash
- [ ] **Opening capital entry in seed** — answers "where did the money come from?"

### Chart of Accounts
- [ ] Eight types in two groups — BS: Asset, Liability, Bank, Capital, Cash · P&L: Income, Expenses, Other Expenses
- [ ] Group headings are labels, **not selectable**
- [ ] Account type drives report placement

### Journal entries
- [ ] Partner on the **line**, not the entry
- [ ] Account is many-to-one from CoA; Partner many-to-one from Contact master
- [ ] Status Draft / Posted, shown in list
- [ ] **BLOCKING** warning when debit ≠ credit
- [ ] List columns: Date, Number, Partner, Journal, Total, Status

### Purchase
- [ ] PO buttons: New · Confirm · **Create Bill** · Cancel · Back
- [ ] PO number `P00001`, auto-increment
- [ ] PO line: Product, **Budget Analytics**, Qty, Unit Price, Total
- [ ] **NON-BLOCKING** budget warning on PO confirm
- [ ] Bill number `Bill/2026/0001`
- [ ] **Bill Reference** — separate free-text field for the vendor's number
- [ ] Bill line has **Chart of Account** column, Purchase account by default
- [ ] **PO smart button — only visible if the bill came from a PO**
- [ ] **Budget smart button** — opens the analytic report used by the bill
- [ ] Payment status computed: Paid (due=0) / Partial (due<total) / Not Paid (due=total)
- [ ] Footer: Paid Via Cash, Paid Via Bank, Amount Due
- [ ] Journal entry created **on Bill confirm** — not on PO confirm

### Budget
- [ ] Stages: New→Draft, Confirm→Confirmed, **Revise**→Revised, Cancel→Cancelled
- [ ] Revise visible **only** at Confirmed
- [ ] Revise creates a NEW budget; old moves to Revised
- [ ] **Links in both directions** — original ↔ revision
- [ ] Name convention: original name + " Revised"
- [ ] Achieved Amount = matching analytic lines in period (Income→invoices, Expense→bills)
- [ ] Achieved % = (Achieved / Committed) × 100
- [ ] Amount to Achieve = Committed − Achieved
- [ ] **Achieved Amount is clickable** → list of Invoices/Bills with that analytic in that period
- [ ] Vocabulary is "Achieved", not "Advised"

### Dashboard & nav
- [ ] Nav: Sales · Purchase · Account · Report
- [ ] Sales menu: Sales Order, Sale Invoice, Receipt
- [ ] Purchase menu: Purchase Order, Purchase Bill, Payment
- [ ] Account menu: Contact, Product, Analyticals, Analytical Budget, Chart of Account, Journals, Journal Entries
- [ ] Report menu: Balancesheet, Profit and Loss, Budget Report
- [ ] Cards: Sales (All/Confirmed/Draft), Purchase (same), Budget (Achieved/Budget/Committed)

### Forms
- [ ] Button row on every form: New · Confirm · Archived · Home · Back
- [ ] Print / PDF on reports

---

## C. Correctness traps

- [ ] Confirming a PO or SO creates **no** journal entry
- [ ] Revenue recognised at invoice, not at payment
- [ ] Payment entry never touches Income
- [ ] Net profit flows into equity — Balance Sheet balances
- [ ] Tax posts to its own account, not to Sales Income
- [ ] Archive works; **delete blocked** once referenced
- [ ] Portal: changing the invoice ID in the URL returns 403
- [ ] P&L takes a range; Balance Sheet takes a single as-of date
- [ ] A manual journal entry with no source document **moves the P&L**
- [ ] Posted entries cannot be edited — reversal only
- [ ] Partial payment leaves a residual; one payment can settle several documents
- [ ] Money is DECIMAL everywhere — no floats
- [ ] Double-clicking Confirm does not create two entries

---

## D. Ambiguities — spotted, not silently resolved

Say these out loud. Noticing them is the hiring signal.

- [ ] PDF promises "financial and **stock** reports" but defines no stock module → we built a minimal stock ledger rather than guessing at inventory
- [ ] PDF lists five account types; mockup lists eight → we went with the mockup, since Bank and Cash as distinct types matches real charts of accounts
- [ ] Product type "Combo" defined but never used downstream → state our decision

---

## E. Demo dry-run

- [ ] Full flow rehearsed **three times**
- [ ] `/verify` shows difference 0.00
- [ ] Load test numbers recorded with `EXPLAIN ANALYZE`
- [ ] `git log` shows four contributors across the night
- [ ] Every member can explain the whole architecture
- [ ] Roadmap slide ready
