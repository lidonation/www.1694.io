import ThumbUp from '@mui/icons-material/ThumbUp';
import ThumbDown from '@mui/icons-material/ThumbDown';
import { Box } from '@mui/material';
import { formatNumberTimeToReadable } from '@/lib';

type VoteResultsCardProps = {
  poll: any;
};

export default function VoteResultsCard({ poll }: VoteResultsCardProps) {
  if (!poll) return null;
  const voteData = poll[0]?.attributes;
  const totalVotes = voteData?.poll_yes + voteData?.poll_no;
  const yesPercentage =
    totalVotes > 0 ? (voteData?.poll_yes / totalVotes) * 100 : 0;
  const noPercentage =
    totalVotes > 0 ? (voteData?.poll_no / totalVotes) * 100 : 0;

  return (
    <Box className="rounded-md bg-white p-6 shadow-sm">
      <Box className="mb-4 flex items-center justify-between">
        <Box>
          <h2 className="text-xl font-semibold">Poll Results</h2>
          <p className="text-lg leading-relaxed text-gray-500">
            Do you support this proposal to be included in the next Cardano
            Budget?
          </p>
        </Box>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${voteData?.is_poll_active ? 'bg-blue-100 text-primary-300' : 'bg-gray-100 text-gray-800'}`}
        >
          {voteData?.is_poll_active ? 'Active' : 'Closed'}
        </span>
      </Box>

      <Box className="mb-6">
        <Box className="mb-1 flex justify-between">
          <p className="text-sm font-medium text-gray-700">
            {totalVotes} total vote(s)
          </p>
        </Box>

        <Box className="mb-4 h-4 w-full rounded-full bg-gray-200">
          <Box
            className="h-4 rounded-full bg-primary-300"
            style={{ width: `${yesPercentage}%` }}
          ></Box>
        </Box>

        <Box className="flex items-center justify-between gap-4">
          <Box className="flex items-center">
            <Box className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <ThumbUp fontSize="small" className="text-primary-300" />
            </Box>
            <Box>
              <p className="text-sm font-semibold text-gray-700">Yes</p>
              <p className="text-lg font-bold text-gray-900">
                {voteData?.poll_yes}{' '}
                <span className="text-sm text-gray-500">
                  ({yesPercentage.toFixed(0)}%)
                </span>
              </p>
            </Box>
          </Box>

          <Box className="flex items-center">
            <Box className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <ThumbDown fontSize="small" className="text-red-600" />
            </Box>
            <Box>
              <p className="text-sm font-semibold text-gray-700">No</p>
              <p className="text-lg font-bold text-gray-900">
                {voteData?.poll_no}{' '}
                <span className="text-sm text-gray-500">
                  ({noPercentage.toFixed(0)}%)
                </span>
              </p>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Created: {formatNumberTimeToReadable(voteData?.createdAt)}
        </p>
      </Box>
    </Box>
  );
}
