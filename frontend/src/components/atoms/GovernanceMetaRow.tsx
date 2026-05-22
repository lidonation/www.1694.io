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

const Divider = () => <span className="text-gray-200 select-none">|</span>;

const GovernanceMetaRow = ({
  status,
  thresholds,
  expirationEpoch,
  govActionLifetime,
}: GovernanceMetaRowProps) => {
  const { dvt, pvt, dvtLabel, isInfoAction } = thresholds;

  const thresholdNode = isInfoAction ? (
    <span className="text-[10px] text-gray-400 italic">No threshold (Info Action)</span>
  ) : dvt !== null ? (
    <Tooltip
      title={
        pvt !== null
          ? `DRep: ≥${dvt}%  ·  SPO: ≥${pvt}%`
          : dvtLabel ?? `DRep: ≥${dvt}%`
      }
      placement="top"
      arrow
    >
      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 cursor-default">
        <span className="font-semibold text-gray-700">{dvtLabel ?? 'DRep'}</span>
        <span>≥{dvt}%</span>
        {pvt !== null && (
          <>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-gray-700">SPO</span>
            <span>≥{pvt}%</span>
          </>
        )}
      </span>
    </Tooltip>
  ) : (
    <span className="text-[10px] text-gray-400">—</span>
  );

  const epochNode = expirationEpoch !== null ? (
    <Tooltip
      title={govActionLifetime ? `Ratification window: ${govActionLifetime} epochs` : ''}
      placement="top"
      arrow
    >
      <span className="text-[10px] text-gray-500 cursor-default">
        Expires <span className="font-semibold text-gray-700">Epoch {expirationEpoch}</span>
      </span>
    </Tooltip>
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <GovernanceLifecycleBadge status={status} />
      {(dvt !== null || isInfoAction) && (
        <>
          <Divider />
          {thresholdNode}
        </>
      )}
      {epochNode && (
        <>
          <Divider />
          {epochNode}
        </>
      )}
    </div>
  );
};

export default GovernanceMetaRow;
