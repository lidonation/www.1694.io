import axiosInstance from '../axiosInstance';

export const getNotes = async () => {
  const response = await axiosInstance.get(`/api/notes/all`);
  return response.data;
};
