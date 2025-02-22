import axiosInstance from '../axiosInstance';

export const getExternalMetadataByUrl = async (url: string) => {
  const response = await axiosInstance.get(`/misc/metadata`, {
    params: {
      url,
    },
  });
  return response.data;
};
