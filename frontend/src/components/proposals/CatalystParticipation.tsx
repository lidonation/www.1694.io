import { Box, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { CxProposalsMetrics } from '../../../types/api';

type CatalystParticipationProps = {
  metrics: CxProposalsMetrics;
  isLoading: boolean;
};
const CatalystParticipation = ({
  metrics,
  isLoading,
}: CatalystParticipationProps) => {
  if (isLoading) {
    return (
      <Box className="mx-auto w-full max-w-4xl py-8">
        <h2 className="mb-6 text-center text-xl font-semibold">
          Catalyst Participation:
        </h2>
        
        <Box className="overflow-hidden rounded-xl border border-blue-100">
          <Box className="grid grid-cols-1 divide-y divide-blue-100">
            <Box className="px-3 py-1">
              <Skeleton height={42} />
            </Box>
            <Box className="px-3 py-1">
              <Skeleton height={42} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box className="mx-auto w-full max-w-4xl py-8">
      <h2 className="mb-6 text-center text-xl font-semibold">
        Catalyst Participation:
      </h2>

      {!metrics || typeof metrics === 'undefined' || !metrics?.proposals ? (
        <Box className="overflow-hidden rounded-xl border border-blue-100 px-3 py-2 text-center">
          <Typography variant="subtitle2" fontWeight="semi-bold">
            Unknown
          </Typography>
        </Box>
      ) : (
        <Box className="overflow-hidden rounded-xl border border-blue-100">
          <Box className="grid grid-cols-1 divide-y divide-blue-100">
            <Box className="flex items-center justify-center gap-2 px-3 py-2">
              <Box className="text-sm text-gray-900">
                <span className="font-semibold">Funded</span>
                <span className="text-gray-500">/Total Proposals:</span>
              </Box>
              <Box className="rounded-md bg-gray-100 px-3 py-1 text-base">
                <span>{metrics.funded_proposals}</span>
                <span>/{metrics.proposals}</span>
              </Box>
            </Box>

            <Box className="flex items-center justify-center gap-2 px-3 py-2">
              <Box className="text-sm text-gray-900">
                <span className="font-medium">Completed</span>
                <span className="text-gray-500">/Outstanding Proposals</span>
              </Box>
              <Box className="rounded-md bg-gray-100 px-3 py-1 text-base">
                <span>{metrics.completed_proposals}</span>
                <span>/{metrics.outstanding_proposals}</span>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CatalystParticipation;
