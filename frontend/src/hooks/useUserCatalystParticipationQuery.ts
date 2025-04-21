import { useQuery } from 'react-query';
import axios from 'axios';

export const useUserParticipationQuery = (govToolUserName: string) => {
  return useQuery<number | null>({
    queryKey: ['userParticipation', govToolUserName],
    queryFn: async () => {
      if (!govToolUserName) return null;
      const { data } = await axios.get(`/api/metrics/catalyst-proposals/${govToolUserName}`);
      return data?.proposals ?? null; 
    },
    enabled: !!govToolUserName,
    refetchOnWindowFocus: false,
  });
};
