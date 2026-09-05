import React from 'react';

interface WarningProps {
  message: string;
  onDismiss?: () => void;
}

export const BlockingWarning: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="border-l-4 border-danger bg-danger-bg p-4 rounded-r-md my-4 flex items-start space-x-3 shadow-sm">
      <span className="text-danger font-bold text-lg leading-none">⛔</span>
      <div className="text-sm text-danger font-medium">{message}</div>
    </div>
  );
};

export const NonBlockingWarning: React.FC<WarningProps> = ({ message, onDismiss }) => {
  return (
    <div className="border border-dashed border-warning bg-warning-bg p-4 rounded-md my-4 flex items-start justify-between shadow-sm">
      <div className="flex items-start space-x-3">
        <span className="text-warning text-lg leading-none">⚠️</span>
        <div className="text-sm text-brown-900 leading-relaxed">{message}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-brown-700 hover:text-brown-900 text-xs font-semibold px-2 py-1 rounded hover:bg-brown-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
