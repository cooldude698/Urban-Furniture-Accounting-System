# Aman — Master Data & Purchase

**Tool:** Antigravity · **Owns:** master data (API + UI), then the purchase flow

**You ship first.** Nobody can build transactions without contacts, products, accounts and journals. Get master data working by hour 6 even if it's ugly — polish later.

You are full-stack on your vertical: your own API routes, your own screens using Swapnil's components.

---

## Do not

- Write to `journal_entries` or `journal_entry_lines`. Call `postingService.postDocument()`
- Post a journal entry on **PO confirm**. Only the Bill posts
- Make the budget warning blocking
- Allow deletion of a referenced record — archive instead

---

## Hours 0–6 — master data

**Contacts** — Name, Type (Customer/Vendor/Both), Email, Mobile, Address, City, State, Pincode, Profile Image, GSTIN. List + Form. Image upload to a local volume.

**Products** — Name, Type (Goods/Service/**Combo**), Category, Sales Price, Cost, MRP, Tax Rate. List + Form.
*Combo is in the spec and most teams ignore it. Implement it, or write down why you deferred.*

**Chart of Accounts** — list + form. Seeded by Vedesh; you build the UI.
Type dropdown has **eight** options in **two groups**:
- Balance Sheet: Asset, Liability, Bank, Capital, Cash
- Profit and Loss: Income, Expenses, Other Expenses

Group headings are labels — **not selectable**.

**Journals** — Name, Type (Sales/Purchase/Bank/Cash), Default Account (from CoA).

**Analytic Accounts** — Name, Type (Income/Expense).

**Archive, never delete.** `is_archived` hides from dropdowns, keeps history. Deleting a referenced record must be blocked.

## Hours 6–10 — Purchase Order

- Buttons: New · Confirm · **Create Bill** · Cancel · Back
- Number `P00001`, from `next_doc_number('PO')`
- Fields: Vendor (from Contact master), PO Date
- Lines: Sr No, Product, **Budget Analytics**, Qty, Unit Price, Total (= qty × price)
- On Confirm: budget check → if over, show the **NON-BLOCKING** warning

> ⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining budget amount for this budget line. Consider adjusting the value or revise the budget.

**The transaction still goes through.** Warn, don't block.

- **No journal entry on PO confirm.** None.

## Hours 10–14 — Vendor Bill

- Buttons: New · Confirm · Pay · **PO** · **Budget** · Cancel · Back
- **PO smart button appears only if the bill came from a PO.** Hide it completely on standalone bills
- **Budget smart button** opens the analytic report used by the bill
- `number` = `Bill/2026/0001` (ours)
- `bill_reference` = `ABC-26-001` — free text, **the vendor's number**. Separate field
- Fields: Vendor, Bill Date, Due Date
- Lines: Product, **Chart of Account** (Purchase Expense by default), Budget Analytics, Qty, Unit Price, Total
- Status computed, never stored: Paid (due=0) / Partial (due<total) / Not Paid (due=total)
- Footer: Paid Via Cash, Paid Via Bank, Amount Due
- Create Bill from PO copies vendor, products, prices, quantities and sets `po_id`

**On Confirm:** call `postDocument('bill', id, tx)`. Inside the same transaction: create stock moves (+qty per goods line), write audit log.

## Hours 14–18
- Smart buttons on Contact: invoice count, bill count, opening filtered lists
- Vendor statement: bills, payments, running balance
- Kanban view for products if time allows

## Hours 18+
- SKU generator, low stock alert, slow-mover alert, MRP/below-cost warning (same non-blocking pattern)
