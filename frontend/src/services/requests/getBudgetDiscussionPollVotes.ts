import { urls } from '@/constants';
import axiosInstance from '../axiosInstance';

export const getBudgetDiscussionPollVotes = async (
  pollID: string,
  vote: boolean,
) => {
  const { data } = await axiosInstance.get(
    `${urls.pdfApiUrl}/bd-poll-votes?fields[0]=drep_id&fields[1]=createdAt&filters[$and][0][vote_result][$eq]=${vote}&filters[$and][1][bd_poll_id][$eq]=${pollID}&pagination[page]=1&pagination[pageSize]=1000`,
  );

  return data?.data || [];
};
