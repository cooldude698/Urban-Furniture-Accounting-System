import { Decimal } from 'decimal.js';

// Configure Decimal for financial precision (14, 2)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toMoney(val: string | number | Decimal): Decimal {
  return new Decimal(val || 0);
}

export function formatMoney(val: string | number | Decimal): string {
  return new Decimal(val || 0).toFixed(2);
}

export function multiplyMoney(a: string | number | Decimal, b: string | number | Decimal): string {
  return new Decimal(a || 0).times(new Decimal(b || 0)).toFixed(2);
}

export function addMoney(a: string | number | Decimal, b: string | number | Decimal): string {
  return new Decimal(a || 0).plus(new Decimal(b || 0)).toFixed(2);
}

export function calculateLineTax(
  qty: string | number,
  unitPrice: string | number,
  taxRatePercent: string | number
): { subtotal: string; taxAmount: string; total: string } {
  const quantity = new Decimal(qty || 0);
  const price = new Decimal(unitPrice || 0);
  const rate = new Decimal(taxRatePercent || 0).dividedBy(100);

  const subtotalDec = quantity.times(price);
  const taxDec = subtotalDec.times(rate);
  const totalDec = subtotalDec.plus(taxDec);

  return {
    subtotal: subtotalDec.toFixed(2),
    taxAmount: taxDec.toFixed(2),
    total: totalDec.toFixed(2),
  };
}
