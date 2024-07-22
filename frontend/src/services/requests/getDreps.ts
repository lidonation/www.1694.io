import axiosInstance from '../axiosInstance';

export const getDReps = async (s?: string, page?: number) => {
  const response = await axiosInstance.get(`/api/dreps`, {
    params: { s, page },
  });

  return response.data;
};
