'use client';
import DrepProfileMetrics from '@/components/molecules/DrepProfileMetrics';
import { useParams } from 'next/navigation';

const DelegatorsPage = () => {
  const { drepid } = useParams();
  return <DrepProfileMetrics voterId={String(drepid)} />;
};

export default DelegatorsPage;
