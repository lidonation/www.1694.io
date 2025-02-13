'use client';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import DynamicDRepProfileCard from '@/components/atoms/DynamicDRepProfileCard';
import DrepTimeline from '@/components/molecules/DrepTimeline';
import Loading from '../loading';

const Page = () => {
  const { drepid } = useParams();
  const { dRep, isDRepLoading } = useGetSingleDRepQuery(drepid.toString());

  if (isDRepLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="lg:sticky lg:top-10 lg:w-[30%] lg:self-start lg:!scroll-smooth">
        <DynamicDRepProfileCard
          drep={dRep}
          voterId={drepid.toString()}
          loading={isDRepLoading}
        />
      </div>
      <div className="lg:w-[70%]">
        <Suspense>
          <DrepTimeline drep={dRep} />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;