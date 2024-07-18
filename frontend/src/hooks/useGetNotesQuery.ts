import { getNotes } from '@/services/requests/getNotes';
import { useQuery } from 'react-query';

export const useGetNotesQuery = () => {
  const { data, isLoading, refetch } = useQuery({
    queryFn: async () => await getNotes(),
    //performs automatic refetching
    enabled: true,
  });

  return { Notes: data, isNotesLoading: isLoading, refetch };
};
