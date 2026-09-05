# Cross-cutting decisions

Things discovered mid-build that change what everyone writes. Newest on top.

---

## 2026-09-05 — Transactions use raw `pg`, not Prisma's `$transaction`

**Found in Phase 1, the CRITICAL test AGENT_vedesh.md asked for.**

Prisma 5.22.0's interactive `$transaction(async (tx) => {...})` does not
correctly surface a `COMMIT` failure. When the `trg_lines_balanced` /
`trg_entry_status_balanced` DEFERRABLE constraint trigger rejects an unbalanced
posted entry at COMMIT, Postgres correctly rolls back (verified: 0 orphan
rows), but Prisma's engine only logs `transaction failed to commit`
internally — the `$transaction()` promise **resolves** with the callback's
return value instead of rejecting. Calling code would believe the post
succeeded.

Reproduced in `api/scripts/test-deferred-trigger.ts` (Test 2 failing is the
expected signal) and confirmed as a genuine Prisma limitation, not a bug in
our trigger, by `api/scripts/test-pg-raw.ts`: the identical unbalanced insert
run through a raw `pg` client correctly rejects on `COMMIT`.

**Decision:** any transaction that touches `journal_entries` /
`journal_entry_lines` — which means `postingService.postDocument()` and every
caller that wraps it (Vendor Bill confirm, Customer Invoice confirm, Payment
create, manual Journal Entry post) — must run inside a raw `pg` transaction
(`BEGIN` / `COMMIT` / `ROLLBACK` on a single `PoolClient`), not
`prisma.$transaction()`.

**What this means for you, Aman and Aryan:** the `tx` parameter in
`postDocument(type, id, tx)` is a `pg.PoolClient`, not a Prisma
`TransactionClient`. Your bill/invoice confirm handlers need to open that same
`pg` transaction (a shared helper will live in `api/src/db/withTransaction.ts`)
and pass it through to `postDocument`, `next_doc_number`, your own
status/`po_id`/`journal_entry_id` update, stock move inserts, and the audit
log write — all as one atomic transaction, same as before, just on a `pg`
client instead of a Prisma one.

Prisma Client is unaffected everywhere else — plain reads, master data CRUD,
anything that never flips a journal entry to `posted` inside a multi-statement
transaction.

Full signature and behaviour lands in `docs/POSTING_API.md` in Phase 3.
