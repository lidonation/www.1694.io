import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { StepStatus, useDRepContext } from '@/context/drepContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { Tabs, Tab, Box } from '@mui/material';
import { ProfileWorkflowStepKey } from '@/lib/enums';

export const STEPS = [
  { number: 1, key: ProfileWorkflowStepKey.PROFILE, label: 'Profile set up' },
  { number: 2, key:  ProfileWorkflowStepKey.SIGNATURES, label: 'Verify DRep profile' },
  { number: 3, key:  ProfileWorkflowStepKey.SOCIALS, label: 'References/Links' },
  { number: 4, key:  ProfileWorkflowStepKey.REVIEW, label: 'Metadata setup' },
] as const;

const stepPathnameRegex = /\/dreps\/workflow\/profile\/update\/step(\d+)/;

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

  // Get step from URL - returns 1-based number
  const match = stepPathnameRegex.exec(pathname);
  const urlStep = match ? Number(match[1]) : 1; // Default to 1 if no match

  // Convert to 0-based for MUI Tabs
  const activeStep = urlStep - 1;

  const handleStepChange = (_: any, newStep: number) => {
    if (pathname === `/${currentLocale}/dreps/workflow/profile/new`) {
      addWarningAlert('You need to complete this step first.');
      return;
    }

    // newStep is 0-based from MUI, convert to 1-based for URL/state
    const stepNumber = newStep + 1;
    const stepKey = STEPS[newStep].key;

    const currentStepMatch = stepPathnameRegex.exec(pathname);
    const currentStep = currentStepMatch ? Number(currentStepMatch[1]) : 0;

    if (drepClaimMismatch && currentStep === 2 && stepNumber > 2) {
      addWarningAlert('You need to verify your DRep profile first.');
      return;
    }

    updateStep(stepKey, 'active');
    setCurrentRegistrationStep(stepNumber);
    router.push(`/dreps/workflow/profile/update/step${stepNumber}`);
  };

  useEffect(() => {
    const match = stepPathnameRegex.exec(pathname);
    if (match) {
      const stepNumber = Number(match[1]);
      updateStep(STEPS[stepNumber - 1].key, 'active');
      setCurrentRegistrationStep(stepNumber);
    }
  }, [pathname]);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', marginX: 'auto' }}>
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
