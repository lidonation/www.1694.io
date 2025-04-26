import React from 'react';
import { Box, Skeleton } from '@mui/material';
import PollResultsSkeleton from './PollResultsSkeleton';

const ProposalIdentityLoader = () => {
  return (
    <Box className="rounded-md bg-white p-6 shadow-sm">
      <Skeleton variant="text" width="75%" height={40} />
      <Box className="mt-2 mb-3 flex items-center">
        <Skeleton variant="text" width={120} height={20} />
        <span className="mx-3 text-gray-400">•</span>
        <Skeleton variant="text" width={120} height={20} />
        <span className="mx-3 text-gray-400">•</span>
        <Skeleton variant="text" width={120} height={20} />
      </Box>
      <PollResultsSkeleton />
      <Box className="flex items-center gap-6 border-t py-3">
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="text" width={120} height={28} />
      </Box>
    </Box>
  );
};

export default ProposalIdentityLoader;
