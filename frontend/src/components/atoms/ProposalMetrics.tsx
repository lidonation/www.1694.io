import React, { useEffect, useState } from 'react';
import { MetricsCard } from './ProposalMetricsCard';
import { useGetProposalMetricsQuery } from '@/hooks/useGetProposalMetricsQuery';

const ProposalMetrics = () => {
  const [metrics, setMetrics] = useState({
    total_proposals: 0,
    total_ada: '0',
    mean_usd_to_ada_conversionrate: '0',
    median_usd_to_ada_conversionrate: '0',
    mode_usd_to_ada_conversionrate: '0',
  });

  const { proposalMetrics: fetchedMetrics, isProposalMetricsLoading } = useGetProposalMetricsQuery();

  useEffect(() => {
    if (!isProposalMetricsLoading && fetchedMetrics) {
      setMetrics({
        total_proposals: fetchedMetrics.totalProposals,
        total_ada: fetchedMetrics.totalAda,
        mean_usd_to_ada_conversionrate: fetchedMetrics.meanUsdToAdaConversionRate,
        median_usd_to_ada_conversionrate: fetchedMetrics.medianUsdToAdaConversionRate,
        mode_usd_to_ada_conversionrate: fetchedMetrics.modeUsdToAdaConversionRate,
      });
    }
  }, [isProposalMetricsLoading, fetchedMetrics]);
 
  

  return (
    <div className="proposal_metrics w-full mb-3 divide-y divide-gray-200">
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        <div className="p-2">
          <MetricsCard
            value={metrics.total_proposals}
            label="Total Proposals"
            isLoading={isProposalMetricsLoading}
          />
        </div>
        <div className="p-2">
          <MetricsCard
            value={parseFloat(metrics.total_ada)}
            label="Total Ada Requested in ₳"
            isMillion
            isLoading={isProposalMetricsLoading}
          />
        </div>
        <div className="p-2">
          <MetricsCard
            value={parseFloat(metrics.mean_usd_to_ada_conversionrate)}
            label="Conversion Rate"
            isLoading={isProposalMetricsLoading}
          />
        </div>

      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        <div className="p-2">
          <MetricsCard
            value={parseFloat(metrics.mean_usd_to_ada_conversionrate)}
            label="Mean USD/₳ Rate"
            isLoading={isProposalMetricsLoading}
          />
        </div>
        <div className="p-2">
          <MetricsCard
            value={parseFloat(metrics.median_usd_to_ada_conversionrate)}
            label="Median USD/₳ Rate"
            isLoading={isProposalMetricsLoading}
          />
        </div>
        <div className="p-2">
          <MetricsCard
            value={parseFloat(metrics.mode_usd_to_ada_conversionrate)}
            label="Mode USD/₳ Rate"
            isLoading={isProposalMetricsLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
