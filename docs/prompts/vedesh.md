# Vedesh — Backend Spine

**Tool:** Claude Code · **Owns:** schema, auth/RBAC, posting service, sequences, payments, reports

You are the dependency for three people. Auth, sequences and the posting service must exist by **hour 6** or everyone stalls. Do those before your own report queries.

---

## Do not

- Let anyone else write to `journal_entries` or `journal_entry_lines`
- Use floats for money anywhere
- Post a journal entry on PO or SO confirm
- Put authorisation in route guards instead of the scoping layer

---

## Hours 0–2 — foundation
- Run `db/schema.sql`, verify all triggers exist
- **Test the DEFERRABLE trigger against Prisma's transaction handling immediately.** If it misbehaves, find out now, not at hour 20
- Write `db/seed.sql`: 8 accounts, 4 journals, `doc_sequences` rows, admin user, **opening capital entry** (`DR Cash / CR Capital`)
- Docker Compose up: `db`, `api`, `web`
- Verify CORS `credentials: true` on both sides across the container boundary

## Hours 2–4 — auth
- Argon2id hashing. Never bcrypt-with-low-rounds, never SHA
- JWT in httpOnly cookie, `sameSite: 'lax'`, `secure: false` for local
- Explicit server-side logout route (httpOnly can't be cleared client-side)
- Signup creates **role = accountant only**
- Credential rules: login ID unique 6–12 chars, email unique, password >8 with lower/upper/special
- Error text exactly `Invalid Login Id or Password`
- Contact users: created from Contact master, invited with a token, set their own password

**`scopeFor(user, resource)`** — the record-rule layer. Every data path goes through it. Contact users get `{ customerId: user.contactId }` injected at the data layer, not checked in the controller.

## Hours 4–6 — sequences + posting service
- `next_doc_number(code)` with `SELECT ... FOR UPDATE`, called inside the document's transaction
- `postingService.postDocument(type, id, tx)` — one function, both sides:

```
Bill:    DR Purchase Expense (per line, analytic) / DR Input Tax / CR Creditors(vendor)
Invoice: DR Debtors(customer) / CR Sales Income (per line, analytic) / CR Output Tax
```

- Idempotency: double-clicking Confirm must not create two entries
- Publish the signature to Aman and Aryan the moment it works

## Hours 6–10 — ledger
- Journal entry CRUD API, draft → posted
- Blocking validation on debit ≠ credit (app-level message; the DB is the backstop)
- Manual entries with `source_type = NULL` must work — reviewers test this
- Reversal endpoint: creates a mirrored entry with `reversal_of` set

## Hours 10–14 — payments
- `POST /api/payments` with allocations array
- Validate `SUM(allocations) = payment.amount` and each ≤ `amount_due` from the view
- Post: inbound `DR Cash/Bank, CR Debtors` · outbound `DR Creditors, CR Cash/Bank`
- **Never touches Income**
- Status stays computed. Never write a status column

## Hours 14–18 — reports
- All read from `journal_entry_lines` joined to **posted** entries only
- P&L: BETWEEN two dates · Balance Sheet: cumulative UP TO one date. **Different parameters**
- Balance Sheet equity includes current-period profit or it won't balance
- `GET /api/verify` → `{ totalDebit, totalCredit, difference }`. Difference is always 0.00

## Hours 18–20 — drill-down + audit
- `GET /api/ledger?accountId=&from=&to=` backing report → account → entries → source document
- `audit_log` written on every create/confirm/post/cancel/pay

## Hours 20–24
- Seed 50,000 journal lines, run k6 against report endpoints
- Record p50/p95 before and after `idx_jel_report`. Save the `EXPLAIN ANALYZE` output
- Rehearse the demo three times

---

## API contract — publish this at hour 0

```ts
{ data: T, error: null }
{ data: null, error: { code, message, severity: 'blocking'|'warning', fields? } }
```

Money crosses the wire as a **string**. `"5000.00"`. decimal.js both ends.
