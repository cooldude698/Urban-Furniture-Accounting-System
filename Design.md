# Design System — Urban Furniture

**Direction:** warm, tactile, showroom-grade. Furniture is a material business — wood, leather, linen — so the interface reads warm and crafted rather than cold and corporate. Restraint over decoration: this is a system accountants stare at for eight hours.

Light theme. Cream ground, walnut ink, one warm accent.

---

## 1. Fonts

**Google Sans is not publicly licensed** — not on Google Fonts, cannot be self-hosted legally. Substituted below. Also: no Google Fonts CDN, since we are local-only. **Self-host `.woff2` in `/public/fonts` and `@font-face` them.**

| Role | Font | Use |
|---|---|---|
| Display | **Montserrat** 600/700 | Page titles, KPI numbers, section headers |
| Body | **DM Sans** 400/500 | Everything else. Closest open equivalent to Google Sans |
| Figures | **IBM Plex Mono** 400/500 | Ledger columns, debit/credit, amounts in tables |

Money is always mono, always right-aligned, always `font-variant-numeric: tabular-nums`. Columns of figures that don't align read as amateur to an accountant.

```css
--font-display: 'Montserrat', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
```

Not used: Arial, Inter, JetBrains Mono, system stacks.

### Scale
| Token | Size / Line | Use |
|---|---|---|
| `text-display` | 32 / 40 | Page title |
| `text-h1` | 24 / 32 | Section |
| `text-h2` | 18 / 26 | Card header |
| `text-body` | 15 / 24 | Default |
| `text-sm` | 13 / 20 | Table cells, labels |
| `text-xs` | 11 / 16 | Captions, badges |

---

## 2. Colour

```css
/* Neutrals — walnut scale */
--brown-900: #4A3A34;   /* primary text, headers */
--brown-700: #77574A;   /* secondary text, active nav */
--brown-500: #A8836C;   /* borders on dark, muted icons */
--brown-300: #D0AE92;   /* dividers, disabled */
--brown-100: #EBD7BE;   /* hover fills, table stripes */
--cream:     #F9F2E4;   /* app background */
--surface:   #FFFFFF;   /* cards, forms, tables */

/* Semantic — tuned to sit inside the warm palette */
--posted:    #5F7052;   /* posted, confirmed, paid, success */
--posted-bg: #EDF1E8;
--warning:   #C08A3E;   /* NON-blocking: budget overrun, MRP, low stock */
--warning-bg:#FBF1DF;
--danger:    #9E4A38;   /* BLOCKING: unbalanced entry, overdue, destructive */
--danger-bg: #F8EAE6;
--info:      #77574A;
--draft:     #A8836C;   /* draft, unpaid, neutral */
```

**Rules**
- `--danger` is reserved for blocking states and destructive actions. Never for decoration.
- `--warning` and `--danger` must be visually distinct — the spec has two severities and the UI must show which is which at a glance.
- Never encode meaning in colour alone. Every status badge carries a text label.
- Debit and credit columns are **not** coloured red/green. They are plain mono figures. Accountants read the column, not the hue.

---

## 3. Surfaces

```css
--radius-sm: 6px;    /* inputs, badges */
--radius-md: 10px;   /* cards, panels */
--radius-lg: 16px;   /* modals */
--shadow-sm: 0 1px 2px rgba(74,58,52,.06);
--shadow-md: 0 4px 12px rgba(74,58,52,.08);
--shadow-lg: 0 12px 32px rgba(74,58,52,.12);
```

Shadows are tinted with the brown, never pure black. Borders: `1px solid var(--brown-300)` at 40% opacity.

**Spacing:** 4px base — 4, 8, 12, 16, 24, 32, 48, 64.

---

## 4. Components

### Button row (every form, from the mockup)
`New` · `Confirm` · `Archived` · `Home` · `Back` — left-aligned, sticky at the top of the form.

- **Primary** (`Confirm`, `Post`, `Pay`): `--brown-900` fill, cream text
- **Secondary** (`New`, `Archived`): `--surface` fill, `--brown-300` border, `--brown-900` text
- **Ghost** (`Home`, `Back`): text only, `--brown-700`
- **Destructive** (`Cancel`): `--danger` text, `--danger-bg` on hover

### Status badges
Pill, 11px, uppercase, letter-spacing 0.04em.

| Status | Text | Fill |
|---|---|---|
| Draft / Not Paid | `--brown-700` | `--brown-100` |
| Posted / Confirmed / Paid | `--posted` | `--posted-bg` |
| Partial | `--warning` | `--warning-bg` |
| Cancelled / Overdue | `--danger` | `--danger-bg` |
| Revised | `--brown-500` | `--surface` + border |

### Two warning components — build both, make them obviously different

**`<BlockingWarning>`** — solid `--danger` left bar 4px, `--danger-bg` fill, action button disabled while shown.
> Debit and credit amounts do not match. Entry cannot be posted.

**`<NonBlockingWarning>`** — dashed `--warning` border, `--warning-bg` fill, dismissible, action stays enabled.
> ⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining budget amount for this budget line. Consider adjusting the value or revise the budget.

### Smart buttons
Bordered box, count on top in `--font-display`, label beneath in `text-xs`. Sits on the record header. Hides entirely when not applicable (the PO button on a standalone Bill).

```
┌──────────┐
│    3     │
│ Invoices │
└──────────┘
```

### List view
Header row `--brown-100`, alternating rows `--cream` at 40%, row hover `--brown-100`, 44px rows. Amounts right-aligned mono. Whole row clickable.

### Line-item grid
Orange-brown cell borders per the mockup (`--brown-300`). Totals row is `--brown-100`, bold, sticky bottom. Tab moves across, Enter adds a row.

---

## 5. Layout

Top nav, four items, per the mockup: **Sales · Purchase · Account · Report**. Active item `--brown-700` with a 2px underline.

Max content width 1440px. Forms max 960px. Reports full width.

Dashboard: three status cards (Sales / Purchase / Budget), each with three counts. `--surface` on `--cream`.

---

## 6. Motion

Restrained. This is a work tool.

- Transitions 150ms `ease-out`
- Modals: 200ms fade + 8px rise
- Toasts: slide from top-right, auto-dismiss 4s
- **One exception:** when a report updates live via Socket.IO, the changed figure gets a 600ms `--posted-bg` flash. That is the demo moment and it should be visible from the back of the room.

No skeleton shimmer, no spring physics, no page transitions.

---

## 7. Accessibility

- Body text on cream must hit 4.5:1 — `--brown-900` and `--brown-700` pass, `--brown-500` does not. Never use `--brown-500` for text.
- Focus ring: 2px `--brown-700`, 2px offset. Never removed.
- Every icon-only button gets an `aria-label`.
- Full keyboard navigation on line-item grids — this is also our Tally-speed differentiator.
