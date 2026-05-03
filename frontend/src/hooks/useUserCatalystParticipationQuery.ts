'use client';
import {useQuery, UseQueryResult} from 'react-query';
import axiosInstance from "@/services/axiosInstance";
import { CxProposalsMetrics } from '../../types/api';

export const useUserParticipationQuery = (govToolUserName: string): UseQueryResult<CxProposalsMetrics> => {
    return useQuery<CxProposalsMetrics>({
        queryKey: ['userParticipation', govToolUserName],
        queryFn: async () => {
            if (!govToolUserName) return null;
            const res = await axiosInstance.get(`/metrics/catalyst-proposals/${govToolUserName}`);
            return {...res.data} as CxProposalsMetrics;
        },
        enabled: typeof window !== "undefined" && (!!govToolUserName),
        refetchOnWindowFocus: false,
    });
};
