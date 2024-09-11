'use client';
import { useGetNodeStatusQuery } from '@/hooks/useGetNodeStatusQuery';
import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

const PageBanner = () => {
  const { NodeStatus, isLoading, isFetching } = useGetNodeStatusQuery();
  const [nodeStats, setNodeStats] = useState(null);
  useEffect(() => {
    if (NodeStatus) {
      setNodeStats(NodeStatus);
    }
  }, [NodeStatus, isLoading, isFetching]);
  if (!nodeStats || (nodeStats && nodeStats?.behindBy < 30)) return null;
  return (
    <Box component={'div'} className="flex items-center justify-center gap-2">
      <div className="inline-flex items-center gap-1">
        <Typography>Epoch:</Typography>
        <Typography>{nodeStats?.epoch_no || '-'}</Typography>
      </div>
      <div className="inline-flex items-center gap-1">
        <Typography>Slot:</Typography>
        <Typography>{nodeStats?.epoch_slot_no || '-'}</Typography>
      </div>
      <div className="inline-flex items-center gap-1">
        <Typography>Status:</Typography>
        <Typography>
          {nodeStats
            ? nodeStats?.behindBy > 30
              ? 'Lagging'
              : 'Following'
            : '-'}
        </Typography>
      </div>
      <div>
        <Typography variant="caption">
          {nodeStats &&
            `Last updated ${new Date(nodeStats?.time).toLocaleString('en-US')}`}
        </Typography>
      </div>
    </Box>
  );
};

export default PageBanner;
