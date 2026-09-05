interface BlockingWarningProps {
  message: string;
}

/**
 * BLOCKING severity warning — solid 4px --danger left bar, --danger-bg fill.
 *
 * While this component is rendered, the consumer MUST disable its primary
 * action button. This component does NOT do that itself — the consumer
 * controls it. Pattern:
 *
 *   const [hasError, setHasError] = useState(false);
 *   <BlockingWarning message="..." />  ← shown when hasError
 *   <button disabled={hasError}>Confirm</button>
 *
 * Visually distinct from NonBlockingWarning:
 *   - Solid danger bar (not dashed)
 *   - Danger red bg (not amber)
 *   - No dismiss button (cannot be dismissed — must be fixed)
 */
export default function BlockingWarning({ message }: BlockingWarningProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderLeft: '4px solid var(--danger)',
        background: 'var(--danger-bg)',
        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
        padding: '12px 16px',
        margin: '8px 0',
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{ fontSize: 18, color: 'var(--danger)', flexShrink: 0, marginTop: 1 }}
      >
        🚫
      </span>
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--danger)',
            marginBottom: 2,
          }}
        >
          Cannot proceed
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--brown-900)',
            lineHeight: '20px',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
