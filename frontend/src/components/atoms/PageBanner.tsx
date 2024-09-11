'use client';
import { useGetNodeStatusQuery } from '@/hooks/useGetNodeStatusQuery';
import { Box, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const PageBanner = () => {
  const { NodeStatus, isLoading, isFetching, isError } = useGetNodeStatusQuery();
  const pathname = usePathname();
  const [nodeStats, setNodeStats] = useState(null);
  const dbNonDependentPages = [
    '/',
    '/dreps',
    '/dreps/workflow/profile/new',
    '/dreps/workflow/profile/update',
  ];  
  useEffect(() => {
    if (NodeStatus) {
      setNodeStats(NodeStatus);
    }
  }, [NodeStatus, isLoading, isFetching]);
  const renderStatus = () => {
    if (!nodeStats && !isError) return '-';
    if (nodeStats && !isError) {
      return nodeStats?.behindBy > 30 ? 'Lagging' : 'Following';
    }
    if (isError) return 'Offline';
  };

  if (
    dbNonDependentPages.some(page => pathname == page) ||
    (!isError && (!nodeStats || (nodeStats && nodeStats?.behindBy <= 30)))
  )
    return null;

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
        <Typography
          className={`${renderStatus() === 'Offline' && 'text-extra_red'}`}
        >
          {renderStatus()}
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