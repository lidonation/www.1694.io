import { TableContainer } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { MetricCard } from './DRepMetricCard';
import { useGetMetricsQuery } from '@/hooks/useGetMetricsQuery';

const DRepsMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalRegisteredDReps: 0,
    totalActiveDReps: 0,
    totalGovernanceActions: 0,
    totalVotingPower: 0,
    totalRegisteredStakeAddresses: 0,
  });
  const { metrics: fetchedMetrics, isMetricsLoading } = useGetMetricsQuery();
  useEffect(() => {
    if (!isMetricsLoading && fetchedMetrics) {
      setMetrics(fetchedMetrics);
    }
  }, [isMetricsLoading, fetchedMetrics]);

  return (
    <TableContainer className="drep_metrics">
      <table className="w-fit">
        <tbody>
          <tr className="flex">
            <MetricCard
              value={metrics.totalRegisteredDReps}
              label="Total Registered DReps"
              isLoading={isMetricsLoading}
            />
            <MetricCard
              value={metrics.totalActiveDReps}
              label="Total Active DReps"
              isLoading={isMetricsLoading}
            />
            <MetricCard
              value={metrics.totalGovernanceActions}
              label="Total Governance Actions"
              isLoading={isMetricsLoading}
            />
          </tr>
          <tr className="flex">
            <MetricCard
              value={metrics.totalVotingPower}
              label="Total Voting Power in ₳"
              isLoading={isMetricsLoading}
            />
            <MetricCard
              value={metrics.totalRegisteredStakeAddresses}
              label="Total Registered Stake Addresses"
              isLoading={isMetricsLoading}
            />
          </tr>
        </tbody>
      </table>
    </TableContainer>
  );
};

export default DRepsMetrics;
