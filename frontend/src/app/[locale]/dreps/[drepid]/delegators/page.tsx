'use client';
import DRepDelegators from '@/components/atoms/DRepDelegators';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

const page = () => {
  const { drepid } = useParams();
  return (
    <Box className="min-h-screen">
      <DRepDelegators voterId={drepid.toString()} />
    </Box>
  );
};

export default page;
