import React from 'react';
import Decimal from 'decimal.js';

interface MoneyProps {
  amount: string | number;
  className?: string;
  showCurrency?: boolean;
}

export const Money: React.FC<MoneyProps> = ({ amount, className = '', showCurrency = true }) => {
  let formatted = '0.00';
  try {
    const dec = new Decimal(amount || '0');
    // Format with Indian grouping (e.g. 1,00,000.00)
    const parts = dec.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    let isNegative = false;
    if (integerPart.startsWith('-')) {
      isNegative = true;
      integerPart = integerPart.substring(1);
    }

    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const grouped = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    formatted = (isNegative ? '-' : '') + grouped + '.' + decimalPart;
  } catch {
    formatted = '0.00';
  }

  return (
    <span className={`font-mono text-right tabular-nums ${className}`}>
      {showCurrency && '₹ '}{formatted}
    </span>
  );
};
