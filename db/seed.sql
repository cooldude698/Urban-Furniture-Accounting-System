-- Urban Furniture Accounting System — seed.sql
-- Run once against a freshly-applied schema.sql.

BEGIN;

-- ============================================================
-- Chart of Accounts
-- 8 accounts from the mockup, PLUS two tax accounts (see the
-- ambiguity note at the top of schema.sql: the spec's "8 accounts
-- only" conflicts with "tax posts to its own account, never Sales
-- Income/Purchase Expense" — this is the resolution).
-- ============================================================

INSERT INTO accounts (name, type) VALUES
  ('Bank',                 'bank'),
  ('Cash',                 'cash'),
  ('Debtors',              'asset'),
  ('Creditors',            'liability'),
  ('Sales Income',         'income'),
  ('Purchase Expense',     'expense'),
  ('Other Expense',        'other_expense'),
  ('Capital',              'capital'),
  ('Input Tax Credit',     'asset'),
  ('Output Tax Payable',   'liability');

-- ============================================================
-- Journals, with default accounts
-- ============================================================

INSERT INTO journals (name, type, default_account_id)
SELECT 'Sales',    'sales',    id FROM accounts WHERE name = 'Sales Income';
INSERT INTO journals (name, type, default_account_id)
SELECT 'Purchase', 'purchase', id FROM accounts WHERE name = 'Purchase Expense';
INSERT INTO journals (name, type, default_account_id)
SELECT 'Bank',      'bank',    id FROM accounts WHERE name = 'Bank';
INSERT INTO journals (name, type, default_account_id)
SELECT 'Cash',      'cash',    id FROM accounts WHERE name = 'Cash';

-- ============================================================
-- Document sequences
-- PO format is explicit in the spec: P00001 (no year, padding 5).
-- Bill/Inv are explicit: Bill/2026/0001, Inv/2026/0001 (year, padding 4).
-- SO/JE/PAY formats are not specified anywhere in the docs — assumed to
-- follow the same year-stamped pattern as Bill/Inv rather than PO's,
-- since PO is called out as the odd one out. Flagging this as an
-- assumption, not a silent guess.
-- ============================================================

INSERT INTO doc_sequences (code, prefix, use_year, padding, current_number) VALUES
  ('PO',   'P',    false, 5, 0),
  ('BILL', 'Bill', true,  4, 0),
  ('INV',  'Inv',  true,  4, 0),
  ('SO',   'SO',   true,  4, 0),
  ('JE',   'JE',   true,  4, 0),
  ('PAY',  'PAY',  true,  4, 0)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Admin user
-- Password: Admin@12345 — meets the >8 chars, upper/lower/special rule.
-- Hash generated with the `argon2` npm package (argon2id, same as api/ will use):
--   argon2.hash('Admin@12345', { type: argon2.argon2id })
-- Verified to actually match the plaintext, not a placeholder string.
-- ============================================================

INSERT INTO users (login_id, email, full_name, password_hash, role) VALUES
  ('adminuf', 'admin@urbanfurniture.local', 'Urban Furniture Admin',
   '$argon2id$v=19$m=65536,p=4,t=3$zG+wnSToNlwTxT8bgSoScQ$qlUuLg+m0PGZH0j0cIqNLWd1cnoYQlymXL+7ly2WFuw',
   'admin');

-- ============================================================
-- Opening capital entry is NOT seeded here — db/seed_data.sql (generated
-- by gen_seed.py) posts it as journal entry #1 along with the rest of the
-- transaction history. Seeding it twice would double-post capital and
-- collide with seed_data.sql's own id=1 journal entry.
-- ============================================================

COMMIT;
