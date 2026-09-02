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
import {
  Close,
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
} from '@mui/icons-material';
import MarkdownParser from './MarkdownParser';
import GovernanceLifecycleBadge from './GovernanceLifecycleBadge';
import { ViewExternalGovAction } from './ViewExternalGovAction';
import CopyToClipboard from './CopyToClipboard';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import {
  LifecycleStatus,
  GovernanceThresholds,
  getThresholdsForType,
} from '@/lib/governanceThresholds';
import { shortNumber } from '@/lib/utils';

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const VOTE_CFG: Record<
  string,
  {
    badge: string;
    Icon: any;
    rationaleAccent: string;
    rationaleBg: string;
    labelColor: string;
  }
> = {
  Yes: {
    badge: 'bg-success/20 text-green-700',
    Icon: CheckCircleOutline,
    rationaleAccent: 'border-l-success',
    rationaleBg: 'bg-success/5',
    labelColor: 'text-green-600',
  },
  No: {
    badge: 'bg-red-100 text-red-700',
    Icon: HighlightOff,
    rationaleAccent: 'border-l-extra_red',
    rationaleBg: 'bg-red-50/60',
    labelColor: 'text-red-500',
  },
  Abstain: {
    badge: 'bg-complementary-100 text-complementary-400',
    Icon: RemoveCircleOutline,
    rationaleAccent: 'border-l-complementary-200',
    rationaleBg: 'bg-complementary-50/50',
    labelColor: 'text-complementary-400',
  },
};

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

// CIP-100 vote rationale anchors use a "body.comment" field with escaped \n sequences.
// We extract the comment (or any text field), then unescape literal \n so they render as real newlines.
function extractRationaleText(body: unknown): string {
  if (typeof body === 'string') return body.replace(/\\n/g, '\n');
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const candidate = b.comment ?? b.text ?? b.rationale ?? b.body ?? b.content;
    if (typeof candidate === 'string') return candidate.replace(/\\n/g, '\n');
    // Last resort: pretty-print but convert escaped newlines back to real ones
    return JSON.stringify(b, null, 2).replace(/\\n/g, '\n');
  }
  return String(body);
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <span className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-1.5 text-center">
    <span className="text-[11px] font-bold text-gray-700">{value}</span>
    <span className="text-[9px] font-medium tracking-wider text-gray-400 uppercase">
      {label}
    </span>
  </span>
);

const fmtAda = (ada: number) => `₳${shortNumber(ada, 2)}`;

// ── Vote bar ──────────────────────────────────────────────────────────────────
const VoteBar = ({
  yesCount,
  noCount,
  abstainCount,
  yesStake,
  noStake,
  abstainStake,
  totalActiveDRepStake,
  threshold,
}: {
  yesCount: number;
  noCount: number;
  abstainCount: number;
  yesStake: number;
  noStake: number;
  abstainStake: number;
  totalActiveDRepStake?: number;
  threshold: number | null;
}) => {
  const total = yesCount + noCount + abstainCount;
  if (total === 0) return null;

  const votedTotal = yesStake + noStake + abstainStake;
  const hasStake = votedTotal > 0;
  const hasActive =
    hasStake && totalActiveDRepStake && totalActiveDRepStake > 0;

  const pct = (n: number) =>
    hasActive ? (n / totalActiveDRepStake!) * 100 : 0;
  const yesPct = hasActive ? pct(yesStake) : (yesCount / (total || 1)) * 100;
  const noPct = hasActive ? pct(noStake) : (noCount / (total || 1)) * 100;
  const abstainPct = hasActive
    ? pct(abstainStake)
    : (abstainCount / (total || 1)) * 100;
  const notVoted = hasActive
    ? Math.max(0, totalActiveDRepStake! - votedTotal)
    : 0;
  const notVotedPct = hasActive ? pct(notVoted) : 0;

  const thresholdMet = threshold !== null && yesPct >= threshold;

  return (
    <div className="space-y-2.5">
      {hasActive && (
        <p className="text-[10px] text-gray-400">
          <span className="font-semibold text-gray-600">
            {fmtAda(totalActiveDRepStake!)}
          </span>{' '}
          eligible DRep stake
        </p>
      )}

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="bg-success absolute top-0 left-0 h-full"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="bg-extra_red absolute top-0 h-full"
          style={{ left: `${yesPct}%`, width: `${noPct}%` }}
        />
        <div
          className="bg-complementary-200 absolute top-0 h-full"
          style={{ left: `${yesPct + noPct}%`, width: `${abstainPct}%` }}
        />
        {threshold !== null && (
          <Tooltip
            title={`Ratification threshold: ${threshold}%`}
            placement="top"
            arrow
          >
            <div
              className="absolute top-0 h-full w-0.5 cursor-default bg-gray-700/70"
              style={{ left: `${threshold}%` }}
            />
          </Tooltip>
        )}
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-[11px]">
        <span className="bg-success inline-block h-2 w-2 rounded-full" />
        <span className="text-gray-500">
          Yes{' '}
          <span className="font-semibold text-gray-700">
            {hasStake ? fmtAda(yesStake) : yesCount}
          </span>
        </span>
        <span className="text-right font-semibold text-gray-700">
          {yesPct.toFixed(2)}%
        </span>

        <span className="bg-extra_red inline-block h-2 w-2 rounded-full" />
        <span className="text-gray-500">
          No{' '}
          <span className="font-semibold text-gray-700">
            {hasStake ? fmtAda(noStake) : noCount}
          </span>
        </span>
        <span className="text-right font-semibold text-gray-700">
          {noPct.toFixed(2)}%
        </span>

        <span className="bg-complementary-200 inline-block h-2 w-2 rounded-full" />
        <span className="text-gray-500">
          Abstain{' '}
          <span className="font-semibold text-gray-700">
            {hasStake ? fmtAda(abstainStake) : abstainCount}
          </span>
        </span>
        <span className="text-right font-semibold text-gray-700">
          {abstainPct.toFixed(2)}%
        </span>

        {hasActive && notVoted > 0 && (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-gray-400">
              Not Voted{' '}
              <span className="font-semibold text-gray-500">
                {fmtAda(notVoted)}
              </span>
            </span>
            <span className="text-right font-semibold text-gray-400">
              {notVotedPct.toFixed(2)}%
            </span>
          </>
        )}
      </div>

      {threshold !== null && (
        <p
          className={`text-[11px] font-medium ${thresholdMet ? 'text-green-600' : 'text-gray-500'}`}
        >
          {thresholdMet
            ? '✓ Threshold met'
            : `${yesPct.toFixed(2)}% Yes · ${threshold}% threshold`}
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
  totalActiveDRepStake?: number;
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
  totalActiveDRepStake = 0,
  govActionHash,
  govActionId,
  txHash,
  txIndex = 0,
}: ProposalContentOverlayProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { epochParams } = useEpochParamsQuery();

  const { metadata, isMetadataLoading } = useGetExternalMetadata(
    voteRationaleUrl ?? null,
    !!voteRationaleUrl,
  );

  const voteKey =
    vote?.charAt(0).toUpperCase() + vote?.slice(1).toLowerCase() || 'Abstain';
  const voteCfg = VOTE_CFG[voteKey] ?? VOTE_CFG.Abstain;

  // Fall back to own epoch params if parent passed incomplete data (e.g. not loaded yet)
  const resolvedThresholds: GovernanceThresholds =
    thresholds.dvt !== null || thresholds.isInfoAction
      ? thresholds
      : getThresholdsForType(type, epochParams);

  const resolvedLifetime =
    govActionLifetime ?? epochParams?.gov_action_lifetime ?? null;
  const resolvedStartEpoch =
    startEpoch ??
    (expirationEpoch != null && resolvedLifetime != null
      ? expirationEpoch - resolvedLifetime
      : null);

  const cleanAbstract =
    abstract && !URL_ONLY.test(abstract.trim()) ? abstract : null;
  const cleanRationale =
    proposalRationale && !URL_ONLY.test(proposalRationale.trim())
      ? proposalRationale
      : null;

  const hasContent = cleanAbstract || cleanRationale || voteRationaleUrl;
  const hasVoteCounts = yesCount + noCount + abstainCount > 0;
  const hasEpochInfo =
    resolvedStartEpoch != null ||
    expirationEpoch != null ||
    resolvedLifetime != null ||
    resolvedThresholds.dvt !== null ||
    resolvedThresholds.pvt !== null ||
    resolvedThresholds.isInfoAction;

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
      <div className="border-b border-gray-100 px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-titles text-sm leading-snug font-bold">
            {title || '—'}
          </h2>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ mt: -0.5, flexShrink: 0 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${voteCfg.badge}`}
          >
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
            {resolvedStartEpoch != null && (
              <StatChip
                label="Voting Start"
                value={`Epoch ${resolvedStartEpoch}`}
              />
            )}
            {expirationEpoch != null && (
              <StatChip
                label="Voting Deadline"
                value={`Epoch ${expirationEpoch}`}
              />
            )}
            {resolvedLifetime != null && (
              <StatChip label="Active" value={`${resolvedLifetime} epochs`} />
            )}
            {!resolvedThresholds.isInfoAction &&
              resolvedThresholds.dvt !== null && (
                <StatChip
                  label={resolvedThresholds.dvtLabel ?? 'DRep'}
                  value={`≥${resolvedThresholds.dvt}%`}
                />
              )}
            {resolvedThresholds.pvt !== null && (
              <StatChip label="SPO" value={`≥${resolvedThresholds.pvt}%`} />
            )}
            {resolvedThresholds.isInfoAction && (
              <span className="self-center text-[10px] text-gray-400 italic">
                No ratification threshold
              </span>
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
              totalActiveDRepStake={totalActiveDRepStake}
              threshold={
                resolvedThresholds.isInfoAction ? null : resolvedThresholds.dvt
              }
            />
          </div>
        )}

        {/* Proposal content sections */}
        {!hasContent && (
          <p className="px-5 py-8 text-center text-sm text-gray-400 italic">
            No proposal content available.
          </p>
        )}

        {cleanAbstract && (
          <div className="border-b border-gray-50 px-5 py-4">
            <p className="mb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Abstract
            </p>
            <div className="text-sm leading-relaxed text-gray-700">
              <MarkdownParser text={cleanAbstract} />
            </div>
          </div>
        )}

        {cleanRationale && (
          <div className="border-b border-gray-50 px-5 py-4">
            <p className="mb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Proposal Rationale
            </p>
            <div className="text-sm leading-relaxed text-gray-700">
              <MarkdownParser text={cleanRationale} />
            </div>
          </div>
        )}

        {voteRationaleUrl && (
          <div
            className={`border-l-4 px-5 py-4 ${voteCfg.rationaleAccent} ${voteCfg.rationaleBg}`}
          >
            <p
              className={`mb-2 text-[10px] font-bold tracking-wider uppercase ${voteCfg.labelColor}`}
            >
              DRep Rationale
            </p>
            {isMetadataLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
            ) : metadata?.body ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {extractRationaleText(metadata.body)}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Could not load external rationale.
              </p>
            )}
          </div>
        )}
      </DialogContent>

      {/* ── Footer: copy hash + external links ── */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <CopyToClipboard text={govActionHash || txHash} truncate>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-gray-400 hover:text-gray-600">
            <img
              src="/svgs/copy.svg"
              alt="copy"
              className="h-2.5 w-2.5 opacity-50"
            />
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
