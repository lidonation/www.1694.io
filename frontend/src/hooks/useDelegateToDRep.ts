'use client';
import { useCallback, useState } from 'react';
import { CertificatesBuilder } from '@emurgo/cardano-serialization-lib-asmjs';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useGetSingleDRepQuery } from './useGetSingleDRepQuery';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useWallet, ModalType, useModals } from '@/context/globalContext';
import { pollTransaction } from '@/lib';
import { AuthMethod } from '../../types/auth';

type DelegateOptions = {
  isRetired?: boolean;
};

export const useDelegateTodRep = () => {
  const {
    signAndSubmitTransaction,
    buildVoteDelegationCert,
    buildDRepRetirementCert,
    buildStakeKeyRegCert,
    wallet: {
      addressBech32,
      isConnected,
      dRepIdBech32,
      registeredStakeKeysListState,
    },
    activeWallet,
  } = useWallet();
  const queryClient = useQueryClient();
  const { addSuccessAlert, addErrorAlert, addPendingAlert } =
    useGlobalNotifications();
  const { openModal, closeModal } = useModals();
  const { dRep } = useGetSingleDRepQuery(dRepIdBech32);
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

      const txResult = await signAndSubmitTransaction(
        'delegationTxn',
        certBuilder as any,
        {
          disableDownload: activeWallet === AuthMethod.HOT_WALLET,
          disableSigning: activeWallet === AuthMethod.LOGIN_FILE,
          ...(activeWallet === AuthMethod.LOGIN_FILE && {
            deriveUtxosFrom: addressBech32,
          }),
        },
      );
      if (txResult?.resultHash) {
        addPendingAlert(
          `Confirming transaction ${txResult?.resultHash}.... \n.This action may take a few minutes, but will happen in the background.`,
          false,
        );
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
      closeModal(ModalType.ACTION);
    }
  };

  const delegate = useCallback(
    async (dRepId: string | undefined, options?: DelegateOptions) => {
      if (!dRepId) return;
      setIsDelegating(dRepId);

      try {
        if (!isConnected) {
          throw new Error('Please login to delegate');
        }

        if (options?.isRetired) {
          openModal(ModalType.ACTION, {
            title: 'Delegate to Retired DRep',
            children: 'Are you sure you want to delegate to a retired DRep?',
            severity: 'warning',
            handleClose: () => setIsDelegating(null),
            actionButtons: [
              {
                label: 'Cancel',
                handleClick: () => {
                  setIsDelegating(null);
                  closeModal(ModalType.ACTION);
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
      isConnected,
      processDelegation,
    ],
  );

  return {
    delegate,
    isDelegating,
  };
};
