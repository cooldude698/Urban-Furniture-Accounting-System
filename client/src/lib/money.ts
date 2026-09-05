import Decimal from 'decimal.js';

/**
 * Format a decimal string as Indian Rupees.
 * Uses hand-rolled grouping — Intl.NumberFormat('en-IN') silently falls back
 * to Western grouping inside Docker's small-icu Node build.
 *
 * Input must always be a string, e.g. "200000.50"
 * Output: "₹2,00,000.50"
 */
export function formatINR(value: string): string {
  const d = new Decimal(value);
  const neg = d.isNegative();
  const [int, dec] = d.abs().toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
    : last3;
  return `${neg ? '-' : ''}₹${grouped}.${dec}`;
}

/** Parse a string to Decimal safely. Never call parseFloat. */
export function toDecimal(value: string): Decimal {
  return new Decimal(value);
}
