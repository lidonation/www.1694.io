'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close, CheckCircleOutline, HighlightOff, RemoveCircleOutline } from '@mui/icons-material';
import MarkdownParser from './MarkdownParser';
import GovernanceLifecycleBadge from './GovernanceLifecycleBadge';
import { ViewExternalGovAction } from './ViewExternalGovAction';
import CopyToClipboard from './CopyToClipboard';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import { LifecycleStatus, GovernanceThresholds } from '@/lib/governanceThresholds';

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const VOTE_CFG: Record<string, { badge: string; Icon: any }> = {
  Yes:     { badge: 'bg-success/20 text-green-700',                Icon: CheckCircleOutline },
  No:      { badge: 'bg-red-100 text-red-700',                     Icon: HighlightOff },
  Abstain: { badge: 'bg-complementary-100 text-complementary-400', Icon: RemoveCircleOutline },
};

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ label, value }: { label: string; value: string | number }) => (
  <span className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-1.5 text-center">
    <span className="text-[11px] font-bold text-gray-700">{value}</span>
    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{label}</span>
  </span>
);

// ── Vote bar (stake-weighted) ─────────────────────────────────────────────────
const VoteBar = ({
  yesCount, noCount, abstainCount,
  yesStake, noStake, abstainStake,
  threshold,
}: {
  yesCount: number; noCount: number; abstainCount: number;
  yesStake: number; noStake: number; abstainStake: number;
  threshold: number | null;
}) => {
  const totalCount = yesCount + noCount + abstainCount;
  if (totalCount === 0) return null;

  // Stake-weighted percentages (Cardano ratification formula: yes / (yes + no), abstain excluded)
  const hasStake = yesStake + noStake + abstainStake > 0;
  const votedStake = yesStake + noStake;

  const yesPct = hasStake && votedStake > 0 ? (yesStake / votedStake) * 100 : (yesCount / (yesCount + noCount || 1)) * 100;
  const noPct  = hasStake && votedStake > 0 ? (noStake  / votedStake) * 100 : (noCount  / (yesCount + noCount || 1)) * 100;

  // Bar segments proportional to total stake (or count if no stake data)
  const totalForBar = hasStake ? yesStake + noStake + abstainStake : totalCount;
  const yesBarPct  = totalForBar > 0 ? (hasStake ? yesStake     : yesCount)     / totalForBar * 100 : 0;
  const noBarPct   = totalForBar > 0 ? (hasStake ? noStake      : noCount)      / totalForBar * 100 : 0;
  const absBarPct  = totalForBar > 0 ? (hasStake ? abstainStake : abstainCount) / totalForBar * 100 : 0;

  const thresholdMet = threshold !== null && yesPct >= threshold;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          <span className="font-semibold text-gray-700">{yesCount}</span>
          <span className="text-gray-400">Yes</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{yesPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-extra_red" />
          <span className="font-semibold text-gray-700">{noCount}</span>
          <span className="text-gray-400">No</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{noPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-complementary-200" />
          <span className="font-semibold text-gray-700">{abstainCount}</span>
          <span className="text-gray-400">Abstain</span>
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="absolute left-0 top-0 h-full bg-success"    style={{ width: `${yesBarPct}%` }} />
        <div className="absolute top-0 h-full bg-extra_red"         style={{ left: `${yesBarPct}%`, width: `${noBarPct}%` }} />
        <div className="absolute top-0 h-full bg-complementary-200" style={{ left: `${yesBarPct + noBarPct}%`, width: `${absBarPct}%` }} />
        {threshold !== null && (
          <Tooltip title={`Ratification threshold: ${threshold}%`} placement="top" arrow>
            <div
              className="absolute top-0 h-full w-0.5 cursor-default bg-gray-700/70"
              style={{ left: `${threshold}%` }}
            />
          </Tooltip>
        )}
      </div>

      {threshold !== null && (
        <p className="text-[11px] text-gray-500">
          Threshold <span className="font-semibold text-gray-700">{threshold}%</span>
          {thresholdMet && (
            <span className="ml-2 font-semibold text-green-600">✓ Threshold met</span>
          )}
        </p>
      )}
    </div>
  );
};

// ── Main overlay ──────────────────────────────────────────────────────────────
export interface ProposalContentOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  vote: string;
  abstract?: string | null;
  proposalRationale?: string | null;
  voteRationaleUrl?: string | null;
  type?: string | null;
  lifecycleStatus: LifecycleStatus;
  thresholds: GovernanceThresholds;
  expirationEpoch?: number | null;
  startEpoch?: number | null;
  govActionLifetime?: number | null;
  yesCount?: number;
  noCount?: number;
  abstainCount?: number;
  yesStake?: number;
  noStake?: number;
  abstainStake?: number;
  govActionHash?: string | null;
  govActionId?: string | null;
  txHash?: string | null;
  txIndex?: number;
}

export const ProposalContentOverlay = ({
  open,
  onClose,
  title,
  vote,
  abstract,
  proposalRationale,
  voteRationaleUrl,
  type,
  lifecycleStatus,
  thresholds,
  expirationEpoch,
  startEpoch,
  govActionLifetime,
  yesCount = 0,
  noCount = 0,
  abstainCount = 0,
  yesStake = 0,
  noStake = 0,
  abstainStake = 0,
  govActionHash,
  govActionId,
  txHash,
  txIndex = 0,
}: ProposalContentOverlayProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { metadata, isMetadataLoading } = useGetExternalMetadata(voteRationaleUrl ?? null, !!voteRationaleUrl);

  const voteKey = vote?.charAt(0).toUpperCase() + vote?.slice(1).toLowerCase() || 'Abstain';
  const voteCfg = VOTE_CFG[voteKey] ?? VOTE_CFG.Abstain;

  const cleanAbstract = abstract && !URL_ONLY.test(abstract.trim()) ? abstract : null;
  const cleanRationale = proposalRationale && !URL_ONLY.test(proposalRationale.trim()) ? proposalRationale : null;

  const hasContent = cleanAbstract || cleanRationale || voteRationaleUrl;
  const hasVoteCounts = yesCount + noCount + abstainCount > 0;
  const hasEpochInfo = startEpoch != null || expirationEpoch != null || govActionLifetime != null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      TransitionComponent={isMobile ? SlideUp : undefined}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? '16px 16px 0 0' : '16px',
          ...(isMobile && {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            top: 'auto',
            margin: 0,
            maxHeight: '92vh',
          }),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Header: title prominent + close; vote badge row below ── */}
      <div className="border-b border-gray-100 px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold leading-snug text-titles">{title || '—'}</h2>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
            <Close fontSize="small" />
          </IconButton>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${voteCfg.badge}`}>
            <voteCfg.Icon sx={{ fontSize: 14 }} />
            <span>{voteKey}</span>
          </div>
          {type && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {type}
            </span>
          )}
          <GovernanceLifecycleBadge status={lifecycleStatus} />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>

        {/* Epoch stat chips */}
        {hasEpochInfo && (
          <div className="flex flex-wrap gap-2 border-b border-gray-50 px-5 py-3">
            {startEpoch != null && (
              <StatChip label="Voting Start" value={`Epoch ${startEpoch}`} />
            )}
            {expirationEpoch != null && (
              <StatChip label="Voting Deadline" value={`Epoch ${expirationEpoch}`} />
            )}
            {govActionLifetime != null && (
              <StatChip label="Active" value={`${govActionLifetime} epochs`} />
            )}
            {!thresholds.isInfoAction && thresholds.dvt !== null && (
              <StatChip label={thresholds.dvtLabel ?? 'DRep'} value={`≥${thresholds.dvt}%`} />
            )}
            {thresholds.pvt !== null && (
              <StatChip label="SPO" value={`≥${thresholds.pvt}%`} />
            )}
            {thresholds.isInfoAction && (
              <span className="self-center text-[10px] italic text-gray-400">No ratification threshold</span>
            )}
          </div>
        )}

        {/* Vote breakdown + progress bar */}
        {hasVoteCounts && (
          <div className="border-b border-gray-50 px-5 py-4">
            <VoteBar
              yesCount={yesCount}
              noCount={noCount}
              abstainCount={abstainCount}
              yesStake={yesStake}
              noStake={noStake}
              abstainStake={abstainStake}
              threshold={thresholds.isInfoAction ? null : thresholds.dvt}
            />
          </div>
        )}

        {/* Proposal content sections */}
        {!hasContent && (
          <p className="px-5 py-8 text-center text-sm italic text-gray-400">
            No proposal content available.
          </p>
        )}

        {cleanAbstract && (
          <div className="border-b border-gray-50 px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Abstract</p>
            <div className="text-sm leading-relaxed text-gray-700">
              <MarkdownParser text={cleanAbstract} />
            </div>
          </div>
        )}

        {cleanRationale && (
          <div className="border-b border-gray-50 px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Proposal Rationale</p>
            <div className="text-sm leading-relaxed text-gray-700">
              <MarkdownParser text={cleanRationale} />
            </div>
          </div>
        )}

        {voteRationaleUrl && (
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vote Rationale</p>
            {isMetadataLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
            ) : metadata?.body ? (
              <div className="text-sm leading-relaxed text-gray-700">
                <MarkdownParser text={typeof metadata.body === 'string' ? metadata.body : JSON.stringify(metadata.body, null, 2)} />
              </div>
            ) : (
              <p className="text-xs italic text-gray-400">Could not load external rationale.</p>
            )}
          </div>
        )}
      </DialogContent>

      {/* ── Footer: copy hash + external links ── */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <CopyToClipboard text={govActionHash || txHash} truncate>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-gray-400 hover:text-gray-600">
            <img src="/svgs/copy.svg" alt="copy" className="h-2.5 w-2.5 opacity-50" />
            Copy Hash
          </span>
        </CopyToClipboard>
        <ViewExternalGovAction
          actionId={govActionId}
          txHash={txHash}
          govActionHash={govActionHash}
          txIndex={txIndex}
          minimal
        />
      </div>
    </Dialog>
  );
};
