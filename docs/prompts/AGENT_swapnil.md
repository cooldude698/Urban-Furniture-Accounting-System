# Agent Prompt — Swapnil (Frontend Foundation & Reports)

Paste the opener into Antigravity, then feed one phase at a time.

---

## Session opener

```
You are working on Urban Furniture, a double-entry accounting system for the Odoo
Hackathon 2026 finale. 24 hours, offline, no external APIs.

BEFORE WRITING ANY CODE, read completely:
  AGENTS.md
  docs/Design.md
  docs/architecture_flow.md
  docs/requirements.md

Then confirm back, under 10 lines:
  1. The three font families and which is used for money
  2. The difference between BlockingWarning and NonBlockingWarning, and when each shows
  3. The API response envelope and which field decides which warning renders
  4. Why we cannot load fonts from the Google Fonts CDN

Do not write code until I reply "correct".

I own the frontend foundation, then reports, dashboard and budget UI.
Two teammates build their own screens using my components, so the component
library must be finished in the first 3 hours. That is the critical path.

Work ONE PHASE at a time. After each phase, run the verification, describe what
renders, then STOP and wait for "next phase".
```

---

## PHASE 1 — Scaffold & tokens (hour 0–1)

```
PHASE 1.

Build:
1. Vite + React 18 + TypeScript strict + Tailwind.
2. Download and SELF-HOST as .woff2 in public/fonts:
     Montserrat 600/700, DM Sans 400/500, IBM Plex Mono 400/500
   @font-face them in index.css. NO CDN link, no <link> to fonts.googleapis.com.
   We are offline — a CDN font will silently fail at the venue.
3. CSS variables in index.css, exactly as listed in docs/Design.md section 2.
   Do not invent colours. Do not use purple, blue-grey or any colour not in that list.
4. Tailwind theme extension mapping the tokens.
5. AppShell: top nav with exactly four items — Sales, Purchase, Account, Report.
   Active item: --brown-700 with a 2px underline.
6. React Query provider, axios instance with withCredentials: true.

Verify: run dev server, screenshot the shell. All three fonts must render from
local files. Open devtools Network and confirm zero requests to any external domain.

Then STOP.
```

---

## PHASE 2 — Component library (hours 1–3) — CRITICAL PATH

```
PHASE 2. Nothing else in the build can start until this is done. Do not gold-plate.

Build in src/components/:

1. <ListView> — columns config, search box, filter slot, clickable rows.
   Money columns: IBM Plex Mono, right-aligned, tabular-nums.
   Header --brown-100, row hover --brown-100, 44px rows.

2. <FormView> — sticky top button row, exactly:
   New | Confirm | Archived | Home | Back
   Variants per docs/Design.md section 4. Extra buttons passed as children
   (Create Bill, Pay, PO, Budget).

3. <LineItemGrid> — add/remove rows, per-row total = qty * unitPrice, auto totals row.
   Tab moves across cells, Enter adds a new row.
   Money as string in and out. Use decimal.js. NEVER parseFloat.

4. <SmartButton> — count on top (Montserrat), label beneath (11px).
   Renders NOTHING when `visible` is false — do not render a disabled state.

5. <StatusBadge> — draft | posted | confirmed | paid | partial | not_paid | cancelled | revised.
   Always shows a text label. Never colour alone.

6. <BlockingWarning> — solid 4px --danger left bar, --danger-bg fill.
   Consumer disables the primary action while it is shown.

7. <NonBlockingWarning> — dashed --warning border, --warning-bg fill, dismissible.
   Primary action STAYS ENABLED. Default copy:
   "⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining
   budget amount for this budget line. Consider adjusting the value or revise the budget."

   These two must look OBVIOUSLY different at a glance. A reviewer checks both.

8. <Money> — takes a string, formats with Indian grouping, mono, right-aligned.

9. Auth pages: Login, Signup, Create User, Forgot Password.
   Login error renders exactly "Invalid Login Id or Password".

Verify: build a /kitchen-sink route rendering every component in every state.
Screenshot it. Confirm BlockingWarning and NonBlockingWarning are visually distinct.

Then STOP and post the import paths to the team.
```

---

## PHASE 3 — Dashboard (hours 3–8)

```
PHASE 3.

Build:
1. Dashboard with three cards:
     Sales    — All / Confirmed / Draft counts
     Purchase — All / Confirmed / Draft counts
     Budget   — Achieved / Budget / Committed counts
   Each card has a New (or Report) button top-right, per the mockup.
2. Recent activity list.
3. KPI strip: Cash in hand, Bank, Total Receivable, Total Payable, This month net income.

All counts come from the API. If an endpoint does not exist yet, render a loading
state and tell me which route you need. DO NOT hardcode numbers. DO NOT invent
an endpoint path — ask.

Verify: screenshot with real seeded data. Then STOP.
```

---

## PHASE 4 — Budget UI (hours 8–14)

```
PHASE 4.

Build:
1. Budget list: Name, Period, Responsible, Status.
2. Budget form. Stage buttons: New | Confirm | Revise | Cancel
     Revise is visible ONLY when status is 'confirmed'. Hidden otherwise.
3. Revise flow: creates a new budget, original moves to Revised.
   Show the link BOTH ways — original page links to the revision, revision links back.
   New budget name = original name + " Revised".
4. Budget line grid: Analytic | Type | Committed | Achieved | Achieved % | Amount to Achieve
5. Achieved Amount is a BUTTON. Clicking opens the list of invoices/bills with that
   analytic account inside the budget period.

Use the word "Achieved" everywhere. Never "Advised" — that is wrong and it is the
spec authors' own vocabulary.

Verify: confirm a budget, revise it, screenshot both records showing the two-way link.
Then STOP.
```

---

## PHASE 5 — Reports (hours 14–20)

```
PHASE 5. These are the demo centrepiece.

Build:
1. Balance Sheet
     SINGLE as-of date picker.
     Assets column vs Liabilities + Capital column.
     Totals at the bottom of each side, must visibly match.
2. Profit & Loss
     DATE RANGE picker. A different control from the Balance Sheet — this is deliberate,
     do not share the component or the state.
     Income − Expenses = Net Profit.
3. Budget Report — table plus a Recharts pie (committed vs achieved).
4. Print / PDF button on all three.
5. DRILL-DOWN: every figure on every report is clickable ->
     account ledger -> journal entries -> source document.
     Four levels. This is our biggest differentiator, do not cut it.
6. /verify page: Total Debits, Total Credits, Difference. Large type, centred.
   Green when 0.00. This is a demo moment — make it look confident.

Verify: screenshot all three reports plus a full drill-down from a Balance Sheet
figure to a source invoice. Then STOP.
```

---

## PHASE 6 — Polish (hours 20–24)

```
PHASE 6. Only if Tier 0 is green.

1. Empty states, loading states, error toasts.
2. Keyboard navigation on LineItemGrid — arrows between cells, Enter for new row.
   This is our "Tally speed" differentiator.
3. If Socket.IO is wired: 600ms --posted-bg flash on any report figure that changes live.
   Must be visible from the back of the room.
4. Accessibility pass: focus rings present, no --brown-500 used for text,
   every icon-only button has aria-label.

Then STOP.
```
