import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepMetadata } from '@/services/requests/getDRepMetadata';

export const useGetDRepMetadataQuery = (voterId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.getDRepMetadataKey, voterId],
    queryFn: async () => await getDRepMetadata(voterId),
    enabled: !!voterId,
    refetchOnWindowFocus: false,
  });

  const customError = error 
    ? "Metadata Unprocessable. Probably took long to load or has invalid content." 
    : null;

  return { metadata: data, isMetadataLoading: isLoading, metadataError: customError };
};
