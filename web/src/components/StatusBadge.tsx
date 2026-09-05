import React from 'react';

export type StatusType = 'draft' | 'posted' | 'confirmed' | 'paid' | 'partial' | 'not_paid' | 'cancelled' | 'revised';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || 'draft').toLowerCase().replace(' ', '_');

  let bgClass = 'bg-brown-100 text-brown-700';
  let label = status.toUpperCase();

  switch (norm) {
    case 'posted':
    case 'confirmed':
    case 'paid':
      bgClass = 'bg-[#EDF1E8] text-[#5F7052] border border-[#5F7052]/20';
      break;
    case 'partial':
      bgClass = 'bg-[#FBF1DF] text-[#C08A3E] border border-[#C08A3E]/30';
      break;
    case 'cancelled':
    case 'overdue':
      bgClass = 'bg-[#F8EAE6] text-[#9E4A38] border border-[#9E4A38]/30';
      break;
    case 'draft':
    case 'not_paid':
      bgClass = 'bg-[#EBD7BE] text-[#77574A]';
      break;
    case 'revised':
      bgClass = 'bg-surface text-brown-500 border border-brown-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider ${bgClass}`}>
      {label}
    </span>
  );
};
