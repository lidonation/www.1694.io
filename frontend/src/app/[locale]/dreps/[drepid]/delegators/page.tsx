'use client';
import DrepProfileMetrics from '@/components/molecules/DrepProfileMetrics';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { useParams } from 'next/navigation';

const DelegatorsPage = () => {
  const { drepid } = useParams();
  const { dRep } = useGetSingleDRepQuery(drepid);
  return <DrepProfileMetrics drepMetrics={dRep} />;
};

export default DelegatorsPage;
