'use client';
import React from 'react';
import CopyToClipBoardIcon from '../atoms/svgs/CopyToClipBoardIcon';
import { Box, Typography } from '@mui/material';

const DRepVoteCard = ({
  name,
  drepId,
  influence,
  votingPower,
  voteTime,
  isPositive,
  vote,
}) => {
  return (
    <Box className="py-4">
      <Box className="mb-1 flex items-center">
        <h2 className="mr-1 text-base font-bold text-gray-800">{name}</h2>
        <span className="text-gray-600 text-sm">- Vote: {vote}</span>
      </Box>

      <Box className="mb-3 flex items-center text-gray-600">
        <span className="max-w-1/3 truncate text-sm">{drepId}</span>
        <CopyToClipBoardIcon width={18} height={18} />
      </Box>

      <Box className="mb-2 flex items-center justify-between">
        {isPositive ? (
          <Box className="relative">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-primary-300">
              % Influence ({influence}%)
            </span>
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-blue-100"></span>
          </Box>
        ) : (
          <Box className="flex-1"></Box>
        )}

        {!isPositive && (
          <Box className="relative">
            <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs text-red-800">
              % Influence ({influence}%)
            </span>
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-red-100"></span>
          </Box>
        )}
      </Box>

      <Box className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        {isPositive ? (
          <Box
            className="h-full rounded-full bg-primary-300"
            style={{ width: `${influence}%` }}
          ></Box>
        ) : (
          <Box className="flex h-full w-full justify-end">
            <Box
              className="h-full rounded-full bg-red-600"
              style={{ width: `${influence}%` }}
            ></Box>
          </Box>
        )}
      </Box>

      <Box className="flex items-center text-sm text-gray-700">
        <Typography sx={{ mr: 1, fontSize: 14 }}>Voting Power:</Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
          ₳ {votingPower}
        </Typography>
        <Typography sx={{ mx: 2, fontSize: 14 }}>
          Vote submitted on {voteTime}
        </Typography>
      </Box>
    </Box>
  );
};

export default DRepVoteCard;
