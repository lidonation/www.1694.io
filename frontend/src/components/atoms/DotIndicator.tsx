'use client';
import { Box } from '@mui/material';

const DotIndicator = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 6,
      right: 6,
      width: 10,
      height: 10,
      borderRadius: '50%',
      bgcolor: '#f97316',
    }}
  />
);

export default DotIndicator;
