'use client';
import { urls } from '@/constants';
import { Box } from '@mui/material';
import Link from 'next/link';
import React from 'react';

export const ViewExternalGovAction = ({
  actionId,
  txHash,
  govActionHash,
  txIndex = 0,
  minimal = false,
}: {
  actionId: string;
  txHash?: string;
  govActionHash?: string;
  txIndex?: number;
  minimal?: boolean;
}) => {
  return (
    <Box
      className={`flex ${minimal ? 'flex-row items-center gap-2' : 'flex-col gap-1'}`}
    >
      <p
        className={
          minimal ? 'text-[10px] font-bold text-gray-400 uppercase' : 'text-sm'
        }
      >
        View Action on:
      </p>
      <Box className="flex flex-row gap-2">
        <Link
          href={`${urls.govToolUrl}/governance_actions/${actionId}#${txIndex}`}
          target="_blank"
          className={`${minimal ? 'text-[10px]' : 'text-sm'} text-primary-300 hover:font-bold`}
        >
          Govtool
        </Link>
        <Link
          href={`${urls.adaStatUrl}/governances/${txHash || actionId}${txIndex < 10 ? '0' + txIndex : txIndex}`}
          target="_blank"
          className={`${minimal ? 'text-[10px]' : 'text-sm'} text-primary-300 hover:font-bold`}
        >
          ADASTAT
        </Link>
      </Box>
    </Box>
  );
};
