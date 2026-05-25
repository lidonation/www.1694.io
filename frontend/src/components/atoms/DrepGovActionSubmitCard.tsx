'use client';
import { urls } from '@/constants';
import { useGetProposalsQuery } from '@/hooks/useGetProposalByHashQuery';
import { useEpochParamsQuery } from '@/hooks/useEpochParamsQuery';
import { useWallet } from '@/context/globalContext';
import { getLifecycleStatus, getThresholdsForType } from '@/lib/governanceThresholds';
import GovernanceMetaRow from '@/components/atoms/GovernanceMetaRow';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

const TYPE_CONFIG: Record<string, { cls: string; icon: string; label: string }> = {
  protocolparameter: { cls: 'bg-secondary-100 text-secondary-400', icon: '/svgs/exchange.svg',         label: 'Protocol Parameters' },
  info:              { cls: 'bg-primary-100 text-primary-400',     icon: '/svgs/info-circle.svg',      label: 'Info' },
  hardfork:          { cls: 'bg-complementary-100 text-complementary-400', icon: '/svgs/status-change.svg', label: 'Hard Fork' },
  newconstitution:   { cls: 'bg-general-100 text-general-400',     icon: '/svgs/notebook.svg',         label: 'New Constitution' },
  updatecommittee:   { cls: 'bg-extra_gray text-primary-400',      icon: '/svgs/users-group.svg',      label: 'Update Committee' },
  noconfidence:      { cls: 'bg-red-50 text-red-600',              icon: '/svgs/info-circle.svg',      label: 'No Confidence' },
  treasury:          { cls: 'bg-secondary-100 text-secondary-400', icon: '/svgs/exchange.svg',         label: 'Treasury Withdrawal' },
};

function getTypeConfig(actionType: string | null | undefined) {
  if (!actionType) return null;
  const key = actionType.toLowerCase().replace(/[_\s]/g, '');
  for (const [pattern, cfg] of Object.entries(TYPE_CONFIG)) {
    if (key.includes(pattern)) return cfg;
  }
  return null;
}

const SkeletonLoader = () => (
  <div className="flex animate-pulse flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="h-4 w-2/3 rounded bg-gray-200" />
    <div className="h-3 w-1/3 rounded bg-gray-200" />
    <div className="h-3 w-1/2 rounded bg-gray-200" />
  </div>
);

const NotFoundState = () => (
  <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-white p-4">
    <p className="text-sm font-medium text-red-500">Proposal not found</p>
  </div>
);

const DrepGovActionSubmitCard = ({
  actionTypeParam = '',
  hash = '',
  item,
}: {
  actionTypeParam?: string;
  hash?: string;
  item?: any;
}) => {
  const [cardData, setCardData] = useState(item);
  const [actionType, setActionType] = useState(actionTypeParam);

  const { Proposals, isProposalsLoading } = useGetProposalsQuery({ hashQueryString: hash });
  const { epochParams } = useEpochParamsQuery();
  const { latestEpoch } = useWallet();

  useEffect(() => {
    if (Proposals?.[0]) {
      setCardData(Proposals[0]);
      setActionType(Proposals[0].governanceType || Proposals[0].description?.tag?.toLowerCase() || '');
    }
  }, [Proposals]);

  const typeCfg = getTypeConfig(actionType);

  const lifecycleStatus = getLifecycleStatus({
    ratified_epoch: cardData?.ratifiedEpoch ?? null,
    enacted_epoch: cardData?.enactedEpoch ?? null,
    expired_epoch: cardData?.expiredEpoch ?? null,
    dropped_epoch: cardData?.droppedEpoch ?? null,
    expiration_epoch: cardData?.expirationEpoch ?? null,
  }, latestEpoch);

  const thresholds = getThresholdsForType(cardData?.governanceType || actionType, epochParams);

  if (isProposalsLoading) return <SkeletonLoader />;
  if (!cardData) return <NotFoundState />;

  const date = cardData?.blockTime || cardData?.prop_inception_time;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Header: type chip + date */}
      <div className="flex items-center justify-between">
        {typeCfg ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${typeCfg.cls}`}>
            <img src={typeCfg.icon} className="h-3 w-3" alt="" />
            {typeCfg.label}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
            Governance Action
          </span>
        )}
        {date && (
          <p className="text-[10px] text-gray-400">
            {new Date(date).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Action name */}
      <p className="text-sm font-semibold leading-snug text-titles">
        {typeCfg?.label || actionType || 'Governance Action'}
      </p>

      {/* Lifecycle badge + thresholds + expiration */}
      <GovernanceMetaRow
        status={lifecycleStatus}
        thresholds={thresholds}
        expirationEpoch={cardData?.expirationEpoch ?? null}
        govActionLifetime={epochParams?.gov_action_lifetime ?? null}
      />

      {/* Footer link */}
      <Link
        href={`${urls.govToolUrl}/governance_actions/${hash || cardData?.txHash}#0`}
        target="_blank"
        className="mt-1 text-[11px] font-medium text-primary-300 hover:text-primary-400 hover:underline"
      >
        View on GovTool →
      </Link>
    </div>
  );
};

export default DrepGovActionSubmitCard;
