import React from 'react';
import { Skeleton, Box, Stack } from '@mui/material';

const PollResultsSkeleton = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Skeleton variant="text" width={120} height={32} />
      </Box>

      <Skeleton
        variant="rectangular"
        height={16}
        width="100%"
        sx={{ borderRadius: 8, mb: 1 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width={30} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={60} sx={{ opacity: 0.7 }} />
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width={30} />
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={60} sx={{ opacity: 0.7 }} />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Box display="flex" justifyContent="center" className="p-4">
        <Skeleton
          variant="rectangular"
          width={180}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

export default PollResultsSkeleton;
