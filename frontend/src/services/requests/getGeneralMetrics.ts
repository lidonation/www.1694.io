import axiosInstance from '../axiosInstance';

export const getMetrics = async () => {
  const response = await axiosInstance.get('misc/metrics');
  return response.data;
};
