'use client';
import NewProfile from '@/components/organisms/NewProfile';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { compareDRepIDs } from '@/lib';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

const Page = () => {
  const {
    wallet: { isConnected, dRepIdBech32 },
    user: {
      dRepClaimInfo: { dRepIDToClaimBech32, isCurrentOwnerOfDRepToClaim },
      dRepProfilesClaimed,
    },
    setUserInfo,
  } = useWallet();
  const { openModal, closeModal } = useModals();
  const isOwner = isCurrentOwnerOfDRepToClaim || dRepProfilesClaimed?.some((drep) =>
    compareDRepIDs(drep.claimedDRepBech32, dRepIDToClaimBech32),
  );
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (
      params.has('drep') &&
      params.get('drep') !== '' &&
      params.get('drep') !== null
    ) {
      setUserInfo({
        dRepClaimInfo: {
          dRepIDToClaimBech32: params.get('drep'),
        },
      });
    } else {
      //show eror modal
      openModal(ModalType.ACTION, {
        title: 'Unidentifiable DRep ID',
        severity: 'error',
        hideCloseButton: true,
        children:
          'It seems there is an issue with the DRep ID you are trying to claim. Try selecting one from the DRep list.',
        actionButtons: [
          {
            label: 'Go to DRep List',
            handleClick: () => {
              closeModal(ModalType.ACTION);
              router.push('/dreps/list');
              setUserInfo({
                dRepClaimInfo: {
                  dRepIDToClaimBech32: null,
                },
              });
            },
          },
        ],
        handleClose: () => {
          router.push('/dreps/list');
          closeModal(ModalType.ACTION);
          setUserInfo({
            dRepClaimInfo: {
              dRepIDToClaimBech32: null,
            },
          });
        },
      });
    }
  }, [params, pathname]);

  //todo: update to check from drepClaimed array
  useEffect(() => {
    if (!isConnected) {
      openModal(ModalType.LOGIN, {
        hideCloseButton: true,
      });
    } else if (dRepIdBech32) {
      closeModal(ModalType.LOGIN);
      const checkIfExistingDRep = async () => {
        try {
          const drep = await getSingleDRepViaVoterId(dRepIdBech32);
            if (drep?.drep_id && isOwner) {
              setUserInfo({
                dRepClaimProgress: {
                  [ProfileWorkflowStepKey.PROFILE]: 'update',
                },
              });
              router.push(`/dreps/workflow/profile/update/step1`);
            } else {
              setUserInfo({
                dRepClaimProgress: {
                  [ProfileWorkflowStepKey.PROFILE]: 'active',
                },
              });
            }
        } catch (error) {
          if (
            error.response?.status === 404 &&
            error.response?.data?.message === 'Drep not found!'
          ) {
            setUserInfo({
              dRepClaimProgress: {
                [ProfileWorkflowStepKey.PROFILE]: 'active',
              },
            });
          }
        }
      };

      if (dRepIDToClaimBech32) {
        checkIfExistingDRep();
      }
    }
  }, [isConnected, dRepIdBech32, dRepIDToClaimBech32]);

  return <NewProfile />;
};

export default Page;
