import { useState } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box } from '@mui/material';

export default function VotingSection() {
  const [vote, setVote] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleVote = (choice) => {
    setVote(choice);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Box className="mx-auto rounded-md bg-white p-6 shadow-sm">
        <Box className="flex flex-col items-center justify-center space-y-4 text-center">
          <CheckCircleIcon
            className="text-green-500"
            style={{ fontSize: 48 }}
          />
          <h3 className="text-xl font-medium text-gray-900">
            Thank you for your vote!
          </h3>
          <p className="text-sm text-gray-600">
            Your opinion has been recorded.
          </p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="relative mx-auto overflow-hidden rounded-md bg-white shadow-sm">
      <Box className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300 bg-opacity-70">
        <h2 className="text-lg font-bold">Coming Soon...</h2>
      </Box>

      <Box className="relative p-6">
        <Box className="mb-6 text-center">
          <h2 className="text-xl font-semibold">Cast Your Vote</h2>
          <p className="mt-1 text-lg leading-relaxed text-gray-500">
            Do you support this proposal to be included in the next Cardano
            Budget?
          </p>
        </Box>

        <Box className="mb-6 flex justify-between gap-4">
          <button
            disabled
            onClick={() => handleVote('yes')}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border p-4 transition-all ${
              vote === 'yes'
                ? 'border-primary-200 bg-primary-100'
                : 'border-gray-200'
            }`}
            // hover:border-primary-200 hover:bg-primary-100
          >
            <ThumbUpIcon
              className={vote === 'yes' ? 'text-primary-300' : 'text-gray-400'}
              style={{ fontSize: 32 }}
            />
            <span
              className={`mt-2 font-medium ${vote === 'yes' ? 'text-primary-300' : 'text-gray-700'}`}
            >
              Yes
            </span>
          </button>

          <button
            disabled
            onClick={() => handleVote('no')}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border p-4 transition-all ${
              vote === 'no' ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            // hover:border-red-300 hover:bg-red-100
          >
            <ThumbDownIcon
              className={vote === 'no' ? 'text-red-500' : 'text-gray-400'}
              style={{ fontSize: 32 }}
            />
            <span
              className={`mt-2 font-medium ${vote === 'no' ? 'text-red-700' : 'text-gray-700'}`}
            >
              No
            </span>
          </button>
        </Box>

        <button
          onClick={handleSubmit}
          disabled={vote === null}
          className={`w-full rounded-lg px-4 py-3 font-medium text-white transition-colors ${
            vote === null
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-primary-300 hover:bg-primary-400'
          }`}
        >
          Submit Vote
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          You cannot change your vote after submission.
        </p>
      </Box>
    </Box>
  );
}
