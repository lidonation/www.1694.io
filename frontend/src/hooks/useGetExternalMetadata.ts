import { useQuery } from 'react-query';
import { getExternalMetadataByUrl } from '@/services/requests/getExternalMetadataByUrl';

export const useGetExternalMetadata = (url: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['getExternalMetadata', url],
    queryFn: async () => {
      return getExternalMetadataByUrl(url);
    },
    enabled: !!url,
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
