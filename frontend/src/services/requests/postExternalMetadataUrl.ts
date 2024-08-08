import axiosInstance from '../axiosInstance';

export const getExternalMetadata = async ({
  metadataUrl,
}: {
  metadataUrl: string;
}) => {
  const response = await axiosInstance.get(`/api/dreps/metadata/external`, {
    params: {
      metadataUrl: metadataUrl,
    },
  });
  return response.data;
};
