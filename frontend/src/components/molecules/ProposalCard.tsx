import { Box, Typography } from '@mui/material';
import React from 'react';

function ProposalCard({ proposal }: { proposal: any }) {
  return (
    <Box className="flex w-full h-full flex-col gap-3 rounded-xl bg-white p-3 shadow-lg">
      <Box>
        <p className="font-bold mb-3">Proposal benefit</p>
        <p className='line-clamp-3 text-sm'>
          {proposal?.attributes?.bd_psapb?.data?.attributes?.proposal_benefit}
        </p>
      </Box>
    </Box>
  );
}

export default ProposalCard;
