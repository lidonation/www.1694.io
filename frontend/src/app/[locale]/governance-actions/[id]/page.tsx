'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Box, LinearProgress, Skeleton, Tooltip } from '@mui/material';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import GovernanceLifecycleBadge from '@/components/atoms/GovernanceLifecycleBadge';
import { useGetGovernanceActionQuery } from '@/hooks/useGetGovernanceActionQuery';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import {
  getLifecycleStatus,
  getThresholdsForType,
} from '@/lib/governanceThresholds';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';

const ACTION_LABELS: Record<string, string> = {
  hard_fork_initiation: 'Hard Fork Initiation',
  new_committee: 'Update Committee',
  new_constitution: 'New Constitution',
  info_action: 'Info Action',
  no_confidence: 'No Confidence',
  parameter_change: 'Protocol Parameter Change',
  treasury_withdrawals: 'Treasury Withdrawal',
};

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
  const yesPct = total ? Math.round((yes / total) * 100) : 0;
  const noPct = total ? Math.round((no / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{label}</span>
        <span>{total} votes</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="bg-green-400 transition-all" style={{ width: `${yesPct}%` }} />
        <div className="bg-red-400 transition-all" style={{ width: `${noPct}%` }} />
        <div className="bg-gray-300 transition-all" style={{ width: `${100 - yesPct - noPct}%` }} />
      </div>
      <div className="flex gap-3 text-[10px] text-gray-500">
        <span><span className="font-semibold text-green-600">{yes}</span> Yes</span>
        <span><span className="font-semibold text-red-500">{no}</span> No</span>
        <span><span className="font-semibold text-gray-500">{abstain}</span> Abstain</span>
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
  const yesPct = totalCount ? Math.round((yesCount / totalCount) * 100) : 0;
  const met = yesPct >= threshold;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label} threshold</span>
        <span className={met ? 'font-semibold text-green-600' : 'text-gray-500'}>
          {yesPct}% / {threshold}% required
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all ${met ? 'bg-green-400' : 'bg-blue-400'}`}
          style={{ width: `${Math.min(yesPct, 100)}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-800 opacity-40"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
};

const EpochPill = ({ label, epoch }: { label: string; epoch: number | null }) => {
  if (!epoch) return null;
  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-50 px-4 py-3 text-center">
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="mt-0.5 text-lg font-bold text-gray-800">{epoch}</span>
      <span className="text-[10px] text-gray-400">epoch</span>
    </div>
  );
};

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
    action?.id ||
    '—';

  return (
    <Box>
      <BreadCrumbs
        crumbs={[
          { label: 'Governance Actions', href: '/governance-actions' },
          { label: isLoading ? '...' : title, href: `/governance-actions/${id}` },
        ]}
      />
      <section className="base_container w-full py-6 space-y-6">

        {/* Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-3">
          {isLoading ? (
            <>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="30%" height={20} />
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 break-words">{title}</h1>
                  <p className="text-sm text-gray-500">
                    {ACTION_LABELS[action?.governanceType] ?? action?.governanceType}
                  </p>
                </div>
                <GovernanceLifecycleBadge status={lifecycleStatus} />
              </div>

              {action?.metadata?.body?.abstract && (
                <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                  {action.metadata.body.abstract}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <ViewExternalGovAction
                  actionId={action?.id}
                  txHash={action?.txHash}
                  txIndex={action?.certIndex ?? 0}
                />
                {action?.metadata?.url && (
                  <a
                    href={action.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-gray-600 hover:border-gray-400"
                  >
                    Metadata URL ↗
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Vote counts */}
          <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vote Breakdown</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => <Skeleton key={i} variant="rectangular" height={48} className="rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <VoteBar
                  label="DRep"
                  yes={drepVotes.yes}
                  no={drepVotes.no}
                  abstain={drepVotes.abstain}
                />
                <VoteBar
                  label="SPO"
                  yes={spoVotes.yes}
                  no={spoVotes.no}
                  abstain={spoVotes.abstain}
                />
                <VoteBar
                  label="Constitutional Committee"
                  yes={ccVotes.yes}
                  no={ccVotes.no}
                  abstain={ccVotes.abstain}
                />
              </div>
            )}
          </div>

          {/* Thresholds */}
          <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ratification Thresholds</h2>
            {thresholds.isInfoAction ? (
              <p className="text-sm text-gray-500 italic">Info actions have no ratification threshold.</p>
            ) : isLoading || !epochParams ? (
              <div className="space-y-4">
                <Skeleton variant="rectangular" height={40} className="rounded-lg" />
                <Skeleton variant="rectangular" height={40} className="rounded-lg" />
              </div>
            ) : (
              <div className="space-y-4">
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
                  <p className="text-xs text-gray-400 pt-1">
                    Ratification window: <span className="font-medium text-gray-600">{epochParams.gov_action_lifetime} epochs</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Epoch timeline */}
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Epoch Timeline</h2>
          {isLoading ? (
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" width={90} height={72} className="rounded-lg" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <EpochPill label="Submitted" epoch={action?.blockTime ? undefined : undefined} />
              <EpochPill label="Expires" epoch={action?.expirationEpoch} />
              <EpochPill label="Ratified" epoch={action?.ratifiedEpoch} />
              <EpochPill label="Enacted" epoch={action?.enactedEpoch} />
              <EpochPill label="Expired" epoch={action?.expiredEpoch} />
              <EpochPill label="Dropped" epoch={action?.droppedEpoch} />
            </div>
          )}
        </div>

        {/* On-chain metadata */}
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">On-chain Details</h2>
          {isLoading ? (
            <Skeleton variant="rectangular" height={80} className="rounded-lg" />
          ) : (
            <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">Action ID</dt>
                <dd className="break-all font-mono text-xs text-gray-700">{action?.id ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">Tx Hash</dt>
                <dd className="break-all font-mono text-xs text-gray-700">{action?.txHash ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">Deposit</dt>
                <dd className="text-xs text-gray-700">
                  {action?.depositLovelace
                    ? `₳ ${(Number(action.depositLovelace) / 1_000_000).toLocaleString()}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-gray-400">Submitted</dt>
                <dd className="text-xs text-gray-700">
                  {action?.blockTime
                    ? new Date(action.blockTime).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
          )}
        </div>

      </section>
    </Box>
  );
}
