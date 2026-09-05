import React from 'react';

interface SmartButtonProps {
  count?: string | number;
  label: string;
  icon?: string;
  onClick?: () => void;
  visible?: boolean;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  count,
  label,
  icon,
  onClick,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-col items-center justify-center bg-surface border border-brown-300 rounded-[8px] px-3.5 py-1.5 min-w-[70px] hover:bg-brown-100/50 hover:border-brown-700 transition-all shadow-sm active:scale-[0.98]"
    >
      <div className="flex items-center space-x-1">
        {icon && <span className="text-xs">{icon}</span>}
        {count !== undefined && (
          <span className="font-display font-bold text-sm text-brown-900 leading-none">
            {count}
          </span>
        )}
      </div>
      <span className="text-[10px] font-semibold tracking-wide uppercase text-brown-700 mt-0.5">
        {label}
      </span>
    </button>
  );
};
