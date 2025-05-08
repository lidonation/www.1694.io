import React from 'react';
import { Box, LinearProgress, Skeleton, Typography } from '@mui/material';

interface LinearProgressBarProps {
  primaryValue: number;
  secondaryValue: number;
  primaryPercentage: number;
  secondaryPercentage: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  borderRadius?: number;
  isLoading?: boolean;
  dataAvailability?: boolean;
}

const LinearProgressBar = ({
  primaryValue,
  secondaryValue,
  primaryPercentage,
  secondaryPercentage,
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  primaryColor = '#4caf50',
  secondaryColor = '#f44336',
  height = 30,
  borderRadius = 5,
  isLoading = false,
  dataAvailability,
}: LinearProgressBarProps) => {
  if (isLoading) {
    return (
      <Box
        width="100%"
        height={height}
        sx={{ borderRadius: borderRadius }}
        className="animate-pulse bg-gray-300"
      />
    );
  }
  if (!dataAvailability) {
    return (
      <Typography sx={{ fontSize: 12 }}>
        No data available to display
      </Typography>
    );
  }
  return (
    <Box className="w-full">
      <Box className="relative">
        <LinearProgress
          variant="determinate"
          value={primaryPercentage}
          sx={{
            height: height,
            borderRadius: borderRadius,
            backgroundColor: secondaryColor,
            '& .MuiLinearProgress-bar': {
              backgroundColor: primaryColor,
              borderRadius: borderRadius,
            },
          }}
        />

        <Box className="absolute inset-0 flex items-center justify-between px-4">
          <p className="flex items-center gap-3 text-sm font-semibold text-slate-100">
            {primaryLabel}: {primaryValue} ({primaryPercentage}%)
          </p>
          <p className="flex items-center gap-3 text-sm font-semibold text-slate-100">
            {secondaryLabel}: {secondaryValue} ({secondaryPercentage}%)
          </p>
        </Box>
      </Box>
    </Box>
  );
};

export default LinearProgressBar;
