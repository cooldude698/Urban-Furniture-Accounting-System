import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface NonBlockingWarningProps {
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export const NonBlockingWarning: React.FC<NonBlockingWarningProps> = ({
  message = '⚠️ Exceeds Approved Budget — The entered amount is higher than the remaining budget amount for this budget line. Consider adjusting the value or revise the budget.',
  onDismiss,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`flex items-start justify-between gap-3 p-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/90 text-amber-900 text-sm shadow-sm transition-all ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-0.5">
            Non-Blocking Budget Warning
          </div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-100/60 rounded-md transition-colors"
        title="Dismiss warning"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
