'use client';
import DrepProfileCard from '@/components/atoms/DrepProfileCard';
import { Suspense } from 'react';
import DrepTimeline from '@/components/molecules/DrepTimeline';
import { useCardano } from '@/context/walletContext';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { useParams } from 'next/navigation';
import DrepClaimProfileCard from '@/components/atoms/DrepClaimProfileCard';

const page = () => {
  const { latestEpoch } = useCardano();
  const { drepid } = useParams();
  const { dRep, isDRepLoading } = useGetSingleDRepQuery(drepid);

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="lg:w-[30%]">
        {dRep?.drep_id ? (
          <DrepProfileCard drep={dRep} state={isDRepLoading} />
        ) : (
          <DrepClaimProfileCard drep={dRep} state={isDRepLoading} />
        )}
      </div>
      <div className="lg:w-[70%]">
        <Suspense>
          <DrepTimeline
            drepId={dRep?.drep_id || dRep?.cexplorerDetails?.view}
            latestEpoch={latestEpoch}
            cexplorerDetails={dRep?.cexplorerDetails}
            activity={dRep?.activity}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default page;