'use client';
import React from 'react';
import Button from './Button';
import { useRouter } from 'next/navigation';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { STEPS } from './SetupProgressBar';
import { useWallet } from '@/context/globalContext';
import { CircularProgress } from '@mui/material';

interface ProfileSubmitAreaProps {
  isUpdate?: boolean;
  autoSubmit?: boolean;
  isDisabled?: boolean;
  preNavigationCheck?: () => Promise<boolean> | boolean;
}

const ProfileSubmitArea = ({
  isUpdate,
  autoSubmit = true,
  isDisabled = false,
  preNavigationCheck,
}: ProfileSubmitAreaProps) => {
  const {
    wallet: { isConnected },
    user: {
      dRepClaimProgress: { currentRegistrationStep },
      dRepClaimInfo: { isFetchingMetadataForClaim },
    },
    setUserInfo,
  } = useWallet();
  const router = useRouter();

  const handleNavigate = async () => {
    if (preNavigationCheck) {
      try {
        const canProceed = await preNavigationCheck();
        if (!canProceed) return;
      } catch (error) {
        console.error('Pre-navigation check failed:', error);
        return;
      }
    }

    if (!isUpdate) {
      router.push('/dreps');
      return;
    }

    if (autoSubmit) {
      const submitButton = document.getElementById(
        'profile-submit-button',
      ) as HTMLButtonElement;
      submitButton.click();
    }

    if (currentRegistrationStep === 4) {
      setUserInfo({
        dRepClaimProgress: {
          [ProfileWorkflowStepKey.REVIEW]: 'success',
        },
      });
      return;
    }

    const nextStep = STEPS[currentRegistrationStep - 1]?.key;
    if (nextStep) {
      setUserInfo({
        dRepClaimProgress: {
          [nextStep]: 'success',
          currentRegistrationStep: currentRegistrationStep + 1,
        },
      });
      router.push(
        `/dreps/workflow/profile/update/step${currentRegistrationStep + 1}`,
      );
    }
  };

  return (
    <div className="mt-4 flex flex-row items-center justify-center md:justify-end">
      <div className="flex flex-row items-center justify-center gap-2">
        <Button
          type="submit"
          variant="contained"
          id="profile-submit-button"
          data-testid="profile-submit-button"
          sx={
            (!isConnected || isDisabled || isFetchingMetadataForClaim) && {
              pointerEvents: 'none',
            }
          }
        >
          <p className="px-5 text-center text-sm font-medium leading-4">
            {isFetchingMetadataForClaim ? (
              <CircularProgress
                size={20}
                color="inherit"
                className="text-white place-self-center"
              />
            ) : !isUpdate ? (
              'Create'
            ) : (
              'Update'
            )}
          </p>
        </Button>
        <Button
          handleClick={handleNavigate}
          variant='outlined'
          bgcolor='transparent'
          id="next_button"
          sx={
            (!isConnected || isDisabled || isFetchingMetadataForClaim) && {
              pointerEvents: 'none',
            }
          }
        >
          <p className="px-5 text-center text-sm font-medium leading-4 text-blue-800">
            {isUpdate ? 'Next' : 'Cancel'}
          </p>
        </Button>
      </div>
    </div>
  );
};

export default ProfileSubmitArea;
