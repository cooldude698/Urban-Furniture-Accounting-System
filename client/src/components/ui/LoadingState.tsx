import React from 'react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
  style?: React.CSSProperties;
}

/**
 * LoadingState — Accessible loading state with spinner and optional skeleton lines
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  rows = 0,
  style,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          border: '3px solid var(--brown-300)',
          borderTopColor: 'var(--brown-700)',
          borderRadius: '50%',
          animation: 'spin 800ms linear infinite',
          marginBottom: 14,
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--brown-700)',
        }}
      >
        {message}
      </span>

      {rows > 0 && (
        <div style={{ width: '100%', maxWidth: 600, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 20,
                width: `${85 - (i % 3) * 15}%`,
                backgroundColor: 'rgba(208, 174, 146, 0.25)',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default LoadingState;
