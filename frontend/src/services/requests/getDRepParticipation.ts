import axiosInstance from '../axiosInstance';

export const getDRepParticipation = async (voterId: string) => {
  try {
    const { data } = await axiosInstance.get(`/dreps/${voterId}/governance-participation`);
    return data;
  } catch (error) {
    console.error('Error fetching DRep participation:', error);
    throw error;
  }
};
