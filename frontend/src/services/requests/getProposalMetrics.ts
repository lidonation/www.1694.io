import axiosInstance from '../axiosInstance';

export const getAllMetrics = async () => {
  const response = await axiosInstance.get('metrics');
  return response.data;
};
