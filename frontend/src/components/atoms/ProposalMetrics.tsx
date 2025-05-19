import React, { useEffect, useState } from 'react';
import { MetricsCard } from './ProposalMetricsCard';
import { useGetProposalMetricsQuery } from '@/hooks/useGetProposalMetricsQuery';

const ProposalMetrics = ({ search = '', categories = [], committees = [] }: { search?: string, categories?: string[], committees?: string[] }) => {
    const [metrics, setMetrics] = useState({
        totalProposals: 0,
        totalAda: null,
        meanUsdToAdaConversionRate: null,
        medianUsdToAdaConversionRate: null,
        modeUsdToAdaConversionRate: null,
        intersectNamedAdministrator: null,
    });

    const {proposalMetrics: fetchedMetrics, isProposalMetricsLoading} = useGetProposalMetricsQuery(search, categories, committees);

    useEffect(() => {
        if (!isProposalMetricsLoading && fetchedMetrics) {
            setMetrics({...fetchedMetrics});
        }
    }, [isProposalMetricsLoading, fetchedMetrics, search]);


    return (
        <div className="proposal_metrics w-auto mb-3 divide-y divide-gray-200">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="p-1">
                    <MetricsCard
                        value={metrics.totalProposals}
                        label="Total Proposals"
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
                <div className="p-1">
                    <MetricsCard
                        value={parseFloat(metrics.intersectNamedAdministrator)}
                        label="Intersect Named Administrator"
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
                <div className="p-1">
                    <MetricsCard
                        value={parseFloat(metrics.totalAda)}
                        label="Total Ada Requested in ₳"
                        isMillion
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="p-1">
                    <MetricsCard
                        value={parseFloat(metrics.meanUsdToAdaConversionRate)}
                        label="Mean USD/₳ Rate"
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
                <div className="p-1">
                    <MetricsCard
                        value={parseFloat(metrics.medianUsdToAdaConversionRate)}
                        label="Median USD/₳ Rate"
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
                <div className="p-1">
                    <MetricsCard
                        value={parseFloat(metrics.modeUsdToAdaConversionRate)}
                        label="Mode USD/₳ Rate"
                        isLoading={isProposalMetricsLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProposalMetrics;
