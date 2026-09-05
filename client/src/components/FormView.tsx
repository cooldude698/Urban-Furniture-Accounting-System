import React from 'react';
import { ArrowLeft, Save, Archive, RefreshCw, Home } from 'lucide-react';
import { StatusBadge, StatusType } from './StatusBadge';

interface FormViewProps {
  title: string;
  subtitle?: string;
  isNew?: boolean;
  status?: StatusType;
  isArchived?: boolean;
  onSave: () => void;
  onNew?: () => void;
  onArchiveToggle?: () => void;
  onBack: () => void;
  onHome?: () => void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  extraButtons?: React.ReactNode;
}

export const FormView: React.FC<FormViewProps> = ({
  title,
  subtitle,
  isNew = false,
  status,
  isArchived = false,
  onSave,
  onNew,
  onArchiveToggle,
  onBack,
  onHome,
  loading = false,
  error,
  children,
  extraButtons,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* Sticky Action Header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-brown-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brown-600 hover:text-brown-900 bg-brown-50 hover:bg-brown-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brown-600 hover:text-brown-900 hover:bg-brown-50 p-1.5 rounded-lg transition-colors"
                title="Home"
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            <div className="h-4 w-px bg-brown-200 mx-1" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-heading text-brown-900">{title}</h1>
                {status && <StatusBadge status={status} />}
                {isArchived && <StatusBadge status="archived" />}
              </div>
              {subtitle && <p className="text-xs text-brown-500">{subtitle}</p>}
            </div>
          </div>

          {/* Standard Form Actions: New | Save/Confirm | Archived | Extra Buttons */}
          <div className="flex items-center gap-2">
            {extraButtons}

            {onNew && !isNew && (
              <button
                type="button"
                onClick={onNew}
                className="text-sm font-medium text-brown-700 bg-brown-100 hover:bg-brown-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                New
              </button>
            )}

            {!isNew && onArchiveToggle && (
              <button
                type="button"
                onClick={onArchiveToggle}
                className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  isArchived
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-brown-300 text-brown-700 bg-surface hover:bg-brown-50'
                }`}
              >
                <Archive className="w-4 h-4" />
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>
            )}

            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-brown-700 hover:bg-brown-800 disabled:opacity-50 text-cream px-4 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content Body */}
      <div className="max-w-7xl mx-auto w-full p-6 flex-1">
        {error && (
          <div className="mb-6 bg-danger-bg border-l-4 border-danger p-4 rounded-r-lg text-danger text-sm">
            {error}
          </div>
        )}
        <div className="bg-surface rounded-xl border border-brown-200 shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
