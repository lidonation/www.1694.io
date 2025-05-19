import axiosInstance from '../axiosInstance';

export const getDRepGovActionsVotes = async (
  voterId: string,
  page?: number,
  perPage?: number,
) => {
  try {
    const response = await axiosInstance.get(
      `/dreps/${voterId}/gov-actions-votes`,
      { params: { page, perPage } },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
