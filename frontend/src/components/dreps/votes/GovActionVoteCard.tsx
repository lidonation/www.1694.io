import MarkdownParser from '@/components/atoms/MarkdownParser';
import { urls } from '@/constants';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { formatIsoTime } from '@/lib';
import { Box } from '@mui/material';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export const GovActionVoteCard = ({ action }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShowMoreVisible, setIsShowMoreVisible] = useState(false);
  const rationaleRef = useRef(null);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: action?.gov_action_proposal_id,
    isRequired: !Boolean(action?.title),
  });

  const title =
    action?.metadata?.body?.title ||
    action?.title ||
    proposalMetadata?.body?.title ||
    '-';

  const rationale =
    action?.metadata?.body?.rationale ||
    action?.rationale ||
    proposalMetadata?.body?.rationale ||
    '-';

  useEffect(() => {
    if (rationaleRef.current) {
      const element = rationaleRef.current;
      setIsShowMoreVisible(element.scrollHeight > element.clientHeight);
    }
  }, [rationale]);

  const toggleRationale = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="hidden whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-800 md:table-cell">
        {formatIsoTime(action?.time_voted) || '-'}
      </td>

      <td className="px-3 py-3 md:px-4 md:py-4">
        <Box className="space-y-2">
          <p className="block text-sm font-medium text-gray-800 md:hidden">
            {formatIsoTime(action?.time_voted) || '-'}
          </p>

          <Box className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-2">
            <Box className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-medium text-primary-300 md:truncate">
                {title || '-'}
              </h3>
              <p className="mb-1 text-sm text-gray-500 md:mb-1">
                Type:{' '}
                <span className="font-medium text-gray-700">
                  {action?.type || action?.description?.tag || '-'}
                </span>
              </p>
            </Box>
          </Box>

          {!!rationale && (
            <Box>
              <p className="mb-1 text-sm font-medium text-gray-500">
                Rationale:
              </p>
              <Box className="relative">
                <Box
                  ref={rationaleRef}
                  className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-600 ${
                    !isExpanded ? 'line-clamp-2' : ''
                  }`}
                >
                  <MarkdownParser text={rationale} />
                </Box>
                {isShowMoreVisible && (
                  <button
                    id="show-more-btn"
                    aria-label={
                      isExpanded ? 'Show less rationale' : 'Show more rationale'
                    }
                    onClick={toggleRationale}
                    className="mt-1 text-sm font-medium text-primary-300 hover:font-bold focus:underline focus:outline-none"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </Box>
            </Box>
          )}

          <Box className="flex flex-col gap-1">
            <p className="text-sm">View Action on:</p>
            <Box className="flex flex-row gap-2">
              <Link
                href={`${urls.govToolUrl}/governance_actions/${action?.gov_action_proposal_id}#0`}
                target="_blank"
                className="text-sm text-primary-300 hover:font-bold"
              >
                Govtool
              </Link>
              <Link
                href={`${urls.adaStatUrl}/governances/${action?.gov_action_proposal_id}00`}
                target="_blank"
                className="text-sm text-primary-300 hover:font-bold"
              >
                ADASTAT
              </Link>
            </Box>
          </Box>
        </Box>
      </td>

      <td className="px-3 py-3 text-right align-top md:px-4 md:py-4 md:align-middle">
        <VoteBadge vote={action.vote} />
      </td>
    </tr>
  );
};

const VoteBadge = ({ vote }: { vote: string }) => {
  const colorClasses =
    vote === 'Yes'
      ? 'bg-green-400 text-zinc-800'
      : vote == 'No'
        ? 'bg-red-400 text-zinc-800'
        : 'bg-gray-200 text-zinc-800';

  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${colorClasses}`}
    >
      {vote}
    </span>
  );
};
