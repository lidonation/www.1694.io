import axiosInstance from '../axiosInstance';

export const postSubmitTx = async (transaction: string) => {
  const response = await axiosInstance.post(`/misc/submit-tx`, {
    tx: transaction,
  });
  return response.data as string;
};
