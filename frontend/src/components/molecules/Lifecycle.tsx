import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepContent, Paper, useTheme, useMediaQuery } from '@mui/material';
import { 
  PostAdd as SubmissionIcon, 
  Forum as DeliberationIcon, 
  HowToVote as VotingIcon, 
  Gavel as RatificationIcon, 
  PlayCircleOutline as EnactmentIcon 
} from '@mui/icons-material';

import { StepConnector, stepConnectorClasses, styled } from '@mui/material';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient( 95deg,rgb(99, 102, 241) 0%, rgb(139, 92, 246) 50%, rgb(6, 182, 212) 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient( 95deg,rgb(99, 102, 241) 0%, rgb(139, 92, 246) 50%, rgb(6, 182, 212) 100%)',
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
  },
}));

const steps = [
  {
    label: 'Submission',
    description: 'A Governance Action is submitted on-chain by any ADA holder. This requires a "deposit" to prevent spam.',
    icon: SubmissionIcon,
    color: '#6366f1' // Indigo
  },
  {
    label: 'Deliberation',
    description: 'The proposal is open for public review. Community members and governance bodies debate its merits and potential impact.',
    icon: DeliberationIcon,
    color: '#8b5cf6' // Violet
  },
  {
    label: 'Voting',
    description: 'Three bodies cast votes: the Constitutional Committee, DReps (representing delegated ADA), and SPOs.',
    icon: VotingIcon,
    color: '#d946ef' // Fuchsia
  },
  {
    label: 'Ratification',
    description: 'The protocol automatically calculates if "Yes" votes meet the specific threshold for that action type.',
    icon: RatificationIcon,
    color: '#ec4899' // Pink
  },
  {
    label: 'Enactment',
    description: 'If ratified, the action is enacted (executed) on-chain after a safety delay (usually at an epoch boundary).',
    icon: EnactmentIcon,
    color: '#06b6d4' // Cyan
  },
];

const GovernanceLifecycle = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box className="w-full py-12 px-4 bg-white/30 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm">
      <div className="flex flex-col items-center text-center mb-12">
        <Typography variant="h3" className="font-black text-violet-950 mb-4 tracking-tight">
          Governance Lifecycle
        </Typography>
        <Typography variant="body1" className="text-zinc-600 max-w-2xl mx-auto">
          From a raw idea to on-chain execution, every proposal follows a strict, transparent path to ensure decentralized legitimacy.
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
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: step.color, color: 'white' }}
                  >
                    <step.icon />
                  </div>
                )}
              >
                <div className={`${!isMobile ? 'mt-6 text-center' : 'ml-6 text-left py-1'}`}>
                  <Typography variant="subtitle1" className="font-bold text-violet-900 leading-tight">
                    {index + 1}. {step.label}
                  </Typography>
                  <Typography variant="caption" className="text-zinc-500 mt-1 block leading-relaxed max-w-[180px] md:mx-auto">
                    {step.description}
                  </Typography>
                </div>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box className="mt-16 flex flex-col md:flex-row gap-4 items-center justify-center text-xs font-bold uppercase tracking-widest text-violet-400">
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Transparent
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Decentralized
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          On-Chain
        </div>
      </Box>
    </Box>
  );
};

export default GovernanceLifecycle;
