import React, { type ReactNode } from 'react';
import { StatusBadge, StatusType } from '../StatusBadge';
import { AlertCircle } from 'lucide-react';

/* ── Button style helpers ─────────────────────────────────────── */
export const btnBase: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'all 120ms ease-out',
  border: 'none',
  outline: 'none',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: 'var(--brown-900)',
  color: 'var(--cream)',
};

export const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: 'var(--surface)',
  color: 'var(--brown-900)',
  border: '1px solid var(--brown-300)',
};

export const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--brown-700)',
};

export const btnDestructive: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--danger)',
};

/* ── Types ────────────────────────────────────────────────────── */
export interface FormViewProps {
  title?: string;
  subtitle?: string;
  isNew?: boolean;
  status?: StatusType | string;
  isArchived?: boolean;
  /** Called on New button */
  onNew?: () => void;
  /** Called on Confirm button — disabled when confirmDisabled=true */
  onConfirm?: () => void;
  onSave?: () => void;
  /** Whether the Confirm button should be disabled (use with BlockingWarning) */
  confirmDisabled?: boolean;
  onArchive?: () => void;
  onArchiveToggle?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
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
 * Smart buttons appear in the record header area.
 */
export function FormView({
  title,
  subtitle,
  isNew = false,
  status,
  isArchived = false,
  onNew,
  onConfirm,
  onSave,
  confirmDisabled = false,
  onArchive,
  onArchiveToggle,
  onHome,
  onBack,
  loading = false,
  error,
  extraButtons,
  smartButtons,
  children,
}: FormViewProps) {
  const handleConfirm = onConfirm || onSave;
  const handleArchive = onArchive || onArchiveToggle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      {/* ── Sticky button row ── */}
      <div
        style={{
          position: 'sticky',
          top: 56, // height of AppShell nav
          zIndex: 40,
          background: 'var(--surface)',
          borderBottom: '1px solid rgba(208,174,146,0.4)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onNew && (
            <button type="button" style={btnSecondary} onClick={onNew}>
              New
            </button>
          )}
          {handleConfirm && (
            <button
              type="button"
              style={{
                ...btnPrimary,
                opacity: confirmDisabled || loading ? 0.45 : 1,
                cursor: confirmDisabled || loading ? 'not-allowed' : 'pointer',
              }}
              onClick={confirmDisabled || loading ? undefined : handleConfirm}
              disabled={confirmDisabled || loading}
              aria-disabled={confirmDisabled || loading}
            >
              {loading ? 'Saving…' : 'Confirm'}
            </button>
          )}
          {handleArchive && !isNew && (
            <button type="button" style={btnSecondary} onClick={handleArchive}>
              {isArchived ? 'Unarchive' : 'Archived'}
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

        {/* Right header summary status badge if present */}
        {(status || isArchived) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {status && <StatusBadge status={status as any} />}
            {isArchived && <StatusBadge status="archived" />}
          </div>
        )}
      </div>

      {/* ── Form body ── */}
      <div
        style={{
          background: 'var(--surface)',
          maxWidth: 960,
          width: '100%',
          margin: '24px auto',
          padding: '28px 36px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
        }}
      >
        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderLeftWidth: 4,
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Record header */}
        {(title || subtitle || smartButtons) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(208, 174, 146, 0.3)',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              {title && (
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: '28px',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--brown-700)',
                    marginTop: 4,
                    margin: 0,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>

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

export default FormView;
