import ThumbUp from '@mui/icons-material/ThumbUp';
import ThumbDown from '@mui/icons-material/ThumbDown';
import { Box, Button, Typography } from '@mui/material';
import {
  formatAsCurrency,
  formatDateTimeToUTC,
  formatNumberTimeToReadable,
  lovelaceToAda,
  scrollToElement,
} from '@/lib';
import { usePollVotes } from '@/hooks/usePollVotes';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useState } from 'react';
import DRepVoteCard from './DRepVoteCard';
import PollResultsSkeleton from '../Loaders/PollResultsSkeleton';
import Link from 'next/link';

type VoteResultsCardProps = {
  poll: any;
  showFullDetails?: boolean;
  isPollLoading?: boolean;
};

export default function VoteResultsCard({
  poll,
  showFullDetails = true,
  isPollLoading,
}: VoteResultsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: voteData, isLoading } = usePollVotes(poll?.[0]?.id);

  const pollData = poll?.[0]?.attributes;

  if (isLoading || isPollLoading) {
    return <PollResultsSkeleton />;
  }

  const totalVotes = pollData?.poll_yes + pollData?.poll_no;
  const yesPercentage =
    totalVotes > 0
      ? ((voteData?.totalYesPower / voteData?.totalVotingPower) * 100).toFixed(
          2,
        )
      : 0;
  const noPercentage =
    totalVotes > 0
      ? ((voteData?.totalNoPower / voteData?.totalVotingPower) * 100).toFixed(2)
      : 0;

  const formatVotingPower = (power: number) => {
    return formatAsCurrency(lovelaceToAda(power));
  };

  const dRepInfluence = (power: number) => {
    if (voteData?.totalVotingPower) {
      return ((power / voteData?.totalVotingPower) * 100).toFixed(3);
    }
  };

  return (
    <Box>
      {showFullDetails && (
        <Box className="mb-4 flex items-center justify-between">
          <Box>
            <h2 className="text-xl font-semibold">Poll Results</h2>
            <p className="text-lg leading-relaxed text-gray-500">
              Do you support this proposal to be included in the next Cardano
              Budget?
            </p>
          </Box>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${pollData?.is_poll_active ? 'bg-blue-100 text-primary-300' : 'bg-gray-100 text-gray-800'}`}
          >
            {pollData?.is_poll_active ? 'Active' : 'Closed'}
          </span>
        </Box>
      )}

      <Box className="mb-6">
        <Box className="mb-1 flex justify-between">
          <p className="text-sm font-medium text-gray-700">
            {totalVotes} total vote(s)
          </p>
        </Box>

        <Box className="mb-1 h-3 w-full rounded-full bg-gray-200">
          <Box
            className="h-3 rounded-full bg-primary-300"
            style={{ width: `${yesPercentage}%` }}
          ></Box>
        </Box>

        <Box className="flex items-center justify-between gap-4">
          <Box className="flex items-center">
            <Box className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <ThumbUp sx={{ fontSize: 14 }} className="text-primary-300" />
            </Box>
            <Box>
              <p className="text-sm font-semibold text-gray-700">Yes</p>
              <Typography sx={{ fontSize: 14 }} className="text-gray-700">
                {pollData?.poll_yes} -{' '}
                <Typography
                  component="span"
                  className="text-gray-400"
                  sx={{ fontSize: 14 }}
                >
                  <Typography
                    component="span"
                    className="text-black"
                    sx={{ fontWeight: 600, fontSize: 14 }}
                  >
                    ₳ {formatVotingPower(voteData?.totalYesPower)}
                  </Typography>
                  ({yesPercentage}%)
                </Typography>
              </Typography>
            </Box>
          </Box>

          <Box className="flex items-center">
            <Box className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <ThumbDown sx={{ fontSize: 14 }} className="text-red-600" />
            </Box>
            <Box>
              <p className="text-sm font-semibold text-gray-700">No</p>
              <p className="text-gray-700">
                {pollData?.poll_no} -{' '}
                <span className="text-sm text-gray-400">
                  <span className="font-bold text-black">
                    ₳ {formatVotingPower(voteData?.totalNoPower)}
                  </span>
                  ({noPercentage}%)
                </span>
              </p>
            </Box>
          </Box>
        </Box>
        {showFullDetails &&
          isExpanded &&
          (!voteData || voteData?.drepList?.length <= 0) && (
            <Typography className="p-2 text-center text-lg text-gray-500">
              No related votes found!
            </Typography>
          )}
        {showFullDetails && isExpanded && !!voteData?.totalVotingPower && (
          <Box className="p-2 text-center transition-all">
            <Typography sx={{ fontSize: 14 }} className="text-gray-500">
              Total Participate Stake
            </Typography>
            <Typography sx={{ fontSize: 24 }}>
              ₳ {formatVotingPower(voteData?.totalVotingPower)}
            </Typography>
          </Box>
        )}
        {showFullDetails && isExpanded && voteData?.drepList?.length > 0 && (
          <Box className="divide-y transition-all">
            {voteData?.drepList.map((dRep) => (
              <DRepVoteCard
                key={dRep?.hashRaw}
                name={dRep?.givenName}
                drepId={dRep?.view}
                influence={dRepInfluence(dRep?.votingPower)}
                votingPower={formatVotingPower(dRep?.votingPower)}
                voteTime={formatDateTimeToUTC(dRep?.votedAt)}
                isPositive={dRep?.voteType === 'YES' ? true : false}
                vote={dRep?.voteType}
              />
            ))}
          </Box>
        )}
        <Box className="text-center">
          {!showFullDetails && (
            <Link
              href="#vote-results"
              onClick={(event) => scrollToElement(event, 'vote-results')}
            >
              <Button variant="text">
                View Poll Results
                <KeyboardArrowDown />
              </Button>
            </Link>
          )}
          {showFullDetails && (
            <Button variant="text" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Minimize Breakdown' : 'Expand Breakdown'}
              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </Button>
          )}
        </Box>
      </Box>

      <Box className="border-t border-gray-200 pt-4">
        {showFullDetails && (
          <p className="text-sm text-gray-500">
            Created: {formatNumberTimeToReadable(pollData?.createdAt)}
          </p>
        )}
      </Box>
    </Box>
  );
}
