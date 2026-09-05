# Swapnil — Frontend Foundation & Reports

**Tool:** Antigravity · **Owns:** component library, then reports, dashboard, budget UI

You are the critical path nobody notices. **Ship the component library in the first 3 hours.** If you hand-build twenty screens yourself the build dies. Build the kit, hand it over, then own the visually heaviest screens.

Read `Design.md` first. Self-host the fonts — no Google Fonts CDN, we are local-only.

---

## Hours 0–3 — the kit (nothing else matters until this lands)

- Layout shell + top nav: **Sales · Purchase · Account · Report**
- Design tokens as CSS variables from `Design.md`
- `<ListView>` — table, search, filters, clickable rows, right-aligned mono amounts
- `<FormView>` — sticky button row: New · Confirm · Archived · Home · Back
- `<LineItemGrid>` — add/remove rows, auto-total, Tab across, Enter for new row
- `<SmartButton>` — count on top, label beneath, **hides entirely when not applicable**
- `<StatusBadge>` — Draft / Posted / Confirmed / Paid / Partial / Not Paid / Cancelled / Revised
- `<BlockingWarning>` — solid red bar, action **disabled**
- `<NonBlockingWarning>` — dashed amber, dismissible, action **stays enabled**
- Auth screens: login, signup, create user, forgot password

**The two warning components must look obviously different.** The spec has two severities and the reviewer will check both.

Then post in the group: "components are ready, here's the import path." Aman and Aryan build their own screens from here.

## Hours 3–8 — dashboard
- Three cards: Sales (All/Confirmed/Draft), Purchase (same), Budget (Achieved/Budget/Committed)
- Recent activity list
- Counts come from the API, never hardcoded

## Hours 8–14 — budget UI
- Budget list + form with stage buttons: New · Confirm · **Revise** · Cancel
- Revise appears **only** at Confirmed stage
- Show lineage both ways: original ↔ revision, both navigable
- Line grid: Analytic, Type, Committed, **Achieved**, **Achieved %**, **Amount to Achieve**
- **Achieved Amount is clickable** → opens the filtered invoice/bill list
- Use "Achieved", never "Advised"

## Hours 14–20 — reports
- Balance Sheet — Assets vs Liabilities+Capital, totals must visibly match. **Single as-of date picker**
- P&L — Income − Expenses = Net Profit. **Date range picker.** Different control from the Balance Sheet
- Budget Report — table + Recharts pie (committed vs achieved)
- Print / PDF button on all three
- **Drill-down:** every figure is clickable → account ledger → entries → source document
- `/verify` page: total debits, total credits, difference. Big type. This is a demo moment

## Hours 20–24
- Tier 2 if green: live-update flash on Socket.IO report changes (600ms `--posted-bg`), keyboard nav
- Polish, empty states, loading states
- Rehearse

---

## Rules

- Money: mono, right-aligned, `tabular-nums`. Always
- Money arrives as a string — parse with decimal.js, never `parseFloat`
- Render the warning component matching `error.severity` from the API
- Never encode status in colour alone — always a text label
- Debit/credit columns are plain figures, not red/green
