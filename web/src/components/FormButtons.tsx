import React from 'react';

interface FormButtonsProps {
  onNew?: () => void;
  onConfirm?: () => void;
  onCreateInvoice?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  canConfirm?: boolean;
  canCreateInvoice?: boolean;
  canCancel?: boolean;
  isConfirmed?: boolean;
  isLoading?: boolean;
}

export const FormButtons: React.FC<FormButtonsProps> = ({
  onNew,
  onConfirm,
  onCreateInvoice,
  onCancel,
  onBack,
  canConfirm = true,
  canCreateInvoice = false,
  canCancel = true,
  isConfirmed = false,
  isLoading = false,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-300/40 py-3 px-6 mb-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-sm font-medium text-brown-700 hover:text-brown-900 transition-colors"
          >
            ← Back
          </button>
        )}

        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="px-4 py-1.5 text-sm font-medium bg-surface text-brown-900 border border-brown-300 rounded-[6px] hover:bg-brown-100 transition-colors shadow-sm"
          >
            New
          </button>
        )}

        {onConfirm && !isConfirmed && (
          <button
            type="button"
            disabled={!canConfirm || isLoading}
            onClick={onConfirm}
            className={`px-4 py-1.5 text-sm font-semibold rounded-[6px] shadow-sm transition-all ${
              canConfirm && !isLoading
                ? 'bg-brown-900 text-cream hover:bg-brown-700 active:scale-[0.99]'
                : 'bg-brown-300 text-brown-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        )}

        {onCreateInvoice && isConfirmed && (
          <button
            type="button"
            disabled={!canCreateInvoice || isLoading}
            onClick={onCreateInvoice}
            className="px-4 py-1.5 text-sm font-semibold bg-brown-900 text-cream rounded-[6px] hover:bg-brown-700 transition-all shadow-sm active:scale-[0.99]"
          >
            Create Invoice
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            disabled={!canCancel}
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-bg rounded-[6px] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
