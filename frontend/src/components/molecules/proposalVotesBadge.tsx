'use client';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ThumbUp, ThumbDown } from '@mui/icons-material';
import { useGetUserProposalVoteQuery } from '@/hooks/useGetUserProposalVoteQuery';

type ProposalVotesBadgeProps = {
  pollId: string;
  dRepId: string;
};

export default function ProposalVotesBadge({ pollId, dRepId }: ProposalVotesBadgeProps) {
  const { pollVote, isPollVoteLoading } = useGetUserProposalVoteQuery(pollId, dRepId);
  const voteResult = pollVote?.data?.[0]?.attributes?.vote_result;

  if (isPollVoteLoading) {
    return (
      <Box className="flex items-center mt-2 gap-2">
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">Checking vote...</Typography>
      </Box>
    );
  }

  const voteMap = {
    true: { icon: <ThumbUp sx={{ fontSize: 20 }} className="text-primary-300" />, label: 'Voted' },
    false: <ThumbDown sx={{ fontSize: 20 }} className="text-red-500" />,
  };

  const icon = voteResult === true ? voteMap.true.icon : voteResult === false ? voteMap.false : null;

  return icon ? (
    <Box className="flex flex-col items-center mt-2">
      <Typography variant="subtitle2" fontWeight="semi-bold">Voted</Typography>
      {icon}
    </Box>
  ) : null;
}
