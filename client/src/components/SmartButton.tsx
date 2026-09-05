import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SmartButtonProps {
  label: string;
  count?: number | string;
  icon?: LucideIcon;
  visible?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  label,
  count,
  icon: Icon,
  visible = true,
  onClick,
  className = '',
}) => {
  // CRITICAL REQUIREMENT: If visible is false, render NOTHING (no disabled state)
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-1.5 bg-surface hover:bg-brown-50 border border-brown-300 rounded-lg shadow-xs transition-all text-left group ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 text-brown-600 group-hover:text-brown-900" />}
      <div className="flex flex-col">
        {count !== undefined && (
          <span className="font-heading font-bold text-xs text-brown-900 leading-tight">
            {count}
          </span>
        )}
        <span className="text-[11px] font-medium text-brown-600 group-hover:text-brown-900 uppercase tracking-tight">
          {label}
        </span>
      </div>
    </button>
  );
};
