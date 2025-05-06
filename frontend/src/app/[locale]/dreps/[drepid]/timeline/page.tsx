'use client';
import DrepTimeline from '@/components/molecules/DrepTimeline';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';
import React, { Suspense } from 'react';
import Loading from '../loading';

function page() {
  const { drepid } = useParams();
  const { dRep, isDRepLoading } = useGetSingleDRepQuery(drepid.toString());

  if (isDRepLoading) {
    return <Loading />;
  }

  return (
    <Box className="min-h-screen bg-white p-5">
      <Suspense>
        <DrepTimeline drep={dRep} />
      </Suspense>
    </Box>
  );
}

export default page;
