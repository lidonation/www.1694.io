import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepMetadata } from '@/services/requests/getDRepMetadata';
import { convertDrepPhraseToCIP105 } from '@/lib';

export const useGetDRepMetadataQuery = (voterId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.getDRepMetadataKey, voterId],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(voterId);
      return await getDRepMetadata(cip105Id);
    },
    enabled: !!voterId,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const customError = error
    ? 'Metadata Unprocessable. Probably took long to load or has invalid content.'
    : null;

  return {
    metadata: data,
    isMetadataLoading: isLoading,
    metadataError: customError,
  };
};
