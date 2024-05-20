import React from 'react';
import Button from './Button';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { useRouter } from 'next/navigation';
interface ProfileSubmitAreaProps {
  isUpdate?: boolean;
}
const ProfileSubmitArea = ({ isUpdate }: ProfileSubmitAreaProps) => {
  const { isEnabled } = useCardano();
  const router = useRouter();
  const {
    currentRegistrationStep,
    setCurrentRegistrationStep,
    setStep1Status,
    setStep2Status,
    setStep3Status,
    setStep4Status,
  } = useDRepContext();
  
  
  const handleNavigate = (step: number) => {
    const submitButton = document.getElementById(
      'profile-submit-button',
    ) as HTMLButtonElement;
    submitButton.click();
    switch (currentRegistrationStep) {
      case 1:
        setStep1Status('success');
        setCurrentRegistrationStep(2);
        router.push(`$/dreps/workflow/profile/update/step${currentRegistrationStep}`);
      case 2:
        setStep2Status('success');
        setCurrentRegistrationStep(3);
        router.push(`$/dreps/workflow/profile/update/step${currentRegistrationStep}`);
      case 3:
        setStep3Status('success');
        setCurrentRegistrationStep(4);
        router.push(`$/dreps/workflow/profile/update/step${currentRegistrationStep}`);
      case 4:
        setStep4Status('update')
      default:
        console.log('default');
        break;
    }
   
  };
  return (
    <div className="mt-4 flex flex-row items-center justify-center md:justify-end">
      <div className="flex flex-row items-center justify-center gap-2">
        <Button
          type="submit"
          id="profile-submit-button"
          data-testid="profile-submit-button"
          sx={!isEnabled ? { pointerEvents: 'none' } : {}}
        >
          <p className="px-5 text-center text-sm font-medium leading-4  text-white">
            {!isUpdate ? 'Create' : 'Update'}
          </p>
        </Button>
        <Button
          variant="outlined"
          bgColor="transparent"
          handleClick={handleNavigate}
          id="next_button"
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
