# Urban Furniture — Accounting System .

Double-entry accounting and light ERP for a furniture business.
Built at the **Odoo India Hackathon 2026 Finale** (Gandhinagar, 24 hours, offline).

Master Data → Purchase / Sales → Bill / Invoice → Payment → Journal Entry → Reports

---

## The one rule

Every confirmed Bill or Invoice writes a **balanced** journal entry. Reports are queries over that ledger — never stored separately, never summed from document tables. If the ledger is fake, everything downstream collapses under judging.

Orders (PO / SO) are commercial intent and produce **no** accounting entries.

---

## Docs

| File | What it is |
|---|---|
| `PRD.md` | What we're building and what we're deliberately not |
| `requirements.md` | The checklist. Every PS + mockup requirement, tickable |
| `schema.md` | Data model explained (DDL lives in `schema.sql`) |
| `architecture_flow.md` | Request flow, posting flow, module boundaries |
| `techstack.md` | Stack and why each piece |
| `Design.md` | Colours, type, components, UI patterns |
| `prompts/` | Per-person handoff briefs |

---

## Constraints (non-negotiable)

1. **No external APIs.** No Gemini, no OpenAI, no cloud OCR/STT, no payment gateway, no Google Fonts CDN. Everything runs in our Compose stack, offline.
2. **PostgreSQL.** Reviewers care specifically.
3. **Custom build, not on Odoo.** We mirror Odoo's architecture and vocabulary; we do not use their accounting engine.
4. **The mockup is the spec.** Where the PDF and the Excalidraw disagree, the mockup wins.

---

## Stack

React + Vite + Tailwind · Node + Express + TypeScript · PostgreSQL 16 · Prisma · Zod · Socket.IO · Docker Compose

---

## Quickstart

```bash
git clone <repo-url> && cd urban-furniture
cp .env.example .env          # DATABASE_URL, JWT_SECRET

docker compose up -d db
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql    # CoA, journals, sequences, opening capital

cd server && npm i && npm run dev      # :5000
cd ../client && npm i && npm run dev   # :5173
```

Full stack: `docker compose up --build`

---

## Verify it works

`GET /api/verify` returns total debits, total credits and the difference.
**The difference must always be 0.00.** If it isn't, stop and fix the ledger before building anything else.

---

## Team

| Name | Ownership |
|---|---|
| Vedesh S Khatri | Backend spine — schema, auth/RBAC, posting service, payments, reports |
| Swapnil | Frontend foundation, reports, dashboard, budget UI |
| Aman | Master data (API + UI), purchase flow |
| Aryan | Sales flow, contact portal |
