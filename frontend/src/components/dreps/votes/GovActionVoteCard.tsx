'use client';
import MarkdownParser from '@/components/atoms/MarkdownParser';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { formatIsoTime } from '@/lib';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';
import { Alert, Box, Tooltip } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { RationaleDataVariants } from '../../../../types/commonTypes';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import {
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
} from '@mui/icons-material';

// Per-vote colors aligned with design system
const VoteBadge = ({ vote }: { vote: string }) => {
  const cfg =
    vote === 'Yes'
      ? { cls: 'bg-success text-zinc-800', Icon: CheckCircleOutline }
      : vote === 'No'
        ? { cls: 'bg-extra_red text-white', Icon: HighlightOff }
        : { cls: 'bg-complementary-100 text-complementary-400', Icon: RemoveCircleOutline };

  return (
    <Box className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <cfg.Icon sx={{ fontSize: 14 }} />
      <span>{vote}</span>
    </Box>
  );
};

export const GovActionVoteCard = ({ action }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShowMoreVisible, setIsShowMoreVisible] = useState(false);
  const [rationaleData, setRationaleData] = useState<RationaleDataVariants | null>(null);
  const rationaleRef = useRef(null);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: action?.gov_action_proposal_id,
    isRequired: !Boolean(action?.proposal?.title || action?.proposal?.abstract || action?.metadata?.body?.title || action?.title),
  });

  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(action?.vote_rationale, true);

  const title =
    action?.proposal?.title ||
    action?.proposal?.abstract ||
    action?.metadata?.body?.title ||
    proposalMetadata?.body?.title ||
    proposalMetadata?.title ||
    action?.title ||
    '—';

  const abstract =
    action?.proposal?.abstract ||
    proposalMetadata?.body?.abstract ||
    proposalMetadata?.abstract ||
    proposalMetadata?.body?.rationale ||
    proposalMetadata?.rationale;

  const { epochParams } = useEpochParamsQuery();

  const lifecycleStatus = getLifecycleStatus({
    ratified_epoch: action?.ratified_epoch,
    enacted_epoch: action?.enacted_epoch,
    expired_epoch: action?.expired_epoch,
    dropped_epoch: action?.dropped_epoch,
  });

  const thresholds = getThresholdsForType(action?.governance_type || action?.type, epochParams);

  useEffect(() => {
    setRationaleData(null);
    if (metadata) setRationaleData(metadata.body);
  }, [metadata]);

  useEffect(() => {
    if (rationaleRef.current) {
      const el = rationaleRef.current as HTMLElement;
      setIsShowMoreVisible(el.scrollHeight > el.clientHeight);
    }
  }, [rationaleData]);

  return (
    <tr className="transition-colors hover:bg-extra_gray">
      {/* Date + external links — desktop only */}
      <td className="hidden w-44 whitespace-nowrap px-4 py-4 align-top md:table-cell">
        <p className="text-sm font-medium text-gray-700">{formatIsoTime(action?.time_voted) || '—'}</p>
        <div className="mt-1">
          <ViewExternalGovAction
            actionId={action?.gov_action_proposal_id}
            txHash={action?.txHash || action?.tx_hash || action?.vote_tx_hash}
            txIndex={Number(action?.gov_action_proposal_index) || 0}
            minimal
          />
        </div>
      </td>

      {/* Vote badge */}
      <td className="px-3 py-4 text-right align-top md:px-4 md:align-middle">
        <VoteBadge vote={action.vote} />
      </td>

      {/* Main content */}
      <td className="px-3 py-4 md:px-4">
        <div className="space-y-2">
          {/* Mobile: date + links */}
          <div className="block md:hidden">
            <p className="mb-1 text-sm font-medium text-gray-700">{formatIsoTime(action?.time_voted) || '—'}</p>
            <ViewExternalGovAction
              actionId={action?.gov_action_proposal_id}
              txHash={action?.txHash || action?.tx_hash || action?.vote_tx_hash}
              txIndex={Number(action?.gov_action_proposal_index) || 0}
              minimal
            />
          </div>

          {/* Title + abstract */}
          <div>
            <h3 className="mb-0.5 text-sm font-semibold text-titles wrap-break-word">{title}</h3>
            {abstract && (
              <div className="mb-2 line-clamp-2 text-xs text-gray-500">
                <MarkdownParser text={abstract} />
              </div>
            )}
          </div>

          {/* Type + lifecycle + thresholds + expiration */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
            {(action?.type || action?.description?.tag) && (
              <span className="rounded-full bg-extra_gray px-2 py-0.5 font-medium text-gray-600">
                {action?.type || action?.description?.tag}
              </span>
            )}
            <GovernanceLifecycleBadge status={lifecycleStatus} />

            {thresholds.isInfoAction ? (
              <span className="italic text-gray-400">No ratification threshold</span>
            ) : thresholds.dvt !== null && (
              <Tooltip
                title={thresholds.pvt !== null ? `DRep ≥${thresholds.dvt}%  ·  SPO ≥${thresholds.pvt}%` : `${thresholds.dvtLabel ?? 'DRep'} ≥${thresholds.dvt}%`}
                placement="top"
                arrow
              >
                <span className="cursor-default border-b border-dashed border-gray-300">
                  <span className="font-semibold text-gray-600">{thresholds.dvtLabel ?? 'DRep'}</span>
                  {' ≥'}{thresholds.dvt}%
                  {thresholds.pvt !== null && <span className="text-gray-400">  ·  SPO ≥{thresholds.pvt}%</span>}
                </span>
              </Tooltip>
            )}

            {action?.expiration_epoch != null && (
              <span>
                Expires Ep. <span className="font-semibold text-gray-700">{action.expiration_epoch}</span>
              </span>
            )}
          </div>

          {/* Rationale */}
          {!isMetadataLoading && !metadataError && (
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Rationale</p>
              <div
                ref={rationaleRef}
                className={`text-xs leading-relaxed text-gray-600 wrap-break-word whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}
              >
                <MarkdownParser
                  text={typeof action?.proposal?.rationale === 'string' ? action.proposal.rationale : 'Not provided.'}
                />
              </div>
              {isShowMoreVisible && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-0.5 text-xs font-medium text-primary-300 hover:font-bold focus:underline focus:outline-none"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {metadataError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {metadataError || 'Failed to load vote rationale data.'}
            </Alert>
          )}
        </div>
      </td>
    </tr>
  );
};
