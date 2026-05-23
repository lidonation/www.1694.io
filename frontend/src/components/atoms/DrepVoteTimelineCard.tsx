'use client';
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import CopyToClipboard from './CopyToClipboard';
import { DrepVote } from '../../../types/timeline';
import Button from './Button';
import { VoteRationaleModal, VoteRationaleModalProps } from '../molecules/VoteRationaleModal';
import { GovAction } from '../../../types/api';
import { useWallet } from '@/context/globalContext';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';
import GovernanceLifecycleBadge from './GovernanceLifecycleBadge';
import { ProposalContentOverlay } from './ProposalContentOverlay';
import {
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
  MenuBookOutlined,
} from '@mui/icons-material';

const highlightAnimation = keyframes`
  0%   { box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0,0,0,0.1); border-color: transparent; }
  20%  { box-shadow: 0 0 0 4px var(--highlight-glow), 0 20px 25px -5px rgba(0,0,0,0.2); border-color: var(--highlight-border); }
  100% { box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0,0,0,0.1); border-color: transparent; }
`;

const VOTE_ACCENT: Record<string, { border: string; badge: string; text: string; glow: string; glowBorder: string; Icon: any }> = {
  Yes:     { border: 'border-l-success',           badge: 'bg-success/20 text-green-700',           text: 'text-green-700',           glow: 'rgba(111,223,142,0.35)', glowBorder: '#6fdf8e', Icon: CheckCircleOutline },
  No:      { border: 'border-l-extra_red',          badge: 'bg-red-100 text-red-700',                text: 'text-red-700',             glow: 'rgba(255,77,77,0.3)',   glowBorder: '#ff4d4d', Icon: HighlightOff },
  Abstain: { border: 'border-l-complementary-200',  badge: 'bg-complementary-100 text-complementary-400', text: 'text-complementary-400', glow: 'rgba(160,211,224,0.35)', glowBorder: '#a0d3e0', Icon: RemoveCircleOutline },
};

const TYPE_CHIP: Record<string, { bg: string; label: string }> = {
  parameterchange:     { bg: 'bg-secondary-100 text-secondary-400',       label: 'Protocol Params' },
  noconfidence:        { bg: 'bg-red-50 text-red-600',                    label: 'No Confidence' },
  infoaction:          { bg: 'bg-primary-100 text-primary-400',            label: 'Info' },
  hardforkinitiation:  { bg: 'bg-complementary-100 text-complementary-400', label: 'Hard Fork' },
  newconstitution:     { bg: 'bg-general-100 text-general-400',            label: 'New Constitution' },
  newcommittee:        { bg: 'bg-extra_gray text-primary-400',             label: 'Update Committee' },
  updatecommittee:     { bg: 'bg-extra_gray text-primary-400',             label: 'Update Committee' },
  treasurywithdrawals: { bg: 'bg-secondary-100 text-secondary-400',       label: 'Treasury Withdrawal' },
};

function getTypeChip(tag: string | null | undefined) {
  if (!tag) return null;
  const key = tag.toLowerCase().replace(/[_\s]/g, '');
  for (const [pattern, chip] of Object.entries(TYPE_CHIP)) {
    if (key.includes(pattern)) return chip;
  }
  return null;
}

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

interface DrepVoteTimelineCardProps {
  item: DrepVote | GovAction;
  isVoteOwner?: boolean;
  minimal?: boolean;
}

const DrepVoteTimelineCard = ({
  item,
  isVoteOwner = false,
  minimal = false,
}: DrepVoteTimelineCardProps) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [rationaleModalOptions, setRationalModalOptions] = useState<VoteRationaleModalProps>({
    mode: 'view', open: false, onClose: () => {}, onEdit: () => {}, rationaleUrl: item?.vote_rationale,
  });

  const elementId = `vote-${(item as any)?.id || (item as any)?.vote_tx_hash || (item as any)?.gov_action_proposal_id}`;

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

  const { latestEpoch } = useWallet();
  const { epochParams } = useEpochParamsQuery();

  const voteKey = item.vote?.charAt(0).toUpperCase() + item.vote?.slice(1).toLowerCase() || 'Abstain';
  const accent = VOTE_ACCENT[voteKey] ?? VOTE_ACCENT.Abstain;

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

  const title =
    (item as DrepVote).proposal?.title ||
    (item as any)?.metadata?.body?.title ||
    proposalMetadata?.body?.title ||
    proposalMetadata?.title;

  const tag = (item as DrepVote).proposal?.type || (item?.type as string) || proposalMetadata?.type || proposalMetadata?.body?.type;
  const typeChip = getTypeChip(tag);

  const rawAbstract = (item as DrepVote).proposal?.abstract || proposalMetadata?.body?.abstract || proposalMetadata?.abstract;
  const abstract = rawAbstract && !URL_ONLY.test(rawAbstract.trim()) ? rawAbstract : null;

  const rawRationale = (item as DrepVote).proposal?.rationale || proposalMetadata?.body?.rationale || proposalMetadata?.rationale;
  const rationale = rawRationale && !URL_ONLY.test(rawRationale.trim()) ? rawRationale : null;

  const isEnacted = item?.enacted_epoch && latestEpoch > item?.enacted_epoch;
  const isExpired = item?.expiration_epoch && latestEpoch > item?.expiration_epoch;

  const handleRationaleModalClose = () =>
    setRationalModalOptions((prev) => ({ ...prev, open: false }));

  const govActionHash = (item as any)?.govActionHash || (item as any)?.gov_action_hash || (item as any)?.proposal?.anchorHash;
  const txHash = item?.txHash || (item as any)?.tx_hash;

  // ── MINIMAL MODE ────────────────────────────────────────────────────────────
  if (minimal) {
    return (
      <Box
        id={elementId}
        className={`flex w-full flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm border-l-4 ${accent.border}`}
        sx={{
          '--highlight-glow': accent.glow,
          '--highlight-border': accent.glowBorder,
          ...(isHighlighted && { animation: `${highlightAnimation} 2s ease-out forwards` }),
        }}
      >
        {/* Row 1: vote badge + date */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accent.badge}`}>
            <accent.Icon sx={{ fontSize: 11 }} />
            <span>{voteKey}</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {new Date(item?.time_voted).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Row 2: title */}
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-titles">
          {title || '—'}
        </p>

        {/* Row 3: type chip + lifecycle badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          {typeChip && (
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${typeChip.bg}`}>
              {typeChip.label}
            </span>
          )}
          <GovernanceLifecycleBadge status={lifecycleStatus} minimal />
          {thresholds.dvt !== null && !thresholds.isInfoAction && (
            <span className="text-[9px] text-gray-400">
              DRep ≥<span className="font-semibold text-gray-600">{thresholds.dvt}%</span>
            </span>
          )}
          {item?.expiration_epoch != null && (
            <span className="text-[9px] text-gray-400">
              Ep. <span className="font-semibold text-gray-600">{item.expiration_epoch}</span>
            </span>
          )}
        </div>

        {/* Row 4: single Read button */}
        <button
          onClick={() => setOverlayOpen(true)}
          className="flex items-center gap-1 self-start rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold text-primary-300 hover:bg-primary-100"
        >
          <MenuBookOutlined sx={{ fontSize: 11 }} />
          Read
        </button>

        <ProposalContentOverlay
          open={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          title={title || '—'}
          vote={voteKey}
          abstract={abstract}
          proposalRationale={rationale}
          voteRationaleUrl={item?.vote_rationale}
          type={tag}
          lifecycleStatus={lifecycleStatus}
          thresholds={thresholds}
          expirationEpoch={item?.expiration_epoch ?? null}
          govActionHash={govActionHash}
          govActionId={(item as any)?.gov_action_proposal_id}
          txHash={txHash}
          txIndex={Number((item as any)?.gov_action_proposal_index) || 0}
        />
      </Box>
    );
  }

  // ── NORMAL MODE ─────────────────────────────────────────────────────────────
  return (
    <Box
      id={elementId}
      className={`flex w-full flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm border-l-4 ${accent.border}`}
      sx={{
        '--highlight-glow': accent.glow,
        '--highlight-border': accent.glowBorder,
        ...(isHighlighted && { animation: `${highlightAnimation} 2s ease-out forwards` }),
      }}
    >
      {/* Row 1: vote badge + date */}
      <div className="flex items-center justify-between gap-2">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accent.badge}`}>
          <accent.Icon sx={{ fontSize: 14 }} />
          <span>{voteKey}</span>
        </div>
        <span className="text-[11px] text-gray-400">
          {new Date(item?.time_voted).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Row 2: title */}
      <p className="text-sm font-semibold leading-snug text-titles">
        {title || '—'}
      </p>

      {/* Row 3: type chip + lifecycle + thresholds + expiration */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-gray-500">
        {typeChip && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${typeChip.bg}`}>
            {typeChip.label}
          </span>
        )}
        <GovernanceLifecycleBadge status={lifecycleStatus} />
        {thresholds.isInfoAction ? (
          <span className="italic text-gray-400">No ratification threshold</span>
        ) : thresholds.dvt !== null && (
          <span>
            <span className="font-semibold text-gray-600">{thresholds.dvtLabel ?? 'DRep'}</span>
            {' ≥'}{thresholds.dvt}%
            {thresholds.pvt !== null && (
              <span className="text-gray-400">  ·  SPO ≥{thresholds.pvt}%</span>
            )}
          </span>
        )}
        {epochParams?.gov_action_lifetime != null && (
          <span>
            Active <span className="font-semibold text-gray-600">{epochParams.gov_action_lifetime}</span> epochs
          </span>
        )}
        {item?.expiration_epoch != null && (
          <span>
            Expires Ep. <span className="font-semibold text-gray-700">{item.expiration_epoch}</span>
          </span>
        )}
      </div>

      {/* Footer: hash + read button + govtool */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-3">
        <CopyToClipboard text={govActionHash || txHash} truncate>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-gray-400 hover:text-gray-600">
            <img src="/svgs/copy.svg" alt="copy" className="h-2.5 w-2.5 opacity-50" />
            Hash
          </span>
        </CopyToClipboard>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOverlayOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-300 hover:bg-primary-100"
          >
            <MenuBookOutlined sx={{ fontSize: 13 }} />
            Read Rationale
          </button>

          {!item?.vote_rationale && isVoteOwner && !isEnacted && !isExpired && (
            <Button
              handleClick={() => setRationalModalOptions({
                mode: 'edit',
                open: true,
                onClose: handleRationaleModalClose,
                rationaleUrl: item?.vote_rationale,
                extraData: {
                  vote: item?.vote,
                  voteTxHash: item?.gov_action_proposal_id,
                  voteTxIndex: Number(item?.gov_action_proposal_index) || 0,
                  voterId: item?.view,
                  isOwner: isVoteOwner,
                },
              })}
              color="primary"
              size="small"
            >
              Add Rationale
            </Button>
          )}

          <ViewExternalGovAction
            actionId={item?.gov_action_proposal_id}
            txHash={txHash}
            govActionHash={govActionHash}
            txIndex={Number((item as any)?.gov_action_proposal_index) || 0}
            minimal
          />
        </div>
      </div>

      <VoteRationaleModal {...rationaleModalOptions} />

      <ProposalContentOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        title={title || '—'}
        vote={voteKey}
        abstract={abstract}
        proposalRationale={rationale}
        voteRationaleUrl={item?.vote_rationale}
        type={tag}
        lifecycleStatus={lifecycleStatus}
        thresholds={thresholds}
        expirationEpoch={item?.expiration_epoch ?? null}
        govActionHash={govActionHash}
        govActionId={(item as any)?.gov_action_proposal_id}
        txHash={txHash}
        txIndex={Number((item as any)?.gov_action_proposal_index) || 0}
      />
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
