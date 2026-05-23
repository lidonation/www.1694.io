'use client';
import MarkdownParser from '@/components/atoms/MarkdownParser';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { formatIsoTime } from '@/lib';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';
import { Alert, Tooltip } from '@mui/material';
import { useState, useEffect } from 'react';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import {
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';

const VOTE_STYLE: Record<string, { border: string; badge: string; text: string; Icon: any }> = {
  Yes:     { border: 'border-l-success',          badge: 'bg-success/20 text-green-700',           text: 'text-green-700',           Icon: CheckCircleOutline },
  No:      { border: 'border-l-extra_red',         badge: 'bg-red-100 text-red-700',                text: 'text-red-700',             Icon: HighlightOff },
  Abstain: { border: 'border-l-complementary-200', badge: 'bg-complementary-100 text-complementary-400', text: 'text-complementary-400', Icon: RemoveCircleOutline },
};

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

export const GovActionVoteCard = ({ action }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: action?.gov_action_proposal_id,
    isRequired: !Boolean(action?.proposal?.title || action?.proposal?.abstract || action?.metadata?.body?.title || action?.title),
  });

  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(action?.vote_rationale, true);
  const { epochParams } = useEpochParamsQuery();

  const title =
    action?.proposal?.title ||
    action?.metadata?.body?.title ||
    proposalMetadata?.body?.title ||
    proposalMetadata?.title ||
    action?.title ||
    '—';

  const rawAbstract =
    action?.proposal?.abstract ||
    proposalMetadata?.body?.abstract ||
    proposalMetadata?.abstract;

  const abstract = rawAbstract && !URL_ONLY.test(rawAbstract.trim()) ? rawAbstract : null;

  const rationaleText =
    typeof action?.proposal?.rationale === 'string' && !URL_ONLY.test(action.proposal.rationale.trim())
      ? action.proposal.rationale
      : null;

  const hasExpandableContent = abstract || rationaleText || (metadata?.body && !isMetadataLoading);

  const lifecycleStatus = getLifecycleStatus({
    ratified_epoch: action?.ratified_epoch,
    enacted_epoch: action?.enacted_epoch,
    expired_epoch: action?.expired_epoch,
    dropped_epoch: action?.dropped_epoch,
  });

  const thresholds = getThresholdsForType(action?.governance_type || action?.type, epochParams);

  const voteKey = action?.vote?.charAt(0).toUpperCase() + action?.vote?.slice(1).toLowerCase() || 'Abstain';
  const vStyle = VOTE_STYLE[voteKey] ?? VOTE_STYLE.Abstain;

  return (
    <div className={`rounded-xl border border-gray-100 bg-white shadow-sm border-l-4 ${vStyle.border} transition-shadow hover:shadow-md`}>

      {/* ── Top section: always visible ─────────────────────────────── */}
      <div className="flex flex-col gap-2.5 p-4">

        {/* Row 1: vote badge + date + links */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${vStyle.badge}`}>
            <vStyle.Icon sx={{ fontSize: 14 }} />
            <span>{voteKey}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400">{formatIsoTime(action?.time_voted) || '—'}</span>
            <ViewExternalGovAction
              actionId={action?.gov_action_proposal_id}
              txHash={action?.txHash || action?.tx_hash || action?.vote_tx_hash}
              txIndex={Number(action?.gov_action_proposal_index) || 0}
              minimal
            />
          </div>
        </div>

        {/* Row 2: title */}
        <h3 className="text-sm font-semibold leading-snug text-titles">
          {title}
        </h3>

        {/* Row 3: type chip + lifecycle + thresholds + expiration */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
          {(action?.governance_type || action?.type || action?.description?.tag) && (
            <span className="rounded-full bg-extra_gray px-2 py-0.5 font-medium text-gray-600">
              {action?.governance_type || action?.type || action?.description?.tag}
            </span>
          )}

          <GovernanceLifecycleBadge status={lifecycleStatus} />

          {thresholds.isInfoAction ? (
            <span className="italic text-gray-400">No ratification threshold</span>
          ) : thresholds.dvt !== null && (
            <Tooltip
              title={thresholds.pvt !== null
                ? `DRep ≥${thresholds.dvt}%  ·  SPO ≥${thresholds.pvt}%`
                : `${thresholds.dvtLabel ?? 'DRep'} ≥${thresholds.dvt}%`}
              placement="top"
              arrow
            >
              <span className="cursor-default border-b border-dashed border-gray-300">
                <span className="font-semibold text-gray-600">{thresholds.dvtLabel ?? 'DRep'}</span>
                {' ≥'}{thresholds.dvt}%
                {thresholds.pvt !== null && (
                  <span className="text-gray-400">  ·  SPO ≥{thresholds.pvt}%</span>
                )}
              </span>
            </Tooltip>
          )}

          {epochParams?.gov_action_lifetime != null && (
            <span>
              Active <span className="font-semibold text-gray-600">{epochParams.gov_action_lifetime}</span> epochs
            </span>
          )}

          {action?.expiration_epoch != null && (
            <span>
              Expires Ep. <span className="font-semibold text-gray-700">{action.expiration_epoch}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Expandable section ───────────────────────────────────────── */}
      {hasExpandableContent && (
        <>
          <div className="border-t border-gray-100 px-4 py-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
            >
              <span>Details &amp; Rationale</span>
              {isExpanded ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
            </button>
          </div>

          {isExpanded && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 pb-4 pt-3">
              {abstract && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Abstract</p>
                  <div className="text-xs leading-relaxed text-gray-600">
                    <MarkdownParser text={abstract} />
                  </div>
                </div>
              )}

              {rationaleText && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Rationale</p>
                  <div className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                    <MarkdownParser text={rationaleText} />
                  </div>
                </div>
              )}

              {!isMetadataLoading && !metadataError && metadata?.body && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vote Rationale</p>
                  <div className="text-xs leading-relaxed text-gray-600">
                    <MarkdownParser text={typeof metadata.body === 'string' ? metadata.body : JSON.stringify(metadata.body)} />
                  </div>
                </div>
              )}

              {metadataError && (
                <Alert severity="error" sx={{ fontSize: 12 }}>
                  Failed to load vote rationale.
                </Alert>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
