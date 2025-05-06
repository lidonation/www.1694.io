'use client';
import DrepProfileMetrics from '@/components/molecules/DrepProfileMetrics';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';

const page = () => {
  const { drepid } = useParams();
  return (
    <Box className="min-h-screen">
      <DrepProfileMetrics voterId={drepid.toString()} />
    </Box>
  );
};

export default page;
