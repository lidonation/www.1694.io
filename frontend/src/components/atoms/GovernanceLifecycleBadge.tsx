import React from 'react';
import { LifecycleStatus } from '@/lib/governanceThresholds';

const CONFIG: Record<LifecycleStatus, { label: string; dot: string; bg: string; text: string }> = {
  enacted:  { label: 'Enacted',  dot: 'bg-teal-500',  bg: 'bg-teal-50',  text: 'text-teal-700' },
  ratified: { label: 'Ratified', dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  active:   { label: 'Active',   dot: 'bg-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-700' },
  expired:  { label: 'Expired',  dot: 'bg-red-400',   bg: 'bg-red-50',   text: 'text-red-700' },
  dropped:  { label: 'Dropped',  dot: 'bg-gray-400',  bg: 'bg-gray-100', text: 'text-gray-600' },
};

interface GovernanceLifecycleBadgeProps {
  status: LifecycleStatus;
  minimal?: boolean;
}

const GovernanceLifecycleBadge = ({ status, minimal = false }: GovernanceLifecycleBadgeProps) => {
  const { label, dot, bg, text } = CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${bg} ${text} font-medium ${
        minimal ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      <span className={`${dot} ${minimal ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full`} />
      {label}
    </span>
  );
};

export default GovernanceLifecycleBadge;
