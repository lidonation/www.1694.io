import React from 'react';
import Button from './Button';
import { useCardano } from '@/context/cardanoContext';
import { useDRepContext } from '@/context/drepContext';
import { useRouter } from 'next/navigation';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { STEPS } from './SetupProgressBar';

interface ProfileSubmitAreaProps {
  isUpdate?: boolean;
  autoSubmit?: boolean;
  isDisabled?: boolean;
  preNavigationCheck?: () => Promise<boolean> | boolean;
}

const ProfileSubmitArea = ({
  isUpdate,
  autoSubmit= true,
  isDisabled = false,
  preNavigationCheck,
}: ProfileSubmitAreaProps) => {
  const { isEnabled } = useCardano();
  const router = useRouter();
  const { currentRegistrationStep, setCurrentRegistrationStep, updateStep } =
    useDRepContext();

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
      updateStep(ProfileWorkflowStepKey.REVIEW, 'success');
      return;
    }

    const nextStep = STEPS[currentRegistrationStep - 1]?.key;
    if (nextStep) {
      updateStep(nextStep, 'active');
      setCurrentRegistrationStep(currentRegistrationStep + 1);
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
          variant="outlined"
          bgcolor="transparent"
          id="profile-submit-button"
          data-testid="profile-submit-button"
          sx={(!isEnabled || isDisabled) && { pointerEvents: 'none' }}
        >
          <p className="px-5 text-center text-sm font-medium leading-4 text-blue-800">
            {!isUpdate ? 'Create' : 'Update'}
          </p>
        </Button>
        <Button
          handleClick={handleNavigate}
          id="next_button"
          sx={(!isEnabled || isDisabled) && { pointerEvents: 'none' }}
        >
          <p className="px-5 text-center text-sm font-medium leading-4 text-white">
            {isUpdate ? 'Next' : 'Cancel'}
          </p>
        </Button>
      </div>
    </div>
  );
};

export default ProfileSubmitArea;