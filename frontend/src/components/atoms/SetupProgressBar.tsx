import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { StepStatus, useDRepContext } from '@/context/drepContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { Tabs, Tab, Box } from '@mui/material';

const STEPS = [
  { number: 1, key: 'profile', label: 'Profile set up' },
  { number: 2, key: 'signatures', label: 'Verify DRep profile' },
  { number: 3, key: 'socials', label: 'References/Links' },
  { number: 4, key: 'review', label: 'Metadata setup' },
] as const;

const StepIcon = ({ step, status }: { step: number; status: StepStatus }) => {
  if (status === 'success' || status === 'update') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 text-white">
        <img src="/svgs/check.svg" alt="check" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        status === 'active' ? 'bg-blue-800' : 'bg-gray-300'
      } text-white`}
    >
      {step}
    </div>
  );
};

const SetupProgressBar = () => {
  const {
    steps,
    updateStep,
    setCurrentRegistrationStep,
    currentLocale,
    drepClaimMismatch,
  } = useDRepContext();
  const router = useRouter();
  const pathname = usePathname();
  const { addWarningAlert } = useGlobalNotifications();

  const activeStep = Math.max(
    STEPS.findIndex(
      (step) => steps[step.key] === 'active' || steps[step.key] === 'update',
    ),
    0,
  );

  const handleStepChange = (_: any, newStep: number) => {
    if (pathname === `/${currentLocale}/dreps/workflow/profile/new`) {
      addWarningAlert('You need to complete this step first.');
      return;
    }

    const stepNumber = newStep + 1;
    const currentStepMatch = pathname.match(
      /\/dreps\/workflow\/profile\/update\/step(\d+)/,
    );
    const currentStep = currentStepMatch ? Number(currentStepMatch[1]) : 0;

    if (drepClaimMismatch && currentStep === 2 && stepNumber > 2) {
      addWarningAlert('You need to verify your DRep profile first.');
      return;
    }

    updateStep(STEPS[newStep].key, 'active');
    setCurrentRegistrationStep(stepNumber);
    router.push(`/dreps/workflow/profile/update/step${stepNumber}`);
  };

  useEffect(() => {
    const match = pathname.match(
      /\/dreps\/workflow\/profile\/update\/step(\d+)/,
    );
    if (match) {
      const stepNumber = Number(match[1]);
      updateStep(STEPS[stepNumber - 1].key, 'active');
      setCurrentRegistrationStep(stepNumber);
    }
  }, [pathname]);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Tabs
        value={activeStep}
        onChange={handleStepChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTab-root': {
            minWidth: 'auto',
            padding: '12px 64px',
            borderBottom: '2px solid',
            borderColor: 'grey.300',
            '&.Mui-selected': {
              borderColor: 'primary.dark',
            },
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
        }}
      >
        {STEPS.map((step) => (
          <Tab
            key={step.number}
            label={
              <div className="flex flex-col items-center gap-1">
                <StepIcon step={step.number} status={steps[step.key]} />
                <span className="text-center capitalize">{step.label}</span>
              </div>
            }
            sx={{
              '&.Mui-selected': {
                color: 'inherit',
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default SetupProgressBar;
