import React from 'react';

export type StatusType = 'draft' | 'posted' | 'confirmed' | 'paid' | 'partial' | 'not_paid' | 'cancelled' | 'revised' | 'active' | 'archived';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles: Record<StatusType, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-brown-100', text: 'text-brown-700', label: 'Draft' },
    posted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Posted' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
    partial: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Partial' },
    not_paid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Paid' },
    cancelled: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Cancelled' },
    revised: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Revised' },
    active: { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', text: 'text-emerald-700', label: 'Active' },
    archived: { bg: 'bg-gray-100 text-gray-500 border border-gray-300', text: 'text-gray-500', label: 'Archived' },
  };

  const current = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${current.bg} ${current.text} ${className}`}>
      {current.label}
    </span>
  );
};
