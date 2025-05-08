'use client';
import { useParams } from 'next/navigation';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import DynamicDRepProfileCard from '@/components/atoms/DynamicDRepProfileCard';
import Loading from './loading';

const Page = () => {
  const { drepid } = useParams();
  const { dRep, isDRepLoading } = useGetSingleDRepQuery(drepid.toString());

  if (isDRepLoading) {
    return <Loading />;
  }

  return (
    <div className="lg:!scroll-smooth">
      <DynamicDRepProfileCard
        drep={dRep}
        voterId={drepid.toString()}
        loading={isDRepLoading}
      />
    </div>
  );
};

export default Page;
