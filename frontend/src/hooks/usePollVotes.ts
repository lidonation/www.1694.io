import { QUERY_KEYS } from '@/constants/queryKeys';
import { getBudgetDiscussionPollVotes } from '@/services/requests/getBudgetDiscussionPollVotes';
import { getDRepVotingPowerList } from '@/services/requests/getDRepVotingPowerList';
import { useQuery } from 'react-query';

/**
 * Custom hook to fetch poll votes and drep voting power
 * @returns {Object} Object containing voting data
 */
export const usePollVotes = (pollID: string) => {
  return useQuery(
    [QUERY_KEYS.pollVotesKey, pollID],
    async () => {
      // Step 1: Fetch all votes (both YES and NO)
      const yesVotes = await getBudgetDiscussionPollVotes(pollID, true);

      const noVotes = await getBudgetDiscussionPollVotes(pollID, false);

      const yesDrepIds =
        yesVotes?.map((vote) => vote?.attributes?.drep_id) || [];
      const noDrepIds = noVotes?.map((vote) => vote?.attributes?.drep_id) || [];
      const allDrepIds = [...yesDrepIds, ...noDrepIds];

      // Step 3: Fetch voting power and details for all dreps
      let drepDetails = [];
      if (allDrepIds.length > 0) {
        drepDetails = await getDRepVotingPowerList(allDrepIds);
      }

      let totalYesPower = 0;
      let totalNoPower = 0;

      const enrichedDrepList = drepDetails.map((drep) => {
        // Check if drep voted YES
        const yesVote = yesVotes?.find(
          (vote) => vote?.attributes?.drep_id === drep.hashRaw,
        );

        // Check if drep voted NO
        const noVote = noVotes?.find(
          (vote) => vote?.attributes?.drep_id === drep.hashRaw,
        );

        let voteType = null;
        let votedAt = null;

        if (yesVote) {
          voteType = 'YES';
          votedAt = yesVote.attributes.createdAt;
          totalYesPower += +drep.votingPower;
        } else if (noVote) {
          voteType = 'NO';
          votedAt = noVote.attributes.createdAt;
          totalNoPower += +drep.votingPower;
        }

        return {
          ...drep,
          voteType,
          votedAt,
        };
      });

      // Sort dreps by voting power (highest first)
      enrichedDrepList.sort((a, b) => +b.votingPower - +a.votingPower);

      const totalVotingPower = totalYesPower + totalNoPower;

      return {
        drepList: enrichedDrepList,
        totalVotingPower,
        totalYesPower,
        totalNoPower,
        yesDrepCount: yesDrepIds.length,
        noDrepCount: noDrepIds.length,
      };
    },
    {
      enabled: !!pollID,
      refetchOnWindowFocus: false,
    },
  );
};
