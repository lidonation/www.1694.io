import MarkdownParser from '@/components/atoms/MarkdownParser';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { formatIsoTime, parseContent } from '@/lib';
import { Alert, Box } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { RationaleDataVariants } from '../../../../types/commonTypes';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import {
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
} from '@mui/icons-material';

export const GovActionVoteCard = ({ action }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShowMoreVisible, setIsShowMoreVisible] = useState(false);
  const [rationaleData, setRationaleData] =
    useState<RationaleDataVariants | null>(null);
  const rationaleRef = useRef(null);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: action?.gov_action_proposal_id,
    isRequired: !Boolean(action?.title),
  });

  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(
    action?.vote_rationale,
    true,
  );

  const title =
    action?.metadata?.body?.title ||
    action?.title ||
    proposalMetadata?.body?.title ||
    '-';

  useEffect(() => {
    setRationaleData(null);
    if (metadata) {
      setRationaleData(metadata.body);
    }
  }, [metadata]);

  useEffect(() => {
    if (rationaleRef.current) {
      const element = rationaleRef.current;
      setIsShowMoreVisible(element.scrollHeight > element.clientHeight);
    }
  }, [rationaleData]);

  const toggleRationale = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <tr className="transition-all hover:bg-gray-50">
      <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
        <div className="flex h-full flex-col gap-2">
          <p className="mb-1 block text-sm font-medium text-gray-800">
            {formatIsoTime(action?.time_voted) || '-'}
          </p>
          <ViewExternalGovAction actionId={action?.gov_action_proposal_id} />
        </div>
      </td>

      <td className="px-3 py-3 text-right align-top md:px-4 md:py-4 md:align-middle">
        <VoteBadge vote={action.vote} />
      </td>

      <td className="px-3 py-3 md:px-4 md:py-4">
        <Box className="space-y-2">
          <Box className="block md:hidden">
            <p className="mb-1 block text-sm font-medium text-gray-800">
              {formatIsoTime(action?.time_voted) || '-'}
            </p>
            <ViewExternalGovAction actionId={action?.gov_action_proposal_id} />
          </Box>

          <Box className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-2">
            <Box className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-bold text-gray-800 break-words">
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

          {!isMetadataLoading && !metadataError && (
            <Box>
              <p className="mb-1 text-sm font-medium text-gray-500">
                Rationale:
              </p>
              <Box className="relative">
                <Box
                  ref={rationaleRef}
                  className={`whitespace-pre-wrap text-sm break-words leading-relaxed text-gray-600 ${
                    !isExpanded ? 'line-clamp-2' : ''
                  }`}
                >
                  <MarkdownParser
                    text={
                      rationaleData &&
                      typeof rationaleData?.comment === 'string'
                        ? parseContent(rationaleData?.comment)
                        : parseContent(rationaleData?.comment?.['@value']) ||
                          'Not provided.'
                    }
                  />
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
          {metadataError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {metadataError || 'Failed to load vote rationale data.'}
            </Alert>
          )}
        </Box>
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
    <Box
      className={`flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colorClasses}`}
    >
      {vote === 'Yes' ? (
        <CheckCircleOutline sx={{ fontSize: 17 }} />
      ) : vote === 'No' ? (
        <HighlightOff sx={{ fontSize: 17 }} />
      ) : (
        <RemoveCircleOutline sx={{ fontSize: 17 }} />
      )}
      <span>{vote}</span>
    </Box>
  );
};
