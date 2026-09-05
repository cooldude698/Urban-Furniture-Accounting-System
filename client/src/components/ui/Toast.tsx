import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ',
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    bg: 'var(--posted-bg)',
    border: 'var(--posted)',
    text: 'var(--posted)',
    iconColor: 'var(--posted)',
  },
  error: {
    bg: 'var(--danger-bg)',
    border: 'var(--danger)',
    text: 'var(--danger)',
    iconColor: 'var(--danger)',
  },
  warning: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning)',
    text: '#8B5E14',
    iconColor: 'var(--warning)',
  },
  info: {
    bg: '#F5EFE6',
    border: 'var(--brown-700)',
    text: 'var(--brown-900)',
    iconColor: 'var(--brown-700)',
  },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts(prev => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss],
  );

  const success = useCallback((msg: string, title?: string) => showToast('success', msg, title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast('error', msg, title, 5000), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast('warning', msg, title, 5000), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast('info', msg, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}

      {/* Floating toast notification container */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 400,
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className="animate-toast-in"
              style={{
                pointerEvents: 'auto',
                backgroundColor: style.bg,
                borderLeft: `4px solid ${style.border}`,
                borderTop: '1px solid rgba(74, 58, 52, 0.08)',
                borderRight: '1px solid rgba(74, 58, 52, 0.08)',
                borderBottom: '1px solid rgba(74, 58, 52, 0.08)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                fontFamily: 'var(--font-body)',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: style.iconColor,
                  lineHeight: '20px',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {TOAST_ICONS[toast.type]}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 13,
                      color: style.text,
                      marginBottom: 2,
                    }}
                  >
                    {toast.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: '18px',
                    color: 'var(--brown-900)',
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Close notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brown-600)',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 4,
                  marginLeft: 4,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};
