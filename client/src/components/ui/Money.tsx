import { formatINR } from '../../lib/money';

interface MoneyProps {
  /** Always a string — never pass a JS number. e.g. "200000.50" */
  value: string;
  className?: string;
}

/**
 * Renders a monetary value with Indian grouping (₹2,00,000.50).
 * Mono font, right-aligned, tabular-nums — always.
 */
export default function Money({ value, className = '' }: MoneyProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-mono)',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {formatINR(value)}
    </span>
  );
}
