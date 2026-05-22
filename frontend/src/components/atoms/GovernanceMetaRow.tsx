import React from 'react';
import { Tooltip } from '@mui/material';
import { GovernanceThresholds, LifecycleStatus } from '@/lib/governanceThresholds';
import GovernanceLifecycleBadge from './GovernanceLifecycleBadge';

interface GovernanceMetaRowProps {
  status: LifecycleStatus;
  thresholds: GovernanceThresholds;
  expirationEpoch: number | null;
  govActionLifetime: number | null;
}

const GovernanceMetaRow = ({
  status,
  thresholds,
  expirationEpoch,
  govActionLifetime,
}: GovernanceMetaRowProps) => {
  const { dvt, pvt, dvtLabel, isInfoAction } = thresholds;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-gray-500">
      <GovernanceLifecycleBadge status={status} />

      {!isInfoAction && dvt !== null && (
        <Tooltip
          title={pvt !== null ? `DRep ≥${dvt}%  ·  SPO ≥${pvt}%` : `${dvtLabel ?? 'DRep'} ≥${dvt}%`}
          placement="top"
          arrow
        >
          <span className="cursor-default border-b border-dashed border-gray-300">
            <span className="font-semibold text-gray-600">{dvtLabel ?? 'DRep'}</span>
            {' ≥'}{dvt}%
            {pvt !== null && <span className="text-gray-400">  ·  SPO ≥{pvt}%</span>}
          </span>
        </Tooltip>
      )}

      {expirationEpoch !== null && (
        <Tooltip
          title={govActionLifetime ? `Ratification window: ${govActionLifetime} epochs` : ''}
          placement="top"
          arrow
        >
          <span className="cursor-default border-b border-dashed border-gray-300">
            Epoch <span className="font-semibold text-gray-700">{expirationEpoch}</span>
          </span>
        </Tooltip>
      )}
    </div>
  );
};

export default GovernanceMetaRow;
