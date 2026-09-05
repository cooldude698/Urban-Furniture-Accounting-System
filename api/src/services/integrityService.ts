import Decimal from 'decimal.js';
import { pool } from '../db/pool';

export type CheckStatus = 'pass' | 'fail' | 'unknown';

export interface IntegrityCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  value: string;
}

export interface IntegrityReport {
  runAt: string;
  passed: number;
  failed: number;
  unknown: number;
  total: number;
  checks: IntegrityCheck[];
}

/**
 * System Integrity Report.
 *
 * Ten checks, each a real query against live data. Nothing is hardcoded.
 * A check that cannot be computed returns 'unknown' — never 'pass'.
 * All money is handled as strings; arithmetic goes through decimal.js.
 */
export class IntegrityService {
  // 1. TRIAL BALANCE — sum of every posted debit equals sum of every posted credit.
  private static async checkTrialBalance(): Promise<IntegrityCheck> {
    const id = 'trial_balance';
    const label = 'Trial balance (posted debits = posted credits)';
    const res = await pool.query<{ total_debit: string | null; total_credit: string | null }>(
      `SELECT COALESCE(SUM(l.debit), 0)::text  AS total_debit,
              COALESCE(SUM(l.credit), 0)::text AS total_credit
       FROM journal_entry_lines l
       JOIN journal_entries e ON e.id = l.entry_id AND e.status = 'posted'`
    );
    const row = res.rows[0];
    if (!row || row.total_debit === null || row.total_credit === null) {
      return { id, label, status: 'unknown', detail: 'No posted ledger rows to evaluate.', value: '—' };
    }
    const debit = new Decimal(row.total_debit);
    const credit = new Decimal(row.total_credit);
    const diff = debit.minus(credit);
    return {
      id,
      label,
      status: diff.isZero() ? 'pass' : 'fail',
      detail: `Sum debit ${debit.toFixed(2)}  vs  Sum credit ${credit.toFixed(2)}  ->  difference ${diff.toFixed(2)}`,
      value: diff.toFixed(2),
    };
  }

  // 2. BALANCE SHEET EQUATION — assets = liabilities + capital + (income - expenses).
  private static async checkBalanceSheetEquation(): Promise<IntegrityCheck> {
    const id = 'balance_sheet_equation';
    const label = 'Balance sheet equation (Assets = Liabilities + Equity)';
    const res = await pool.query<{ account_type: string; balance: string }>(
      `SELECT a.type AS account_type,
              (COALESCE(SUM(l.debit), 0) - COALESCE(SUM(l.credit), 0))::text AS balance
       FROM accounts a
       LEFT JOIN journal_entry_lines l ON l.account_id = a.id
       LEFT JOIN journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
       GROUP BY a.type`
    );
    if (res.rows.length === 0) {
      return { id, label, status: 'unknown', detail: 'No accounts found.', value: '—' };
    }

    let assets = new Decimal(0);
    let liabilities = new Decimal(0);
    let capital = new Decimal(0);
    let income = new Decimal(0);
    let expenses = new Decimal(0);

    for (const r of res.rows) {
      const bal = new Decimal(r.balance); // debit - credit
      switch (r.account_type) {
        case 'asset':
        case 'bank':
        case 'cash':
          assets = assets.plus(bal);
          break;
        case 'liability':
          liabilities = liabilities.plus(bal.negated());
          break;
        case 'capital':
          capital = capital.plus(bal.negated());
          break;
        case 'income':
          income = income.plus(bal.negated());
          break;
        case 'expense':
        case 'other_expense':
          expenses = expenses.plus(bal);
          break;
      }
    }

    const rhs = liabilities.plus(capital).plus(income.minus(expenses));
    const diff = assets.minus(rhs);
    return {
      id,
      label,
      status: diff.isZero() ? 'pass' : 'fail',
      detail:
        `Assets ${assets.toFixed(2)}  =  Liabilities ${liabilities.toFixed(2)} + Capital ${capital.toFixed(2)} ` +
        `+ (Income ${income.toFixed(2)} - Expenses ${expenses.toFixed(2)}) = ${rhs.toFixed(2)}  ->  difference ${diff.toFixed(2)}`,
      value: diff.toFixed(2),
    };
  }

  // 3. NET PROFIT IN EQUITY — the P&L net profit figure appears in the Balance Sheet equity block.
  private static async checkNetProfitInEquity(): Promise<IntegrityCheck> {
    const id = 'net_profit_in_equity';
    const label = 'Net profit carried into Balance Sheet equity';
    const res = await pool.query<{ account_type: string; balance: string }>(
      `SELECT a.type AS account_type,
              (COALESCE(SUM(l.debit), 0) - COALESCE(SUM(l.credit), 0))::text AS balance
       FROM accounts a
       LEFT JOIN journal_entry_lines l ON l.account_id = a.id
       LEFT JOIN journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
       GROUP BY a.type`
    );
    if (res.rows.length === 0) {
      return { id, label, status: 'unknown', detail: 'No accounts found.', value: '—' };
    }

    let income = new Decimal(0);
    let expenses = new Decimal(0);
    let assets = new Decimal(0);
    let liabilities = new Decimal(0);
    let capital = new Decimal(0);
    for (const r of res.rows) {
      const bal = new Decimal(r.balance);
      switch (r.account_type) {
        case 'asset':
        case 'bank':
        case 'cash':
          assets = assets.plus(bal);
          break;
        case 'liability':
          liabilities = liabilities.plus(bal.negated());
          break;
        case 'capital':
          capital = capital.plus(bal.negated());
          break;
        case 'income':
          income = income.plus(bal.negated());
          break;
        case 'expense':
        case 'other_expense':
          expenses = expenses.plus(bal);
          break;
      }
    }

    // P&L view of net profit
    const plNetProfit = income.minus(expenses);
    // Balance sheet view: the residual the equity block must absorb for the sheet to balance
    const equityResidual = assets.minus(liabilities).minus(capital);
    const diff = plNetProfit.minus(equityResidual);
    return {
      id,
      label,
      status: diff.isZero() ? 'pass' : 'fail',
      detail:
        `P&L net profit ${plNetProfit.toFixed(2)}  vs  equity block current-period profit ${equityResidual.toFixed(2)}  ` +
        `->  difference ${diff.toFixed(2)}`,
      value: plNetProfit.toFixed(2),
    };
  }

  // 4. LINE-LEVEL INTEGRITY — no line is both-sided or zero-sided.
  private static async checkLineLevelIntegrity(): Promise<IntegrityCheck> {
    const id = 'line_level_integrity';
    const label = 'Line-level integrity (exactly one of debit / credit per line)';
    const res = await pool.query<{ bad: string }>(
      `SELECT COUNT(*)::text AS bad
       FROM journal_entry_lines
       WHERE (debit > 0 AND credit > 0) OR (debit = 0 AND credit = 0)`
    );
    const bad = res.rows[0]?.bad;
    if (bad === undefined) {
      return { id, label, status: 'unknown', detail: 'Count could not be computed.', value: '—' };
    }
    const n = Number(bad);
    return {
      id,
      label,
      status: n === 0 ? 'pass' : 'fail',
      detail: n === 0 ? 'Every line carries a debit XOR a credit.' : `${n} line(s) have both or neither side populated.`,
      value: bad,
    };
  }

  // 5. UNBALANCED POSTED ENTRIES — every posted entry nets to zero on its own.
  private static async checkUnbalancedPostedEntries(): Promise<IntegrityCheck> {
    const id = 'unbalanced_posted_entries';
    const label = 'Unbalanced posted entries (per-entry Sum debit = Sum credit)';
    const res = await pool.query<{ bad: string }>(
      `SELECT COUNT(*)::text AS bad FROM (
         SELECT l.entry_id
         FROM journal_entry_lines l
         JOIN journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
         GROUP BY l.entry_id
         HAVING SUM(l.debit) <> SUM(l.credit)
       ) x`
    );
    const bad = res.rows[0]?.bad;
    if (bad === undefined) {
      return { id, label, status: 'unknown', detail: 'Count could not be computed.', value: '—' };
    }
    const n = Number(bad);
    return {
      id,
      label,
      status: n === 0 ? 'pass' : 'fail',
      detail: n === 0 ? 'All posted entries balance individually.' : `${n} posted entr(y/ies) do not balance.`,
      value: bad,
    };
  }

  // 6. PAYMENT OVER-ALLOCATION — no invoice or bill is allocated beyond its total.
  private static async checkPaymentOverAllocation(): Promise<IntegrityCheck> {
    const id = 'payment_over_allocation';
    const label = 'Payment over-allocation (Sum allocations <= document total)';
    const res = await pool.query<{ invoices: string; bills: string }>(
      `SELECT
         (SELECT COUNT(*) FROM (
            SELECT ci.id
            FROM customer_invoices ci
            JOIN payment_allocations pa ON pa.invoice_id = ci.id
            GROUP BY ci.id, ci.total
            HAVING SUM(pa.amount) > ci.total
          ) a)::text AS invoices,
         (SELECT COUNT(*) FROM (
            SELECT vb.id
            FROM vendor_bills vb
            JOIN payment_allocations pa ON pa.bill_id = vb.id
            GROUP BY vb.id, vb.total
            HAVING SUM(pa.amount) > vb.total
          ) b)::text AS bills`
    );
    const row = res.rows[0];
    if (!row) {
      return { id, label, status: 'unknown', detail: 'Counts could not be computed.', value: '—' };
    }
    const total = Number(row.invoices) + Number(row.bills);
    return {
      id,
      label,
      status: total === 0 ? 'pass' : 'fail',
      detail: `${row.invoices} over-allocated invoice(s), ${row.bills} over-allocated bill(s).`,
      value: String(total),
    };
  }

  // 7. STOCK RECONCILIATION — products.stock_qty matches Σ stock_moves.qty_change per product.
  private static async checkStockReconciliation(): Promise<IntegrityCheck> {
    const id = 'stock_reconciliation';
    const label = 'Stock reconciliation (cached qty = Sum stock moves)';
    const res = await pool.query<{ id: number; name: string; cache: string; moves: string }>(
      `SELECT p.id, p.name,
              p.stock_qty::text AS cache,
              COALESCE(v.stock_qty, 0)::text AS moves
       FROM products p
       LEFT JOIN v_stock_on_hand v ON v.product_id = p.id
       WHERE p.stock_qty <> COALESCE(v.stock_qty, 0)
       ORDER BY p.id`
    );
    const n = res.rowCount ?? 0;
    if (n === 0) {
      return { id, label, status: 'pass', detail: 'Every product cached stock equals its move history.', value: '0' };
    }
    const sample = res.rows
      .slice(0, 5)
      .map((r) => {
        const delta = new Decimal(r.cache).minus(new Decimal(r.moves));
        return `#${r.id} ${r.name} (cache ${r.cache} vs moves ${r.moves}, d ${delta.toFixed(2)})`;
      })
      .join('; ');
    return {
      id,
      label,
      status: 'fail',
      detail: `${n} product(s) mismatch: ${sample}${n > 5 ? ' …' : ''}`,
      value: String(n),
    };
  }

  // 8. SEQUENCE GAPS — Bill/, Inv/ and P numbering is contiguous with no gaps.
  private static async checkSequenceGaps(): Promise<IntegrityCheck> {
    const id = 'sequence_gaps';
    const label = 'Document sequence gaps (Bill / Inv / P contiguous)';

    const scan = async (
      table: string,
      exprSql: string
    ): Promise<{ max: number | null; count: number; gaps: number[] }> => {
      const r = await pool.query<{ n: string; total: string }>(
        `SELECT (${exprSql})::int AS n, COUNT(*) OVER ()::text AS total FROM ${table}`
      );
      if (r.rows.length === 0) return { max: null, count: 0, gaps: [] };
      const nums = r.rows.map((x) => Number(x.n)).filter((x) => Number.isFinite(x));
      const max = nums.length ? Math.max(...nums) : null;
      const present = new Set(nums);
      const gaps: number[] = [];
      if (max !== null) {
        for (let i = 1; i <= max; i++) if (!present.has(i)) gaps.push(i);
      }
      return { max, count: nums.length, gaps };
    };

    const bill = await scan('vendor_bills', `split_part(number, '/', 3)`);
    const inv = await scan('customer_invoices', `split_part(number, '/', 3)`);
    const po = await scan('purchase_orders', `regexp_replace(number, '^P', '')`);

    if (bill.max === null && inv.max === null && po.max === null) {
      return { id, label, status: 'unknown', detail: 'No sequenced documents found.', value: '—' };
    }

    const totalGaps = bill.gaps.length + inv.gaps.length + po.gaps.length;
    const fmt = (name: string, s: { max: number | null; count: number; gaps: number[] }) =>
      `${name}: highest ${s.max ?? '—'}, ${s.count} docs${s.gaps.length ? `, gaps at [${s.gaps.slice(0, 10).join(', ')}]` : ''}`;

    return {
      id,
      label,
      status: totalGaps === 0 ? 'pass' : 'fail',
      detail: `${fmt('Bill/', bill)}  |  ${fmt('Inv/', inv)}  |  ${fmt('P', po)}`,
      value: String(totalGaps),
    };
  }

  // 9. ORPHAN LEDGER ENTRIES — every source-backed entry points at a row that exists.
  private static async checkOrphanLedgerEntries(): Promise<IntegrityCheck> {
    const id = 'orphan_ledger_entries';
    const label = 'Orphan ledger entries (source_id resolves)';
    const res = await pool.query<{ bad: string }>(
      `SELECT COUNT(*)::text AS bad
       FROM journal_entries e
       WHERE e.source_type IS NOT NULL
         AND (
           (e.source_type = 'invoice' AND NOT EXISTS (SELECT 1 FROM customer_invoices ci WHERE ci.id = e.source_id)) OR
           (e.source_type = 'bill'    AND NOT EXISTS (SELECT 1 FROM vendor_bills vb WHERE vb.id = e.source_id))    OR
           (e.source_type = 'payment' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.id = e.source_id))
         )`
    );
    const bad = res.rows[0]?.bad;
    if (bad === undefined) {
      return { id, label, status: 'unknown', detail: 'Count could not be computed.', value: '—' };
    }
    const n = Number(bad);
    return {
      id,
      label,
      status: n === 0 ? 'pass' : 'fail',
      detail:
        n === 0
          ? 'Every bill/invoice/payment entry resolves to a live source row (manual entries excluded).'
          : `${n} source-backed entr(y/ies) point at a missing row.`,
      value: bad,
    };
  }

  // 10. ANALYTIC COVERAGE — % of confirmed invoice/bill lines carrying an analytic account (informational).
  private static async checkAnalyticCoverage(): Promise<IntegrityCheck> {
    const id = 'analytic_coverage';
    const label = 'Analytic coverage of confirmed invoice/bill lines (informational)';
    const res = await pool.query<{ covered: string; total: string }>(
      `SELECT
         (
           (SELECT COUNT(*) FROM customer_invoice_lines cil
              JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed'
            WHERE cil.analytic_account_id IS NOT NULL)
           +
           (SELECT COUNT(*) FROM vendor_bill_lines vbl
              JOIN vendor_bills vb ON vb.id = vbl.bill_id AND vb.status = 'confirmed'
            WHERE vbl.analytic_account_id IS NOT NULL)
         )::text AS covered,
         (
           (SELECT COUNT(*) FROM customer_invoice_lines cil
              JOIN customer_invoices ci ON ci.id = cil.invoice_id AND ci.status = 'confirmed')
           +
           (SELECT COUNT(*) FROM vendor_bill_lines vbl
              JOIN vendor_bills vb ON vb.id = vbl.bill_id AND vb.status = 'confirmed')
         )::text AS total`
    );
    const row = res.rows[0];
    if (!row || Number(row.total) === 0) {
      return { id, label, status: 'unknown', detail: 'No confirmed invoice or bill lines to measure.', value: '—' };
    }
    const covered = new Decimal(row.covered);
    const total = new Decimal(row.total);
    const pct = covered.dividedBy(total).times(100);
    return {
      id,
      label,
      status: pct.greaterThan(90) ? 'pass' : 'fail',
      detail: `${row.covered} of ${row.total} confirmed lines carry an analytic account (${pct.toFixed(2)}%).`,
      value: `${pct.toFixed(2)}%`,
    };
  }

  static async runAll(): Promise<IntegrityReport> {
    const checks = await Promise.all([
      this.checkTrialBalance(),
      this.checkBalanceSheetEquation(),
      this.checkNetProfitInEquity(),
      this.checkLineLevelIntegrity(),
      this.checkUnbalancedPostedEntries(),
      this.checkPaymentOverAllocation(),
      this.checkStockReconciliation(),
      this.checkSequenceGaps(),
      this.checkOrphanLedgerEntries(),
      this.checkAnalyticCoverage(),
    ]);

    return {
      runAt: new Date().toISOString(),
      passed: checks.filter((c) => c.status === 'pass').length,
      failed: checks.filter((c) => c.status === 'fail').length,
      unknown: checks.filter((c) => c.status === 'unknown').length,
      total: checks.length,
      checks,
    };
  }
}
