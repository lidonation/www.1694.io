'use client';
import NewProfile from '@/components/organisms/NewProfile';
import { useDRepContext } from '@/context/drepContext';
import { useCardano } from '@/context/walletContext';
import { compareDRepIDs } from '@/lib';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { usePathname,  useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';


const Page = () => {
  const {
    setIsWalletListModalOpen,
    updateStep,
    setNewDrepId,
    setHideCloseButtonOnWalletListModal,
    setDrepToBeClaimed,
    drepToBeClaimed,
    handleActionModalOpen,
    handleActionModalClose
  } = useDRepContext();

  const { isEnabled, dRepIDBech32 } = useCardano();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (params.has('drep') && params.get('drep') !== '' && params.get('drep') !== null) {
      setDrepToBeClaimed(params.get('drep'));
    }else {
      setDrepToBeClaimed(null);
      //show eror modal
      handleActionModalOpen({
        title: 'Unidentifiable DRep ID',
        severity: 'error',
        hideCloseButton: true,
        children: 'It seems there is an issue with the DRep ID you are trying to claim. Try selecting one from the DRep list.',
        actionButtons: [
          {
            label: 'Go to DRep List',
            handleClick: () => {
              handleActionModalClose();
              router.push('/dreps/list');
            },
          },
        ],
        handleClose: () => {
          router.push('/dreps/list');
          handleActionModalClose();
        },
      });
    }
  }, [params, pathname]);

  useEffect(() => {
    if (!isEnabled) {
      setIsWalletListModalOpen(true);
      setHideCloseButtonOnWalletListModal(true);
    } else if (dRepIDBech32) {
      const checkIfExistingDRep = async () => {
        try {
          const drep = await getSingleDRepViaVoterId(dRepIDBech32);
          if (drep?.drep_id) {
            setNewDrepId(drep.drep_id);
            updateStep(ProfileWorkflowStepKey.PROFILE, 'update');
            router.push(`/dreps/workflow/profile/update/step1`);
          } else {
            updateStep(ProfileWorkflowStepKey.PROFILE, 'active');
          }
        } catch (error) {
          if (
            error.response?.status === 404 &&
            error.response?.data?.message === 'Drep not found!'
          ) {
            updateStep(ProfileWorkflowStepKey.PROFILE, 'active');
          }
        }
      };


      if (drepToBeClaimed && compareDRepIDs(drepToBeClaimed, dRepIDBech32)) {
        checkIfExistingDRep();
      }
    }

    return () => {
      setIsWalletListModalOpen(false);
      setHideCloseButtonOnWalletListModal(false);
    };
  }, [isEnabled, dRepIDBech32, drepToBeClaimed]);

  return <NewProfile />;
};

export default Page;
