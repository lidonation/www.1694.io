'use client';
import React, { useState } from 'react';
import { Box, TextField, Typography, Paper, InputAdornment } from '@mui/material';
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
      <Paper elevation={0} className="p-6 rounded-2xl border border-violet-100 bg-violet-50/30 animate-pulse">
        <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography className="text-violet-300">Loading network metrics...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} className="p-6 rounded-2xl border border-violet-100 bg-violet-50/30">
      <Typography variant="h6" className="font-bold text-violet-900 mb-4">
        Voting Power Calculator
      </Typography>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full">
          <TextField
            fullWidth
            label="Your ADA Amount"
            variant="outlined"
            value={adaAmount}
            onChange={(e) => setAdaAmount(e.target.value)}
            placeholder="e.g. 10,000"
            InputProps={{
              startAdornment: <InputAdornment position="start">₳</InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'white',
              }
            }}
          />
          <Typography variant="caption" className="text-zinc-500 mt-2 block">
            Enter your ADA balance to see your potential governance share.
          </Typography>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-violet-100 shadow-sm w-full min-h-[120px]">
          <div className="text-3xl font-black text-violet-600 flex items-baseline">
            <AnimatedCounter 
              value={share} 
              format={adaAmount ? "(,ddd).dddddddd" : "(,ddd)"} 
            />
            <span className="text-lg ml-1">%</span>
          </div>
          <Typography variant="caption" className="font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Your Share of Governance
          </Typography>
        </div>
      </div>

      <Box className="mt-4 p-3 rounded-lg bg-white/50 border border-violet-50 text-xs text-zinc-600 leading-relaxed">
        <strong>How it works:</strong> Your share is calculated based on the total active voting power currently delegated to DReps
        (<span className="font-mono">{totalVotingPower?.toLocaleString() ?? '0'} ₳</span>).
        The higher your share, the more impact your delegation has on the ratification of governance actions.
      </Box>
    </Paper>
  );
};

export default VotingPowerCalculator;
