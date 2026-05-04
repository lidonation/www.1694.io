'use client';
import React from 'react';
import { Box, Skeleton } from '@mui/material';

const ProfileSkeletonLoader = () => {
  return (
    <Box className="flex flex-col gap-8">
      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={24} />
      </Box>

      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={24} />
      </Box>

      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={24} />
      </Box>

      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
      </Box>

      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
      </Box>

      <Box className="flex flex-col gap-2">
        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={24}
          sx={{ mb: 1 }}
        />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={35} />
      </Box>
    </Box>
  );
};

export default ProfileSkeletonLoader;
