import {useQuery, UseQueryResult} from 'react-query';
import axiosInstance from "@/services/axiosInstance";

export interface CxProposalsMetrics {
    proposals: number;
    funded_proposals: number;
    completed_proposals: number;
    outstanding_proposals: number;
}

export const useUserParticipationQuery = (govToolUserName: string): UseQueryResult<CxProposalsMetrics> => {
    return useQuery<CxProposalsMetrics>({
        queryKey: ['userParticipation', govToolUserName],
        queryFn: async () => {
            if (!govToolUserName) return null;
            const res = await axiosInstance.get(`/metrics/catalyst-proposals/${govToolUserName}`);
            return {...res.data} as CxProposalsMetrics;
        },
        enabled: !!govToolUserName,
        refetchOnWindowFocus: false,
    });
};
