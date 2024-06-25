import { Typography } from '@mui/material';
import React from 'react';
import DrepProfileWalletStats from '../atoms/DrepProfileWalletStats';
import DrepEpochVotingMetrics from '../atoms/DrepEpochVotingMetrics';
import DrepDelegatorslist from '../atoms/DrepDelegatorsList';

const DrepProfileMetrics = () => {
  return (
    <div className='bg-white p-5 flex flex-col gap-3'>
      <Typography variant="h4">Delegator Metrics</Typography>
      <DrepProfileWalletStats />
      <hr />
      <DrepEpochVotingMetrics />
      <hr />
      <DrepDelegatorslist />
    </div>
  );
};

export default DrepProfileMetrics;