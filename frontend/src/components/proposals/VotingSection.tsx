import { useState, useEffect } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Box, Button, CircularProgress } from '@mui/material';
import { useCardano } from '@/context/cardanoContext';
import { getDataFromSession } from '@/lib';
import { setUpPdfJwt } from '@/lib/pdfJwtHelper';
import { postProposalVote } from '@/services/requests/postProposalVote';
import { useQueryClient } from 'react-query';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useGetUserProposalVoteQuery } from '@/hooks/useGetUserProposalVoteQuery';
import { loginUserToPdf } from '@/services/requests/loginUserToPdf';

type VoteSectionProps = {
  poll: any;
};

export default function VotingSection({ poll }: VoteSectionProps) {
  if (!poll) return null;

  const [vote, setVote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { stakeKey, dRepRegistration, dRepID, signMessage } = useCardano();
  const queryClient = useQueryClient();
  const { addSuccessAlert, addWarningAlert } = useGlobalNotifications();

  const pollId = poll[0]?.id;
  const { pollVote } = useGetUserProposalVoteQuery(pollId, dRepID);

  useEffect(() => {
    if (pollVote?.data?.[0]) {
      const existingVote = pollVote.data[0];
      setVote(existingVote.attributes.vote_result ? 'yes' : 'no');
      setHasVoted(true);
    }
  }, [pollVote]);

  const handleSubmit = async () => {
    if (!vote) return;
    setSubmitting(true);

    if (!getDataFromSession('pdfUserJwt')) {
      let res = await signMessage(
        'To proceed, please sign this data to verify your identity. This ensures that the action is secure and confirms your identity.',
        stakeKey,
        true,
      );
      const userResponse = await loginUserToPdf({
        identifier: stakeKey,
        signedData: res,
      });
      setUpPdfJwt(userResponse);
    }

    try {
      const voteData = {
        bd_poll_id: `${poll[0]?.id}`,
        drep_id: dRepID,
        drep_voting_power: dRepRegistration?.voting_power,
        vote_result: vote === 'yes' ? true : false,
      };
      await postProposalVote(voteData);
      queryClient.invalidateQueries({
        queryKey: ['getActionProposalPollKey'],
      });
      queryClient.invalidateQueries({
        queryKey: ['getUserProposalVoteKey'],
      });
      setSubmitting(false);
      setHasVoted(true);
      addSuccessAlert('Your vote has been recorded. Thank you!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      setSubmitting(false);
      addWarningAlert('Failed to record vote. Please try again.');
    }
  };

  return (
    <Box className="relative mx-auto overflow-hidden rounded-md bg-white shadow-sm">
      <Box className="relative p-6">
        <Box className="mb-6 text-center">
          <h2 className="text-xl font-semibold">Respond to Poll</h2>
          <p className="mt-1 text-lg leading-relaxed text-gray-500">
            Do you support this proposal to be included in the next Cardano
            Budget On chain Info Action?
          </p>
        </Box>

        <Box className="mb-6 flex justify-between gap-4">
          <button
            onClick={() => setVote('yes')}
            disabled={hasVoted}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border p-4 transition-all ${
              vote === 'yes'
                ? 'border-primary-200 bg-primary-100'
                : 'border-gray-200 hover:border-primary-200 hover:bg-primary-100'
            } ${hasVoted ? 'cursor-not-allowed opacity-70' : ''}`}
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
            onClick={() => setVote('no')}
            disabled={hasVoted}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border p-4 transition-all ${
              vote === 'no'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300 hover:bg-red-100'
            } ${hasVoted ? 'cursor-not-allowed opacity-70' : ''}`}
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

        {hasVoted ? (
          <Box className="rounded-md bg-gray-100 p-3 text-center text-gray-700">
            Your vote has been recorded. Thank you for participating!
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={() => handleSubmit()}
            disabled={submitting || vote === null}
            className="w-full"
          >
            {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Submit Vote
          </Button>
        )}
      </Box>
    </Box>
  );
}
