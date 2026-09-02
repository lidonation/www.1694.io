'use client';
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import { useGetMetricsQuery } from '@/hooks/useGetMetricsQuery';
import { AnimatedCounter } from '../atoms/AnimatedCounter';

const VotingPowerCalculator = () => {
  const [adaAmount, setAdaAmount] = useState<string>('');
  const { metrics, isMetricsLoading } = useGetMetricsQuery();

  const totalVotingPower = metrics?.totalVotingPower || 0;

  const calculateShare = () => {
    const amount = parseFloat(adaAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0 || !totalVotingPower) return 0;
    return (amount / totalVotingPower) * 100;
  };

  const share = calculateShare();

  if (isMetricsLoading) {
    return (
      <Paper
        elevation={0}
        className="animate-pulse rounded-2xl border border-violet-100 bg-violet-50/30 p-6"
      >
        <Box
          sx={{
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography className="text-violet-300">
            Loading network metrics...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      className="rounded-2xl border border-violet-100 bg-violet-50/30 p-6"
    >
      <Typography variant="h6" className="mb-4 font-bold text-violet-900">
        Voting Power Calculator
      </Typography>

      <div className="flex flex-col items-center gap-6 md:flex-row">
        <div className="w-full flex-1">
          <TextField
            fullWidth
            label="Your ADA Amount"
            variant="outlined"
            value={adaAmount}
            onChange={(e) => setAdaAmount(e.target.value)}
            placeholder="e.g. 10,000"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₳</InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'white',
              },
            }}
          />
          <Typography variant="caption" className="mt-2 block text-zinc-500">
            Enter your ADA balance to see your potential governance share.
          </Typography>
        </div>

        <div className="flex min-h-[120px] w-full flex-1 flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="flex items-baseline text-3xl font-black text-violet-600">
            <AnimatedCounter
              value={share}
              format={adaAmount ? '(,ddd).dddddddd' : '(,ddd)'}
            />
            <span className="ml-1 text-lg">%</span>
          </div>
          <Typography
            variant="caption"
            className="mt-1 font-bold tracking-widest text-zinc-400 uppercase"
          >
            Your Share of Governance
          </Typography>
        </div>
      </div>

      <Box className="mt-4 rounded-lg border border-violet-50 bg-white/50 p-3 text-xs leading-relaxed text-zinc-600">
        <strong>How it works:</strong> Your share is calculated based on the
        total active voting power currently delegated to DReps (
        <span className="font-mono">
          {totalVotingPower?.toLocaleString() ?? '0'} ₳
        </span>
        ). The higher your share, the more impact your delegation has on the
        ratification of governance actions.
      </Box>
    </Paper>
  );
};

export default VotingPowerCalculator;
