'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { Skeleton, Tooltip } from '@mui/material';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import CopyToClipboard from '@/components/atoms/CopyToClipboard';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';
import { useGetGovernanceActionQuery } from '@/hooks/useGetGovernanceActionQuery';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';

const ACTION_LABELS: Record<string, string> = {
  hard_fork_initiation: 'Hard Fork Initiation',
  new_committee: 'Update Committee',
  new_constitution: 'New Constitution',
  info_action: 'Info Action',
  no_confidence: 'No Confidence',
  parameter_change: 'Protocol Parameter Change',
  treasury_withdrawals: 'Treasury Withdrawal',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl bg-white p-6 shadow-sm ${className}`}>{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</p>
);

const VoteBar = ({
  label,
  yes = 0,
  no = 0,
  abstain = 0,
}: {
  label: string;
  yes?: number;
  no?: number;
  abstain?: number;
}) => {
  const total = yes + no + abstain;
  const yesPct = total ? (yes / total) * 100 : 0;
  const noPct = total ? (no / total) * 100 : 0;
  const abstainPct = total ? (abstain / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-[10px] text-gray-400">{total.toLocaleString()} total</span>
      </div>
      <Tooltip
        title={`Yes ${Math.round(yesPct)}% · No ${Math.round(noPct)}% · Abstain ${Math.round(abstainPct)}%`}
        placement="top"
        arrow
      >
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bar_back cursor-default">
          <div className="bg-success transition-all" style={{ width: `${yesPct}%` }} />
          <div className="bg-extra_red transition-all" style={{ width: `${noPct}%` }} />
          <div className="bg-complementary-200 transition-all" style={{ width: `${abstainPct}%` }} />
        </div>
      </Tooltip>
      <div className="flex gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          <span className="font-semibold text-gray-800">{yes.toLocaleString()}</span>
          <span className="text-gray-400">Yes</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-extra_red" />
          <span className="font-semibold text-gray-800">{no.toLocaleString()}</span>
          <span className="text-gray-400">No</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-complementary-200" />
          <span className="font-semibold text-gray-800">{abstain.toLocaleString()}</span>
          <span className="text-gray-400">Abstain</span>
        </span>
      </div>
    </div>
  );
};

const ThresholdBar = ({
  label,
  threshold,
  yesCount,
  totalCount,
}: {
  label: string;
  threshold: number;
  yesCount: number;
  totalCount: number;
}) => {
  const yesPct = totalCount ? (yesCount / totalCount) * 100 : 0;
  const met = yesPct >= threshold;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={met ? 'font-bold text-success' : 'text-gray-500'}>
          {Math.round(yesPct)}%
          <span className="ml-1 font-normal text-gray-400">/ {threshold}% needed</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-bar_back">
        <div
          className={`h-full transition-all ${met ? 'bg-success' : 'bg-bar'}`}
          style={{ width: `${Math.min(yesPct, 100)}%` }}
        />
        {/* threshold marker */}
        <div
          className="absolute top-0 h-full w-px bg-primary-400 opacity-60"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
};

const EpochStep = ({
  label,
  epoch,
  highlight = false,
}: {
  label: string;
  epoch: number | null | undefined;
  highlight?: boolean;
}) => {
  if (!epoch) return null;
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-center ${highlight ? 'bg-primary-100' : 'bg-extra_gray'}`}>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className={`text-2xl font-bold ${highlight ? 'text-primary-400' : 'text-gray-800'}`}>{epoch}</span>
      <span className="text-[9px] text-gray-400">epoch</span>
    </div>
  );
};

const MetaRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</dt>
    <dd className="text-xs text-gray-700">{value}</dd>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GovernanceActionPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id);

  const { governanceAction: action, isLoading } = useGetGovernanceActionQuery(decodedId);
  const { epochParams } = useEpochParamsQuery();

  const lifecycleStatus = action
    ? getLifecycleStatus({
        ratified_epoch: action.ratifiedEpoch,
        enacted_epoch: action.enactedEpoch,
        expired_epoch: action.expiredEpoch,
        dropped_epoch: action.droppedEpoch,
      })
    : 'active';

  const thresholds = getThresholdsForType(action?.governanceType, epochParams);

  const drepVotes = action?.votes?.drep ?? {};
  const spoVotes = action?.votes?.spo ?? {};
  const ccVotes = action?.votes?.constitutional_committee ?? {};

  const drepTotal = (drepVotes.yes ?? 0) + (drepVotes.no ?? 0) + (drepVotes.abstain ?? 0);
  const spoTotal = (spoVotes.yes ?? 0) + (spoVotes.no ?? 0) + (spoVotes.abstain ?? 0);

  const title =
    action?.metadata?.body?.title ||
    action?.metadata?.body?.abstract ||
    ACTION_LABELS[action?.governanceType] ||
    decodedId;

  const abstract = action?.metadata?.body?.abstract;

  const hasVotes = drepTotal > 0 || spoTotal > 0 || (ccVotes.yes ?? 0) + (ccVotes.no ?? 0) + (ccVotes.abstain ?? 0) > 0;

  return (
    <div className="base_container w-full py-6 space-y-6">
      <BreadCrumbs
        crumbs={[
          { label: 'Governance Actions', href: '/governance-actions' },
          { label: isLoading ? '…' : title, href: `/governance-actions/${id}` },
        ]}
      />

      {/* ── Header ── */}
      <SectionCard>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton variant="text" width="55%" height={36} />
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="80%" height={18} />
            <Skeleton variant="text" width="70%" height={18} />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="text-xl font-bold text-titles wrap-break-word">{title}</h1>
                <p className="text-sm text-gray-400">
                  {ACTION_LABELS[action?.governanceType] ?? action?.governanceType}
                </p>
              </div>
              <GovernanceLifecycleBadge status={lifecycleStatus} />
            </div>

            {abstract && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">{abstract}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ViewExternalGovAction
                actionId={action?.id}
                txHash={action?.txHash}
                txIndex={action?.certIndex ?? 0}
              />
            </div>
          </>
        )}
      </SectionCard>

      {/* ── Vote breakdown + Thresholds ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <SectionCard>
          <SectionTitle>Vote Breakdown</SectionTitle>
          {isLoading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => <Skeleton key={i} variant="rectangular" height={52} className="rounded-xl" />)}
            </div>
          ) : !hasVotes ? (
            <p className="text-sm text-gray-400">No votes recorded yet.</p>
          ) : (
            <div className="space-y-5">
              <VoteBar label="DRep" yes={drepVotes.yes} no={drepVotes.no} abstain={drepVotes.abstain} />
              <VoteBar label="SPO" yes={spoVotes.yes} no={spoVotes.no} abstain={spoVotes.abstain} />
              <VoteBar
                label="Constitutional Committee"
                yes={ccVotes.yes}
                no={ccVotes.no}
                abstain={ccVotes.abstain}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <SectionTitle>Ratification Thresholds</SectionTitle>
          {thresholds.isInfoAction ? (
            <p className="text-sm italic text-gray-400">
              Info actions have no ratification threshold — they pass unconditionally.
            </p>
          ) : isLoading || !epochParams ? (
            <div className="space-y-5">
              <Skeleton variant="rectangular" height={44} className="rounded-xl" />
              <Skeleton variant="rectangular" height={44} className="rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              {thresholds.dvt !== null && (
                <ThresholdBar
                  label={thresholds.dvtLabel ?? 'DRep'}
                  threshold={thresholds.dvt}
                  yesCount={drepVotes.yes ?? 0}
                  totalCount={drepTotal}
                />
              )}
              {thresholds.pvt !== null && (
                <ThresholdBar
                  label="SPO"
                  threshold={thresholds.pvt}
                  yesCount={spoVotes.yes ?? 0}
                  totalCount={spoTotal}
                />
              )}
              {epochParams.gov_action_lifetime && (
                <p className="pt-1 text-[11px] text-gray-400">
                  Ratification window:{' '}
                  <span className="font-semibold text-gray-600">
                    {epochParams.gov_action_lifetime} epochs
                  </span>
                </p>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Epoch timeline ── */}
      <SectionCard>
        <SectionTitle>Epoch Timeline</SectionTitle>
        {isLoading ? (
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={100} height={80} className="rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <EpochStep label="Expires" epoch={action?.expirationEpoch} highlight={lifecycleStatus === 'active'} />
            <EpochStep label="Ratified" epoch={action?.ratifiedEpoch} highlight={lifecycleStatus === 'ratified'} />
            <EpochStep label="Enacted" epoch={action?.enactedEpoch} highlight={lifecycleStatus === 'enacted'} />
            <EpochStep label="Expired" epoch={action?.expiredEpoch} highlight={lifecycleStatus === 'expired'} />
            <EpochStep label="Dropped" epoch={action?.droppedEpoch} highlight={lifecycleStatus === 'dropped'} />
            {!action?.expirationEpoch && !action?.ratifiedEpoch && !action?.enactedEpoch && !action?.expiredEpoch && !action?.droppedEpoch && (
              <p className="text-sm text-gray-400">No epoch data available.</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── On-chain details ── */}
      <SectionCard>
        <SectionTitle>On-chain Details</SectionTitle>
        {isLoading ? (
          <Skeleton variant="rectangular" height={80} className="rounded-xl" />
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetaRow
              label="Action ID"
              value={
                <span className="flex items-center gap-1 font-mono">
                  <span className="truncate">{action?.id ?? '—'}</span>
                  {action?.id && (
                    <CopyToClipboard text={action.id} truncate={false}>
                      <img src="/svgs/copy.svg" alt="copy" className="h-3 w-3 opacity-40" />
                    </CopyToClipboard>
                  )}
                </span>
              }
            />
            <MetaRow
              label="Tx Hash"
              value={
                <span className="flex items-center gap-1 font-mono">
                  <span className="truncate">{action?.txHash ?? '—'}</span>
                  {action?.txHash && (
                    <CopyToClipboard text={action.txHash} truncate={false}>
                      <img src="/svgs/copy.svg" alt="copy" className="h-3 w-3 opacity-40" />
                    </CopyToClipboard>
                  )}
                </span>
              }
            />
            <MetaRow
              label="Deposit"
              value={
                action?.depositLovelace
                  ? `₳ ${(Number(action.depositLovelace) / 1_000_000).toLocaleString()}`
                  : '—'
              }
            />
            <MetaRow
              label="Submitted"
              value={
                action?.blockTime
                  ? new Date(action.blockTime).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
            <MetaRow label="Cert Index" value={action?.certIndex ?? '—'} />
            {action?.returnStakeAddress && (
              <MetaRow
                label="Return Address"
                value={
                  <span className="flex items-center gap-1 font-mono">
                    <span className="truncate">{action.returnStakeAddress}</span>
                    <CopyToClipboard text={action.returnStakeAddress} truncate={false}>
                      <img src="/svgs/copy.svg" alt="copy" className="h-3 w-3 opacity-40" />
                    </CopyToClipboard>
                  </span>
                }
              />
            )}
            {action?.metadata?.url && (
              <MetaRow
                label="Metadata URL"
                value={
                  <a
                    href={action.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-300 hover:font-bold"
                  >
                    {action.metadata.url}
                  </a>
                }
              />
            )}
            {action?.metadata?.hash && (
              <MetaRow
                label="Metadata Hash"
                value={
                  <span className="flex items-center gap-1 font-mono">
                    <span className="truncate">{action.metadata.hash}</span>
                    <CopyToClipboard text={action.metadata.hash} truncate={false}>
                      <img src="/svgs/copy.svg" alt="copy" className="h-3 w-3 opacity-40" />
                    </CopyToClipboard>
                  </span>
                }
              />
            )}
          </dl>
        )}
      </SectionCard>
    </div>
  );
}
