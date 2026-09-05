interface SmartButtonProps {
  count: number;
  label: string;
  /** When false, renders NOTHING — not disabled, not hidden. Just null. */
  visible: boolean;
  onClick: () => void;
}

/**
 * Record-header smart button.
 * Shows a count in display font on top, small label beneath.
 * Renders null entirely when visible=false — no disabled state, no hidden shell.
 *
 * Usage:
 *   <SmartButton count={3} label="Invoices" visible={!!bill.invoiceCount} onClick={...} />
 */
export default function SmartButton({ count, label, visible, onClick }: SmartButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minWidth: 72,
        padding: '8px 12px',
        border: '1px solid var(--brown-300)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface)',
        cursor: 'pointer',
        transition: 'background 150ms ease-out, border-color 150ms ease-out',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--brown-100)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brown-500)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brown-300)';
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          lineHeight: '24px',
          color: 'var(--brown-900)',
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '14px',
          color: 'var(--brown-700)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
    </button>
  );
}
