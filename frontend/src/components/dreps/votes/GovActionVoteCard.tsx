'use client';
import MarkdownParser from '@/components/atoms/MarkdownParser';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import { useGetProposalMetadataByHashQuery } from '@/hooks/useGetProposalMetadataByHash';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { useWallet } from '@/context/globalContext';
import { formatIsoTime } from '@/lib';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';
import { Alert, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import {
  CheckCircleOutline,
  HighlightOff,
  RemoveCircleOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';

function extractRationaleText(body: unknown): string {
  if (typeof body === 'string') return body.replace(/\\n/g, '\n');
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const candidate = b.comment ?? b.text ?? b.rationale ?? b.body ?? b.content;
    if (typeof candidate === 'string') return candidate.replace(/\\n/g, '\n');
    return JSON.stringify(b, null, 2).replace(/\\n/g, '\n');
  }
  return String(body);
}

const VOTE_STYLE: Record<string, { border: string; badge: string; Icon: any }> = {
  Yes:     { border: 'border-l-success',           badge: 'bg-success/20 text-green-700',            Icon: CheckCircleOutline },
  No:      { border: 'border-l-extra_red',          badge: 'bg-red-100 text-red-700',                 Icon: HighlightOff },
  Abstain: { border: 'border-l-complementary-200',  badge: 'bg-complementary-100 text-complementary-400', Icon: RemoveCircleOutline },
};

const URL_ONLY = /^(https?:\/\/\S+|proposal\s+as\s+pdf\s*:)/i;

const fmtAda = (ada: number) => {
  if (ada >= 1_000_000_000) return `₳${(ada / 1_000_000_000).toFixed(2)}b`;
  if (ada >= 1_000_000)     return `₳${(ada / 1_000_000).toFixed(2)}m`;
  if (ada >= 1_000)         return `₳${(ada / 1_000).toFixed(1)}k`;
  return `₳${ada.toFixed(0)}`;
};

// ── Vote progress bar ─────────────────────────────────────────────────────────
const VoteBar = ({
  yesCount, noCount, abstainCount,
  yesStake, noStake, abstainStake,
  totalActiveDRepStake,
  threshold,
}: {
  yesCount: number; noCount: number; abstainCount: number;
  yesStake: number; noStake: number; abstainStake: number;
  totalActiveDRepStake?: number;
  threshold: number | null;
}) => {
  const total = yesCount + noCount + abstainCount;
  if (total === 0) return null;

  const hasStake = yesStake + noStake + abstainStake > 0;
  // ADAstat formula: yesStake / totalActiveDRepStake (all active DRep stake as denominator)
  // Falls back to voted-stake ratio, then count-based until voting_power data is backfilled
  const yesPct = hasStake && totalActiveDRepStake && totalActiveDRepStake > 0
    ? (yesStake / totalActiveDRepStake) * 100
    : hasStake && yesStake + noStake > 0
      ? (yesStake / (yesStake + noStake)) * 100
      : (yesCount / (yesCount + noCount || 1)) * 100;
  const noPct = hasStake && totalActiveDRepStake && totalActiveDRepStake > 0
    ? (noStake / totalActiveDRepStake) * 100
    : 100 - yesPct;

  const totalForBar = hasStake ? yesStake + noStake + abstainStake : total;
  const yesBarPct = totalForBar > 0 ? (hasStake ? yesStake     : yesCount)     / totalForBar * 100 : 0;
  const noBarPct  = totalForBar > 0 ? (hasStake ? noStake      : noCount)      / totalForBar * 100 : 0;
  const absBarPct = totalForBar > 0 ? (hasStake ? abstainStake : abstainCount) / totalForBar * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          <span className="font-semibold text-gray-700">{yesCount}</span>
          <span className="text-gray-400">Yes</span>
          {hasStake && <span className="text-gray-500">{fmtAda(yesStake)}</span>}
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{yesPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-extra_red" />
          <span className="font-semibold text-gray-700">{noCount}</span>
          <span className="text-gray-400">No</span>
          {hasStake && <span className="text-gray-500">{fmtAda(noStake)}</span>}
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{noPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-complementary-200" />
          <span className="font-semibold text-gray-700">{abstainCount}</span>
          <span className="text-gray-400">Abstain</span>
          {hasStake && <span className="text-gray-500">{fmtAda(abstainStake)}</span>}
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="absolute left-0 top-0 h-full bg-success"    style={{ width: `${yesBarPct}%` }} />
        <div className="absolute top-0 h-full bg-extra_red"         style={{ left: `${yesBarPct}%`, width: `${noBarPct}%` }} />
        <div className="absolute top-0 h-full bg-complementary-200" style={{ left: `${yesBarPct + noBarPct}%`, width: `${absBarPct}%` }} />
        {threshold !== null && (
          <Tooltip title={`Ratification threshold: ${threshold}%`} placement="top" arrow>
            <div
              className="absolute top-0 h-full w-0.5 cursor-default bg-gray-800/60"
              style={{ left: `${threshold}%` }}
            />
          </Tooltip>
        )}
      </div>

      {threshold !== null && (
        <p className="text-[11px] text-gray-500">
          Threshold <span className="font-semibold text-gray-700">{threshold}%</span>
          {hasStake && yesPct >= threshold && (
            <span className="ml-2 font-semibold text-green-600">✓ Met</span>
          )}
        </p>
      )}
    </div>
  );
};

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ label, value }: { label: string; value: string | number }) => (
  <span className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-1.5 text-center">
    <span className="text-[11px] font-bold text-gray-700">{value}</span>
    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{label}</span>
  </span>
);

// ── Main card ─────────────────────────────────────────────────────────────────
export const GovActionVoteCard = ({ action }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { proposalMetadata } = useGetProposalMetadataByHashQuery({
    hashQueryString: action?.gov_action_proposal_id,
    isRequired: !Boolean(action?.proposal?.title || action?.proposal?.abstract || action?.metadata?.body?.title || action?.title),
  });

  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(action?.vote_rationale, true);
  const { epochParams } = useEpochParamsQuery();
  const { latestEpoch } = useWallet();

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
    expiration_epoch: action?.expiration_epoch,
  }, latestEpoch);

  const thresholds = getThresholdsForType(action?.governance_type || action?.type, epochParams);

  const voteKey = action?.vote?.charAt(0).toUpperCase() + action?.vote?.slice(1).toLowerCase() || 'Abstain';
  const vStyle = VOTE_STYLE[voteKey] ?? VOTE_STYLE.Abstain;

  const yesCount     = action?.drep_yes_count     ?? 0;
  const noCount      = action?.drep_no_count      ?? 0;
  const abstainCount = action?.drep_abstain_count ?? 0;
  const hasVoteCounts = yesCount + noCount + abstainCount > 0;
  const yesStake              = action?.drep_yes_stake          ?? 0;
  const noStake               = action?.drep_no_stake           ?? 0;
  const abstainStake          = action?.drep_abstain_stake      ?? 0;
  const totalActiveDRepStake  = action?.drep_total_active_stake ?? 0;
  const ccYes     = action?.cc_yes_count     ?? 0;
  const ccNo      = action?.cc_no_count      ?? 0;
  const ccAbstain = action?.cc_abstain_count ?? 0;
  const ccTotal   = ccYes + ccNo + ccAbstain;

  // Derive start epoch from expiration and gov_action_lifetime
  const startEpoch =
    action?.expiration_epoch != null && epochParams?.gov_action_lifetime != null
      ? action.expiration_epoch - epochParams.gov_action_lifetime
      : null;

  return (
    <div className={`rounded-xl border border-gray-100 bg-white shadow-sm border-l-4 ${vStyle.border} transition-shadow hover:shadow-md`}>

      {/* ── Stats section (always visible) ──────────────────────────── */}
      <div className="flex flex-col gap-3 p-4">

        {/* Row 1: vote badge · type chip · lifecycle · date + links */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${vStyle.badge}`}>
              <vStyle.Icon sx={{ fontSize: 14 }} />
              <span>{voteKey}</span>
            </div>
            {(action?.governance_type || action?.type) && (
              <span className="rounded-full bg-extra_gray px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {action?.governance_type || action?.type}
              </span>
            )}
            <GovernanceLifecycleBadge status={lifecycleStatus} />
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

        {/* Row 3: epoch stats chips */}
        <div className="flex flex-wrap items-center gap-2">
          {startEpoch !== null && (
            <StatChip label="Voting Start" value={`Epoch ${startEpoch}`} />
          )}
          {action?.expiration_epoch != null && (
            <StatChip label="Voting Deadline" value={`Epoch ${action.expiration_epoch}`} />
          )}
          {epochParams?.gov_action_lifetime != null && (
            <StatChip label="Active" value={`${epochParams.gov_action_lifetime} epochs`} />
          )}
          {thresholds.dvt !== null && !thresholds.isInfoAction && (
            <StatChip label={thresholds.dvtLabel ?? 'DRep Threshold'} value={`≥${thresholds.dvt}%`} />
          )}
          {thresholds.pvt !== null && (
            <StatChip label="SPO Threshold" value={`≥${thresholds.pvt}%`} />
          )}
          {thresholds.isInfoAction && (
            <span className="text-[10px] italic text-gray-400">No ratification threshold</span>
          )}
        </div>

        {/* Row 4: DRep vote breakdown + progress bar */}
        {hasVoteCounts && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DRep Votes</p>
            <VoteBar
              yesCount={yesCount}
              noCount={noCount}
              abstainCount={abstainCount}
              yesStake={yesStake}
              noStake={noStake}
              abstainStake={abstainStake}
              totalActiveDRepStake={totalActiveDRepStake}
              threshold={thresholds.isInfoAction ? null : thresholds.dvt}
            />
          </div>
        )}

        {/* Row 5: CC vote summary */}
        {ccTotal > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CC</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span className="font-semibold text-gray-700">{ccYes}</span>
              <span className="text-gray-400">Yes</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-extra_red" />
              <span className="font-semibold text-gray-700">{ccNo}</span>
              <span className="text-gray-400">No</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-complementary-200" />
              <span className="font-semibold text-gray-700">{ccAbstain}</span>
              <span className="text-gray-400">Abstain</span>
            </span>
            {!thresholds.isInfoAction && ccTotal > 0 && (
              <span className="text-gray-500">
                · {((ccYes / ccTotal) * 100).toFixed(0)}% yes
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Expandable content ───────────────────────────────────────── */}
      {hasExpandableContent && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <span>Details &amp; Rationale</span>
            {isExpanded ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
          </button>

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
                  <div className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {extractRationaleText(metadata.body)}
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
