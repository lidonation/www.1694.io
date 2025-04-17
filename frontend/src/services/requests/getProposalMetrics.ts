import axiosInstance from '../axiosInstance';

export const getAllMetrics = async (search?: string) => {
  const response = await axiosInstance.get(`metrics?s=${encodeURIComponent(search)}`);  
  return response.data;
};