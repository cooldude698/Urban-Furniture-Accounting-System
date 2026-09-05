type Status =
  | 'draft'
  | 'posted'
  | 'confirmed'
  | 'paid'
  | 'partial'
  | 'not_paid'
  | 'cancelled'
  | 'revised';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_MAP: Record<
  Status,
  { label: string; color: string; bg: string; border?: string }
> = {
  draft:      { label: 'Draft',     color: 'var(--brown-700)', bg: 'var(--brown-100)' },
  not_paid:   { label: 'Not Paid',  color: 'var(--brown-700)', bg: 'var(--brown-100)' },
  posted:     { label: 'Posted',    color: 'var(--posted)',     bg: 'var(--posted-bg)' },
  confirmed:  { label: 'Confirmed', color: 'var(--posted)',     bg: 'var(--posted-bg)' },
  paid:       { label: 'Paid',      color: 'var(--posted)',     bg: 'var(--posted-bg)' },
  partial:    { label: 'Partial',   color: 'var(--warning)',    bg: 'var(--warning-bg)' },
  cancelled:  { label: 'Cancelled', color: 'var(--danger)',     bg: 'var(--danger-bg)' },
  revised:    { label: 'Revised',   color: 'var(--brown-700)',  bg: 'var(--surface)', border: '1px solid var(--brown-300)' },
};

/**
 * Pill badge for document/entry status.
 * Always shows a text label — never colour alone.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color, bg, border } = STATUS_MAP[status] ?? STATUS_MAP.draft;

  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        lineHeight: '16px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        background: bg,
        border: border ?? 'none',
        borderRadius: 999,
        padding: '2px 8px',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
