import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  style?: React.CSSProperties;
}

/**
 * EmptyState — Consistent empty state display across views, tables, and reports
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'rgba(235, 215, 190, 0.15)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--brown-300)',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 36,
          color: 'var(--brown-600)',
          marginBottom: 12,
        }}
      >
        {icon || '📭'}
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 16,
          color: 'var(--brown-900)',
          margin: 0,
          marginBottom: description ? 6 : 0,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--brown-700)',
            maxWidth: 380,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: 16,
            backgroundColor: 'var(--brown-700)',
            color: 'var(--surface)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
