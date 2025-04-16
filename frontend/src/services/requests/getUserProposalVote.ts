import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

export const getUserProposalVote = async (pollId: string, drepId: string) => {
  try {
    const { data } = await axiosInstance.get(
      `${urls.pdfApiUrl}/bd-poll-votes?filters[$and][0][bd_poll_id][$eq]=${pollId}&filters[$and][1][drep_id][$eq]=${drepId}&pagination[page]=1&pagination[pageSize]=1&sort[createdAt]=desc`,
    );
    return data;
  } catch (error) {
    console.error(error);
  }
};
