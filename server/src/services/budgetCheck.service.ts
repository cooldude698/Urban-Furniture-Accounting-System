import { localDB } from '../db/db.js';
import { Decimal } from 'decimal.js';

export interface BudgetCheckResult {
  hasWarning: boolean;
  warningMessage?: string;
  overrunAnalyticIds?: number[];
}

export class BudgetCheckService {
  /**
   * Checks if any line item with an analytic account exceeds the remaining budget.
   * Default sample approved budget per analytic account is 50,000.00 if unconfigured.
   */
  static checkBudgetOverrun(lines: { analytic_account_id?: number | null; total?: string }[]): BudgetCheckResult {
    const overrunIds: number[] = [];
    const analyticLimits: Record<number, Decimal> = {
      1: new Decimal('50000.00'), // Showroom Operations
      2: new Decimal('100000.00'), // Online Sales Marketing
      3: new Decimal('40000.00'), // Warehouse & Logistics
      4: new Decimal('150000.00'), // Custom Interior Projects
    };

    // Calculate current commitments in this transaction per analytic account
    const requestedByAnalytic: Record<number, Decimal> = {};
    for (const line of lines) {
      if (line.analytic_account_id) {
        const lineTotal = new Decimal(line.total || '0');
        requestedByAnalytic[line.analytic_account_id] = (
          requestedByAnalytic[line.analytic_account_id] || new Decimal('0')
        ).plus(lineTotal);
      }
    }

    for (const [idStr, requested] of Object.entries(requestedByAnalytic)) {
      const id = parseInt(idStr, 10);
      const limit = analyticLimits[id] || new Decimal('50000.00');

      if (requested.greaterThan(limit)) {
        overrunIds.push(id);
      }
    }

    if (overrunIds.length > 0) {
      return {
        hasWarning: true,
        warningMessage:
          '⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining budget amount for this budget line. Consider adjusting the value or revise the budget.',
        overrunAnalyticIds: overrunIds,
      };
    }

    return { hasWarning: false };
  }
}
