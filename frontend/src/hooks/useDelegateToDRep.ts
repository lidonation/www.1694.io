import { useCallback, useState } from 'react';
import { CertificatesBuilder } from '@emurgo/cardano-serialization-lib-asmjs';
import { useCardano } from '@/context/walletContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useGetSingleDRepQuery } from './useGetSingleDRepQuery';
import { useDRepContext } from '@/context/drepContext';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';

type DelegateOptions = {
  isRetired?: boolean;
};

export const useDelegateTodRep = () => {
  const {
    signAndSubmitTransaction,
    buildVoteDelegationCert,
    buildDRepRetirementCert,
    buildStakeKeyRegCert,
    registeredStakeKeysListState,
    dRepIDBech32,
    isEnabled,
    pollTransaction,
  } = useCardano();
  const queryClient = useQueryClient();
  const { addSuccessAlert, addErrorAlert, addPendingAlert } =
    useGlobalNotifications();
  const { handleActionModalOpen, handleActionModalClose } = useDRepContext();
  const { dRep } = useGetSingleDRepQuery(dRepIDBech32);

  const [isDelegating, setIsDelegating] = useState<string | null>(null);

  const processDelegation = async (dRepId: string) => {
    try {
      if (dRep?.is_registered_as_sole_voter && !dRep?.deposit) {
        throw new Error('Cannot get deposit amount for sole voter');
      }

      const certBuilder = CertificatesBuilder.new();

      if (dRep?.is_registered_as_sole_voter) {
        const retirementCert = await buildDRepRetirementCert(
          dRep?.deposit?.toString(),
        );
        certBuilder.add(retirementCert);
      }

      if (!registeredStakeKeysListState.length) {
        const stakeKeyRegCert = await buildStakeKeyRegCert();
        certBuilder.add(stakeKeyRegCert);
      }

      const voteDelegationCert = await buildVoteDelegationCert(dRepId);
      certBuilder.add(voteDelegationCert);

      const txResult = await signAndSubmitTransaction(certBuilder, {
        disableDownload: true,
      });
      if (txResult?.resultHash) {
        addPendingAlert(`Confirming transaction ${txResult?.resultHash}....`, false);
        const result = await pollTransaction(txResult?.resultHash);
        if (result === true) {
          addSuccessAlert('Successfully delegated to DRep');
        } else {
          addErrorAlert('Transaction confirmation timed out');
        }
      } else {
        addSuccessAlert(
          'Successfully delegated to DRep. Changes may take a few minutes to reflect.',
        );
      }
      queryClient.invalidateQueries(
        QUERY_KEYS.getAdaHolderCurrentDelegationKey,
      );
    } catch (error: any) {
      console.error(error);
      addErrorAlert(error?.message || 'Something went wrong while delegating');
    } finally {
      setIsDelegating(null);
      handleActionModalClose();
    }
  };

  const delegate = useCallback(
    async (dRepId: string | undefined, options?: DelegateOptions) => {
      if (!dRepId) return;
      setIsDelegating(dRepId);

      try {
        if (!isEnabled) {
          throw new Error('Please enable your wallet to delegate');
        }

        if (options?.isRetired) {
          handleActionModalOpen({
            title: 'Delegate to Retired DRep',
            children: 'Are you sure you want to delegate to a retired DRep?',
            severity: 'warning',
            handleClose: () => setIsDelegating(null),
            actionButtons: [
              {
                label: 'Cancel',
                handleClick: () => {
                  setIsDelegating(null);
                  handleActionModalClose();
                },
              },
              {
                label: 'Delegate',
                handleClick: async () => {
                  return await processDelegation(dRepId);
                },
              },
            ],
          });
          return;
        }

        await processDelegation(dRepId);
      } catch (error: any) {
        addErrorAlert(
          error?.message || 'Something went wrong while delegating',
        );
      } finally {
        setIsDelegating(null);
      }
    },
    [
      addErrorAlert,
      addSuccessAlert,
      signAndSubmitTransaction,
      buildVoteDelegationCert,
      dRep?.deposit,
      dRep?.is_registered_as_sole_voter,
      handleActionModalOpen,
      isEnabled,
      processDelegation,
    ],
  );

  return {
    delegate,
    isDelegating,
  };
};
