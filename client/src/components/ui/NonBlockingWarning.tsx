import { useState } from 'react';

const DEFAULT_MESSAGE =
  '⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining ' +
  'budget amount for this budget line. Consider adjusting the value or revise the budget.';

interface NonBlockingWarningProps {
  message?: string;
  onDismiss?: () => void;
}

/**
 * NON-BLOCKING severity warning — dashed --warning border, --warning-bg fill, dismissible.
 * The primary action button STAYS ENABLED when this is shown.
 *
 * Visually distinct from BlockingWarning:
 *   - Dashed amber border all around (not a solid red left-bar)
 *   - Amber bg (not red)
 *   - Has a dismiss (×) button
 *
 * Default message is the exact budget-overrun copy from the spec/mockup.
 */
export default function NonBlockingWarning({
  message = DEFAULT_MESSAGE,
  onDismiss,
}: NonBlockingWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        border: '1px dashed var(--warning)',
        background: 'var(--warning-bg)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        margin: '8px 0',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--brown-900)',
          lineHeight: '20px',
          flex: 1,
        }}
      >
        {message}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss warning"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--warning)',
          fontSize: 18,
          lineHeight: 1,
          padding: '0 0 0 8px',
          flexShrink: 0,
          fontFamily: 'var(--font-body)',
        }}
      >
        ×
      </button>
    </div>
  );
}
