# AGENTS.md — Rules for every agent on this repo

Applies to all Antigravity / Claude Code sessions. Read before doing anything.

---

## 1. Authority order

When sources disagree, higher wins:

1. `db/schema.sql` — the only truth about tables, columns, types
2. `docs/requirements.md` — the only truth about what must be built
3. `docs/architecture_flow.md` — the only truth about layering and contracts
4. `docs/Design.md` — the only truth about colours, type, components
5. Your own prompt file in `docs/prompts/`
6. Everything else

**Never infer a column, table, endpoint or field name.** If it is not in `schema.sql`, it does not exist. Stop and ask.

## 2. Anti-hallucination rules

- **Do not invent schema.** No new tables or columns without the human approving a `schema.sql` change first.
- **Do not invent API endpoints** from another module. If you need data from someone else's area, ask for the route; do not guess it.
- **Do not install packages** that are not in `docs/techstack.md`. If you believe one is needed, stop and ask.
- **Do not write placeholder or mock data** in application code. Seed data belongs in `db/seed.sql` only.
- **Do not stub a function and move on.** Either implement it or stop and report that it is blocked.
- **If you are unsure, stop and ask.** A question costs 30 seconds. A wrong assumption costs three hours.
- **Do not claim something works without running it.** Every phase ends with a verification command whose real output you paste.

## 3. Scope rules

- Build **only** what the current phase lists. Nothing from a later phase.
- Do not refactor another person's module.
- Do not touch files outside your ownership list without asking.
- No feature not in `requirements.md` unless the human explicitly says so.
- Do not add auth, caching, logging frameworks, state managers or abstractions that were not asked for.

## 4. Hard technical rules

- **Money is `DECIMAL(14,2)` in Postgres and `decimal.js` in JS.** Never `float`, never `number`, never `parseFloat`. Across the wire it is a **string**: `"5000.00"`.
- **Only `services/postingService.ts` writes to `journal_entries` and `journal_entry_lines`.** Everything else calls `postDocument()`.
- **Confirming a Purchase Order or Sales Order creates NO journal entry.** Only Bills and Invoices post.
- **Revenue is recognised at invoice, never at payment.** A payment entry never touches an Income account.
- **Payment status is computed from views**, never stored on the document.
- **Posted entries are immutable.** Corrections are reversals.
- **Two warning severities.** Debit ≠ credit is BLOCKING. Budget overrun is NON-BLOCKING (warn, allow confirm).
- **Archive, never delete.** Deleting a referenced record must be blocked.
- **Authorisation is `scopeFor(user, resource)` at the data layer**, never an `if` in a controller.
- **No external network calls.** No CDNs, no third-party APIs, no hosted fonts. Everything runs offline.

## 5. Code style

- TypeScript strict. No `any`.
- Routes are thin: parse → call service → shape response. Logic lives in `services/`.
- Every mutation runs in a transaction and writes to `audit_log`.
- Zod schemas live in `shared/schemas/` and are imported by both client and server.
- Response envelope, always:

```ts
{ data: T, error: null }
{ data: null, error: { code, message, severity: 'blocking' | 'warning', fields? } }
```

## 6. Phase protocol

Work one phase at a time.

1. Restate the phase deliverables in one line
2. List files you will create or modify — **wait for confirmation if any fall outside your ownership**
3. Implement
4. Run the phase's verification command
5. Paste the real output
6. **STOP.** Report what works, what does not, what you assumed. Wait for "next phase."

Do not start the next phase on your own.

## 7. Git

- Commit at the end of every phase
- Format: `<module>: <what changed>` — e.g. `purchase: PO confirm with budget warning`
- Push after every phase. Distributed commit history across the night is judged.
- Never force-push. Never commit `.env`.

## 8. When blocked

Report in this shape and stop:

```
BLOCKED
Phase: <n>
Need: <the exact thing>
Owner: <who owns it>
Workaround attempted: <or none>
```
