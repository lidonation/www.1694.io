'use client';
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import MarkdownParser from './MarkdownParser';
import { keyframes } from '@emotion/react';

const highlightAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }
  20% {
    box-shadow: 0 0 0 4px var(--highlight-glow), 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    border-color: var(--highlight-border);
  }
  100% {
    box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }
`;

import CopyToClipboard from './CopyToClipboard';
import { DrepVote } from '../../../types/timeline';
import Button from './Button';
import {
  VoteRationaleModal,
  VoteRationaleModalProps,
} from '../molecules/VoteRationaleModal';
import { GovAction } from '../../../types/api';
import { useWallet } from '@/context/globalContext';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import GovernanceLifecycleBadge from './GovernanceLifecycleBadge';
import GovernanceMetaRow from './GovernanceMetaRow';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';

interface DrepVoteTimelineCardProps {
  item: DrepVote | GovAction;
  isVoteOwner?: boolean;
  minimal?: boolean;
}

// Per-vote accent colors
const VOTE_ACCENT: Record<string, { border: string; glow: string; glowBorder: string; icon: string; voteBg: string; voteText: string }> = {
  Yes:     { border: 'border-l-success',        glow: 'rgba(111,223,142,0.35)', glowBorder: '#6fdf8e', icon: '/svgs/check.svg',        voteBg: 'bg-success/20',        voteText: 'text-green-700' },
  No:      { border: 'border-l-extra_red',       glow: 'rgba(255,77,77,0.3)',   glowBorder: '#ff4d4d', icon: '/svgs/close.svg',        voteBg: 'bg-red-100',           voteText: 'text-red-700' },
  Abstain: { border: 'border-l-complementary-200', glow: 'rgba(160,211,224,0.35)', glowBorder: '#a0d3e0', icon: '/svgs/alert-circle.svg', voteBg: 'bg-complementary-100', voteText: 'text-complementary-400' },
};

// Per-type chip styling
const TYPE_CHIP: Record<string, { bg: string; icon: string; label: string }> = {
  parameterchange:  { bg: 'bg-secondary-100 text-secondary-400', icon: '/svgs/exchange.svg',    label: 'Protocol Parameters' },
  noconfidence:     { bg: 'bg-red-50 text-red-600',              icon: '/svgs/info-circle.svg', label: 'No Confidence' },
  infoaction:       { bg: 'bg-primary-100 text-primary-400',     icon: '/svgs/info-circle.svg', label: 'Info' },
  hardforkinitiation: { bg: 'bg-complementary-100 text-complementary-400', icon: '/svgs/status-change.svg', label: 'Hard Fork' },
  newconstitution:  { bg: 'bg-general-100 text-general-400',     icon: '/svgs/notebook.svg',    label: 'New Constitution' },
  newcommittee:     { bg: 'bg-extra_gray text-primary-400',       icon: '/svgs/users-group.svg', label: 'Update Committee' },
  updatecommittee:  { bg: 'bg-extra_gray text-primary-400',       icon: '/svgs/users-group.svg', label: 'Update Committee' },
  treasurywithdrawals: { bg: 'bg-secondary-100 text-secondary-400', icon: '/svgs/exchange.svg', label: 'Treasury Withdrawal' },
};

function getTypeChip(tag: string | null | undefined) {
  if (!tag) return null;
  const key = tag.toLowerCase().replace(/[_\s]/g, '');
  for (const [pattern, chip] of Object.entries(TYPE_CHIP)) {
    if (key.includes(pattern)) return chip;
  }
  return null;
}

// ─── VoteStatusChip ──────────────────────────────────────────────────────────
const VoteStatusChip = ({ date, vote, minimal }: { date: string; vote: string; minimal?: boolean }) => {
  const accent = VOTE_ACCENT[vote] ?? VOTE_ACCENT.Abstain;

  return (
    <div className="flex items-center justify-between">
      <div className={`flex items-center gap-1.5 rounded-full ${accent.voteBg} ${minimal ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}`}>
        <img src={accent.icon} className={minimal ? 'h-3 w-3' : 'h-4 w-4'} alt={vote} />
        <span className={`font-semibold ${accent.voteText} ${minimal ? 'text-[9px]' : 'text-xs'}`}>{vote}</span>
      </div>
      <div className="flex flex-col items-end">
        {!minimal && <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Voted</p>}
        <p className={`font-medium text-gray-500 ${minimal ? 'text-[10px]' : 'text-[11px]'}`}>
          {new Date(date).toLocaleString(undefined, minimal
            ? { month: 'short', day: 'numeric', year: 'numeric' }
            : { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Main card ───────────────────────────────────────────────────────────────
const DrepVoteTimelineCard = ({
  item,
  isVoteOwner = false,
  minimal = false,
}: DrepVoteTimelineCardProps) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const elementId = `vote-${(item as any)?.id || (item as any)?.vote_tx_hash || (item as any)?.gov_action_proposal_id}`;

  const voteKey = item.vote?.charAt(0).toUpperCase() + item.vote?.slice(1).toLowerCase() || 'Abstain';
  const accent = VOTE_ACCENT[voteKey] ?? VOTE_ACCENT.Abstain;

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === `#${elementId}`) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 2000);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [elementId]);

  const [rationaleModalOptions, setRationalModalOptions] = useState<VoteRationaleModalProps>({
    mode: 'view', open: false, onClose: () => {}, onEdit: () => {}, rationaleUrl: item?.vote_rationale,
  });

  const { latestEpoch } = useWallet();
  const { epochParams } = useEpochParamsQuery();

  const lifecycleStatus = getLifecycleStatus({
    ratified_epoch: (item as any)?.ratified_epoch,
    enacted_epoch: item?.enacted_epoch,
    expired_epoch: (item as any)?.expired_epoch,
    dropped_epoch: (item as any)?.dropped_epoch,
  });

  const governanceType = (item as any)?.governance_type || item?.type || null;
  const thresholds = getThresholdsForType(governanceType, epochParams);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: (item as any)?.gov_action_proposal_id || (item as any)?.govActionHash || (item as any)?.gov_action_hash || item?.txHash || (item as any)?.tx_hash,
    isRequired: !((item as DrepVote).proposal?.title || (item as DrepVote).proposal?.abstract || (item as any)?.metadata?.body?.title),
  });

  const title = (item as DrepVote).proposal?.title
    || (item as DrepVote).proposal?.abstract
    || (item as any)?.metadata?.body?.title
    || proposalMetadata?.body?.title
    || proposalMetadata?.title;

  const description = (item as DrepVote).proposal?.rationale
    || (item as DrepVote).proposal?.abstract
    || proposalMetadata?.body?.abstract
    || proposalMetadata?.abstract
    || proposalMetadata?.body?.rationale
    || proposalMetadata?.rationale;

  const isEnacted = item?.enacted_epoch && latestEpoch > item?.enacted_epoch;
  const isExpired = item?.expiration_epoch && latestEpoch > item?.expiration_epoch;

  const tag = (item as DrepVote).proposal?.type || (item?.type as string) || proposalMetadata?.type || proposalMetadata?.body?.type;
  const typeChip = getTypeChip(tag);

  const handleRationaleModalOpen = (options: VoteRationaleModalProps) =>
    setRationalModalOptions({ ...options, open: true });
  const handleRationaleModalClose = () =>
    setRationalModalOptions({ ...rationaleModalOptions, open: false });

  const renderRationaleButton = () => {
    if (item?.vote_rationale) {
      return (
        <Button handleClick={() => handleRationaleModalOpen({ mode: 'view', open: true, onClose: handleRationaleModalClose, rationaleUrl: item.vote_rationale })} color="primary" size="small">
          {minimal ? 'Rationale' : 'View Rationale'}
        </Button>
      );
    }
    if (!item?.vote_rationale && isVoteOwner && !isEnacted && !isExpired) {
      return (
        <Button handleClick={() => handleRationaleModalOpen({ mode: 'edit', open: true, onClose: handleRationaleModalClose, rationaleUrl: item.vote_rationale, extraData: { vote: item?.vote, voteTxHash: item?.gov_action_proposal_id, voteTxIndex: Number(item?.gov_action_proposal_index) || 0, voterId: item?.view, isOwner: isVoteOwner } })} color="primary" size="small">
          {minimal ? '+ Rationale' : 'Add Rationale'}
        </Button>
      );
    }
    return null;
  };

  //@ts-ignore
  const submittedAt = item?.proposal?.submitted_at;

  return (
    <Box
      id={elementId}
      className={`flex w-full flex-col ${minimal ? 'gap-2 p-2.5' : 'gap-3 p-4'} rounded-xl bg-white shadow-sm border-l-4 ${accent.border}`}
      sx={{
        border: '1px solid #f1f1f1',
        borderLeftWidth: '4px',
        transition: 'box-shadow 0.3s ease',
        '--highlight-glow': accent.glow,
        '--highlight-border': accent.glowBorder,
        ...(isHighlighted && { animation: `${highlightAnimation} 2s ease-out forwards` }),
      }}
    >
      <VoteStatusChip date={item?.time_voted} vote={item?.vote} minimal={minimal} />
      <VoteRationaleModal {...rationaleModalOptions} />

      {/* ── Content ── */}
      <div className="flex flex-col gap-2 flex-1">
        {/* Title */}
        <p className={`font-semibold leading-snug text-titles ${minimal ? 'text-xs line-clamp-2' : 'text-sm'}`}>
          {title || '—'}
        </p>

        {!minimal && description && (
          <div className="line-clamp-2 text-xs text-gray-500">
            <MarkdownParser text={description} />
          </div>
        )}

        {/* Type chip + lifecycle badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          {typeChip && (
            <span className={`inline-flex items-center gap-1 rounded-full ${typeChip.bg} ${minimal ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} font-medium`}>
              <img src={typeChip.icon} className={minimal ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} alt="" />
              {typeChip.label}
            </span>
          )}
          <GovernanceLifecycleBadge status={lifecycleStatus} minimal={minimal} />
        </div>

        {/* Governance meta row (full card only) */}
        {!minimal && (
          <GovernanceMetaRow
            status={lifecycleStatus}
            thresholds={thresholds}
            expirationEpoch={(item as any)?.expiration_epoch ?? null}
            govActionLifetime={epochParams?.gov_action_lifetime ?? null}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className={`flex items-center justify-between gap-2 border-t border-gray-50 ${minimal ? 'pt-1.5' : 'pt-3'}`}>
        <CopyToClipboard
          text={(item as any)?.govActionHash || (item as any)?.gov_action_hash || item?.txHash || (item as any)?.tx_hash}
          truncate
        >
          <span className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-600 ${minimal ? 'px-1.5 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[10px]'}`}>
            <img src="/svgs/copy.svg" alt="copy" className="h-2.5 w-2.5 opacity-50" />
            Hash
          </span>
        </CopyToClipboard>

        <div className="flex items-center gap-2">
          {renderRationaleButton()}
          <ViewExternalGovAction
            actionId={item?.gov_action_proposal_id}
            txHash={item?.txHash || (item as any)?.tx_hash}
            govActionHash={(item as any)?.govActionHash || (item as any)?.gov_action_hash || (item as any)?.proposal?.anchorHash}
            txIndex={Number((item as any)?.gov_action_proposal_index) || 0}
            minimal
          />
        </div>
      </div>
    </Box>
  );
};

export default DrepVoteTimelineCard;

const UniformCardWrapper = ({ children }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {children}
  </div>
);

export { UniformCardWrapper };
