'use client';
import VoterDelegationHistory from '@/components/voters/VoterDelegationHistory';
import VoterWalletStats from '@/components/voters/VoterWalletStats';
import { useVoterDataByIdentityQuery } from '@/hooks/useGetVoterDataByIdentityQuery';
import { convertAddressToBech32 } from '@/lib';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';
import React, { useMemo } from 'react';

const page = () => {
  const { voterId } = useParams();

  const convertedVoterId = useMemo(() => {
    return convertAddressToBech32(voterId as string);
  }, [voterId]);

  const { voterData, isVoterDataLoading } =
    useVoterDataByIdentityQuery(convertedVoterId);

  return (
    <Box className="flex min-h-screen w-full flex-col gap-3 bg-white py-4">
      <VoterWalletStats
        voterData={voterData}
        isVoterDataLoading={isVoterDataLoading}
      />
      <hr className="w-[95%] self-center border-t border-green-400" />
      <VoterDelegationHistory
        voterData={voterData}
        isVoterDataLoading={isVoterDataLoading}
      />
    </Box>
  );
};

export default page;
