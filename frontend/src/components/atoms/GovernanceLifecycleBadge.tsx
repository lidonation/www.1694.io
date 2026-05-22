import React from 'react';
import { LifecycleStatus } from '@/lib/governanceThresholds';

const CONFIG: Record<LifecycleStatus, { label: string; cls: string }> = {
  active:   { label: 'Active',   cls: 'bg-success text-zinc-800' },
  ratified: { label: 'Ratified', cls: 'bg-complementary-300 text-white' },
  enacted:  { label: 'Enacted',  cls: 'bg-primary-300 text-white' },
  expired:  { label: 'Expired',  cls: 'bg-extra_red text-white' },
  dropped:  { label: 'Dropped',  cls: 'bg-gray-800 text-white' },
};

interface GovernanceLifecycleBadgeProps {
  status: LifecycleStatus;
  minimal?: boolean;
}

const GovernanceLifecycleBadge = ({ status, minimal = false }: GovernanceLifecycleBadgeProps) => {
  const { label, cls } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${cls} ${
        minimal ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[11px]'
      }`}
    >
      {label}
    </span>
  );
};

export default GovernanceLifecycleBadge;
