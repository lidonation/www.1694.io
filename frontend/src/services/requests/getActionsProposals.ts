import axiosInstance from '../axiosInstance'; 

export const getActionsProposals = async (page: number = 1, pageSize: number = 6) => {
  const response = await axiosInstance.get('/actions-proposals', {
    params: {
      page,
      pageSize,
    },
  });
  return response.data;
};
