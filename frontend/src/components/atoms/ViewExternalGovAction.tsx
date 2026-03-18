import { urls } from '@/constants';
import { Box } from '@mui/material';
import Link from 'next/link';
import React from 'react';

export const ViewExternalGovAction = ({ actionId, minimal = false }: { actionId: string, minimal?: boolean }) => {
  return (
    <Box className={`flex ${minimal ? 'flex-row items-center gap-2' : 'flex-col gap-1'}`}>
      <p className={minimal ? 'text-[10px] text-gray-400 font-bold uppercase' : 'text-sm'}>View Action on:</p>
      <Box className="flex flex-row gap-2">
        <Link
          href={`${urls.govToolUrl}/governance_actions/${actionId}#0`}
          target="_blank"
          className={`${minimal ? 'text-[10px]' : 'text-sm'} text-primary-300 hover:font-bold`}
        >
          Govtool
        </Link>
        <Link
          href={`${urls.adaStatUrl}/governances/${actionId}00`}
          target="_blank"
          className={`${minimal ? 'text-[10px]' : 'text-sm'} text-primary-300 hover:font-bold`}
        >
          ADASTAT
        </Link>
      </Box>
    </Box>
  );
};
