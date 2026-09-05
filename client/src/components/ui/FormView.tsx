import { type ReactNode } from 'react';

/* ── Button style helpers ─────────────────────────────────────── */
const btnBase: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: 13,
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'background 150ms ease-out, color 150ms ease-out',
  border: 'none',
  outline: 'none',
  whiteSpace: 'nowrap',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: 'var(--brown-900)',
  color: 'var(--cream)',
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: 'var(--surface)',
  color: 'var(--brown-900)',
  border: '1px solid var(--brown-300)',
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--brown-700)',
};

const btnDestructive: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--danger)',
};

/* ── Types ────────────────────────────────────────────────────── */
interface FormViewProps {
  title?: string;
  /** Called on New button */
  onNew?: () => void;
  /** Called on Confirm button — disabled when confirmDisabled=true */
  onConfirm?: () => void;
  /** Whether the Confirm button should be disabled (use with BlockingWarning) */
  confirmDisabled?: boolean;
  onArchive?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  /** Extra action buttons (e.g. Create Bill, Pay, Register Payment) */
  extraButtons?: ReactNode;
  /** Smart buttons for the record header (PO count, Invoice count, etc.) */
  smartButtons?: ReactNode;
  children: ReactNode;
}

/**
 * FormView — wraps every document form.
 *
 * Sticky button row at the top:
 *   New (secondary) · Confirm (primary) · Archived (secondary) · Home (ghost) · Back (ghost)
 *
 * Extra buttons are appended after the fixed set.
 * Smart buttons appear below the button row in the form header area.
 */
export default function FormView({
  title,
  onNew,
  onConfirm,
  confirmDisabled = false,
  onArchive,
  onHome,
  onBack,
  extraButtons,
  smartButtons,
  children,
}: FormViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Sticky button row ── */}
      <div
        style={{
          position: 'sticky',
          top: 56, // height of AppShell nav
          zIndex: 50,
          background: 'var(--surface)',
          borderBottom: '1px solid rgba(208,174,146,0.4)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {onNew && (
          <button type="button" style={btnSecondary} onClick={onNew}>
            New
          </button>
        )}
        {onConfirm && (
          <button
            type="button"
            style={{
              ...btnPrimary,
              opacity: confirmDisabled ? 0.45 : 1,
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
            }}
            onClick={confirmDisabled ? undefined : onConfirm}
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled}
          >
            Confirm
          </button>
        )}
        {onArchive && (
          <button type="button" style={btnSecondary} onClick={onArchive}>
            Archived
          </button>
        )}
        {onHome && (
          <button type="button" style={btnGhost} onClick={onHome}>
            Home
          </button>
        )}
        {onBack && (
          <button type="button" style={btnGhost} onClick={onBack}>
            ← Back
          </button>
        )}
        {extraButtons}
      </div>

      {/* ── Form body ── */}
      <div
        style={{
          background: 'var(--surface)',
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          padding: '24px 32px',
        }}
      >
        {/* Record header */}
        {(title || smartButtons) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 24,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {title && (
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 24,
                  color: 'var(--brown-900)',
                }}
              >
                {title}
              </h1>
            )}
            {smartButtons && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {smartButtons}
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/* ── Re-export button styles for consumers building extra buttons ── */
export { btnPrimary, btnSecondary, btnGhost, btnDestructive };
