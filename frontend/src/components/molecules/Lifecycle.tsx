'use client';
import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PostAdd as SubmissionIcon,
  Forum as DeliberationIcon,
  HowToVote as VotingIcon,
  Gavel as RatificationIcon,
  PlayCircleOutline as EnactmentIcon,
} from '@mui/icons-material';

import { StepConnector, stepConnectorClasses, styled } from '@mui/material';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24,
    left: 'calc(-50% + 24px)',
    right: 'calc(50% + 24px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,rgb(99, 102, 241) 0%, rgb(139, 92, 246) 50%, rgb(6, 182, 212) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient( 95deg,rgb(99, 102, 241) 0%, rgb(139, 92, 246) 50%, rgb(6, 182, 212) 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
  },
  // Vertical orientation styling
  [`& .${stepConnectorClasses.lineVertical}`]: {
    width: 3,
    minHeight: 30,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
    marginLeft: 12, // Offset to align with the center of the 48px icon box
    marginTop: 8,
    marginBottom: 8,
  },
}));

const steps = [
  {
    label: 'Submission',
    description:
      'A Governance Action is submitted on-chain by any ADA holder. This requires a "deposit" to prevent spam.',
    icon: SubmissionIcon,
    color: '#6366f1', // Indigo
  },
  {
    label: 'Deliberation',
    description:
      'The proposal is open for public review. Community members and governance bodies debate its merits and potential impact.',
    icon: DeliberationIcon,
    color: '#8b5cf6', // Violet
  },
  {
    label: 'Voting',
    description:
      'Three bodies cast votes: the Constitutional Committee, DReps (representing delegated ADA), and SPOs.',
    icon: VotingIcon,
    color: '#d946ef', // Fuchsia
  },
  {
    label: 'Ratification',
    description:
      'The protocol automatically calculates if "Yes" votes meet the specific threshold for that action type.',
    icon: RatificationIcon,
    color: '#ec4899', // Pink
  },
  {
    label: 'Enactment',
    description:
      'If ratified, the action is enacted (executed) on-chain after a safety delay (usually at an epoch boundary).',
    icon: EnactmentIcon,
    color: '#06b6d4', // Cyan
  },
];

const GovernanceLifecycle = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box className="w-full rounded-3xl border border-white/50 bg-white/30 px-4 py-12 shadow-sm backdrop-blur-sm">
      <div className="mb-12 flex flex-col items-center text-center">
        <Typography
          variant="h3"
          className="mb-4 font-black tracking-tight text-violet-950"
        >
          Governance Lifecycle
        </Typography>
        <Typography variant="body1" className="mx-auto max-w-2xl text-zinc-600">
          From a raw idea to on-chain execution, every proposal follows a
          strict, transparent path to ensure decentralized legitimacy.
        </Typography>
      </div>

      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Stepper
          orientation={isMobile ? 'vertical' : 'horizontal'}
          alternativeLabel={!isMobile}
          className="bg-transparent"
          connector={<ColorlibConnector />}
        >
          {steps.map((step, index) => (
            <Step key={step.label} active={true} completed={false}>
              <StepLabel
                StepIconComponent={() => (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: step.color, color: 'white' }}
                  >
                    <step.icon />
                  </div>
                )}
              >
                <div
                  className={`${!isMobile ? 'mt-6 text-center' : 'ml-6 py-1 text-left'}`}
                >
                  <Typography
                    variant="subtitle1"
                    className="leading-tight font-bold text-violet-900"
                  >
                    {index + 1}. {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="mt-1 block max-w-[180px] leading-relaxed text-zinc-500 md:mx-auto"
                  >
                    {step.description}
                  </Typography>
                </div>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box className="mt-16 flex flex-col items-center justify-center gap-4 text-xs font-bold tracking-widest text-violet-400 uppercase md:flex-row">
        <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          Transparent
        </div>
        <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          Decentralized
        </div>
        <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          On-Chain
        </div>
      </Box>
    </Box>
  );
};

export default GovernanceLifecycle;
