'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Slide,
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
  Yes:     { badge: 'bg-success/20 text-green-700',           Icon: CheckCircleOutline },
  No:      { badge: 'bg-red-100 text-red-700',                Icon: HighlightOff },
  Abstain: { badge: 'bg-complementary-100 text-complementary-400', Icon: RemoveCircleOutline },
};

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

interface ProposalContentOverlayProps {
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          {/* Vote badge + type */}
          <div className="flex flex-wrap items-center gap-2">
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
          {/* Title */}
          <h2 className="text-sm font-bold leading-snug text-titles">
            {title || '—'}
          </h2>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
          <Close fontSize="small" />
        </IconButton>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-50 bg-gray-50/60 px-5 py-2.5 text-[10px] text-gray-500">
        {!thresholds.isInfoAction && thresholds.dvt !== null && (
          <span>
            <span className="font-semibold text-gray-600">{thresholds.dvtLabel ?? 'DRep'}</span>
            {' ≥'}{thresholds.dvt}%
            {thresholds.pvt !== null && (
              <span className="text-gray-400">  ·  SPO ≥{thresholds.pvt}%</span>
            )}
          </span>
        )}
        {thresholds.isInfoAction && (
          <span className="italic text-gray-400">No ratification threshold</span>
        )}
        {expirationEpoch != null && (
          <span>
            Expires Ep. <span className="font-semibold text-gray-700">{expirationEpoch}</span>
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {!hasContent && (
          <p className="px-5 py-8 text-center text-sm text-gray-400 italic">
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

      {/* Footer: hash copy + external links */}
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
