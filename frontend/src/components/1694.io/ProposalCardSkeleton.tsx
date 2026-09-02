'use client';
import {
  Card,
  CardContent,
  Skeleton,
  Box,
  Chip,
  CardActions,
  Typography,
} from '@mui/material';
import React from 'react';

function ProposalCardSkeleton() {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Skeleton width={160} height={24} />
            <Skeleton width={80} height={14} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        <Box>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={40} />
        </Box>

        <Box>
          <Skeleton width="50%" height={20} />
          <Chip
            label={<Skeleton width={40} />}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box>
          <Skeleton width="30%" height={20} />
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={20} />
        </Box>

        <Box>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={40} />
        </Box>
      </CardContent>

      <CardActions
        sx={{
          px: 2,
          pb: 2,
          mt: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton width={80} height={20} />
        <Skeleton width={90} height={36} />
      </CardActions>
    </Card>
  );
}

export default ProposalCardSkeleton;
