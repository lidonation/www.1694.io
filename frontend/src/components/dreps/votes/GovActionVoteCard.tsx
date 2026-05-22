'use client';
import Link from 'next/link';
import MarkdownParser from '@/components/atoms/MarkdownParser';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { formatIsoTime, parseContent } from '@/lib';
import { getLifecycleStatus } from '@/lib/governanceThresholds';
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
    isRequired: !Boolean(action?.proposal?.title || action?.proposal?.abstract || action?.metadata?.body?.title || action?.title),
  });

  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(
    action?.vote_rationale,
    true,
  );

  const title =
    action?.proposal?.title ||
    action?.proposal?.abstract ||
    action?.metadata?.body?.title ||
    proposalMetadata?.body?.title ||
    proposalMetadata?.title ||
    action?.title ||
    '-';

  const abstract =
    action?.proposal?.abstract ||
    proposalMetadata?.body?.abstract ||
    proposalMetadata?.abstract ||
    proposalMetadata?.body?.rationale ||
    proposalMetadata?.rationale;

  const lifecycleStatus = getLifecycleStatus({
    ratified_epoch: action?.ratified_epoch,
    enacted_epoch: action?.enacted_epoch,
    expired_epoch: action?.expired_epoch,
    dropped_epoch: action?.dropped_epoch,
  });

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
          <ViewExternalGovAction 
            actionId={action?.gov_action_proposal_id} 
            txHash={action?.txHash || action?.tx_hash || action?.vote_tx_hash}
            txIndex={Number(action?.gov_action_proposal_index) || 0}
          />
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
            <ViewExternalGovAction 
              actionId={action?.gov_action_proposal_id} 
              txHash={action?.txHash || action?.tx_hash || action?.vote_tx_hash}
              txIndex={Number(action?.gov_action_proposal_index) || 0}
            />
          </Box>

          <Box className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-2">
            <Box className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-bold text-gray-800 wrap-break-word">
                {action?.gov_action_proposal_id ? (
                  <Link
                    href={`/governance-actions/${encodeURIComponent(action.gov_action_proposal_id)}`}
                    className="hover:text-primary-300 transition-colors"
                  >
                    {title || '-'}
                  </Link>
                ) : (title || '-')}
              </h3>
              {abstract && (
                <Box className="mb-2 text-sm text-gray-600 line-clamp-3">
                  <MarkdownParser text={abstract} />
                </Box>
              )}
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm font-medium text-gray-700">
                  {action?.type || action?.description?.tag || '-'}
                </span>
                <GovernanceLifecycleBadge status={lifecycleStatus} />
              </div>
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
                      typeof action?.proposal?.rationale === 'string'
                        ? action.proposal.rationale
                        : 'Not provided.'
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

          {action?.gov_action_proposal_id && (
            <Link
              href={`/governance-actions/${encodeURIComponent(action.gov_action_proposal_id)}`}
              className="inline-block pt-1 text-xs font-medium text-primary-300 hover:font-bold"
            >
              View Details →
            </Link>
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
