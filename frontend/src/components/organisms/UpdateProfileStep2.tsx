import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { Box, Typography } from '@mui/material';
import {
  convertDrepPhraseToCIP105,
  convertString,
  setItemToLocalStorage,
} from '@/lib';
import WalletConnectButton from '../molecules/WalletConnectButton';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { useVerifyTransactionWitness } from '@/hooks/useGetWitnessVerification';
import { usePostNewDrepMutation } from '@/hooks/usePostNewDRepMutation';
import { drepInput } from '@/models/drep';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { userLogin } from '@/services/requests/userLogin';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';

const FormSchema = z.object({
  verificationSignature: z.string().optional(),
  verificationKey: z.string().optional(),
});

type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep2 = () => {
  const { handleSubmit, setValue, getValues } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const savedDRepId = useRef<number | null>(null);
  const [signatures, setSignatures] = useState({
    current: { signature: null, key: null },
    verification: { signature: null, key: null },
  });
  const {
    addChangesSavedAlert,
    addErrorAlert,
    addSuccessAlert,
    addPendingAlert,
  } = useGlobalNotifications();
  const queryClient = useQueryClient();
  const { verifyWitness, isWitnessVerifying } = useVerifyTransactionWitness();
  const newDRepMutation = usePostNewDrepMutation();
  const {
    user: {
      dRepClaimInfo: {
        dRepIDToClaimBech32,
        dRepEntityToClaim,
        isCurrentOwnerOfDRepToClaim,
      },
      dRepProfilesClaimed,
    },
    wallet: {
      isConnected,
      address,
      dRepIdBech32,
      stakeKeyBech32,
      isConnecting,
    },
    setUserInfo,
    loginHardwareWalletTransaction,
  } = useWallet();
  const { openModal } = useModals();
  const hasClaimedProfile = dRepProfilesClaimed.find(
    (profile) => profile.claimedDRepBech32 == dRepIDToClaimBech32,
  );
  const handleCheck = async () => {
    if (!isCurrentOwnerOfDRepToClaim && !hasClaimedProfile) {
      addErrorAlert(
        'Please sign this expired txn to verify that you are indeed the owner of this DRep',
      );
      try {
        const sigs = await loginHardwareWalletTransaction({
          disableSigning: true,
          disableDownload: false,
          autoLogin: false,
        });
        if (sigs) {
          addPendingAlert('Verifying signature...', !isWitnessVerifying);

          const res = await verifyWitness({
            witnessSet: sigs,
            address: dRepEntityToClaim.reg_address,
          });

          if (res) {
            if (!res.publicKeyMatch) {
              addErrorAlert(
                'The signature does not match the drep you are trying to claim',
                false,
                20000,
              );
              return false;
            } else {
              // Save verification signature
              setSignatures((prev) => ({
                ...prev,
                verification: {
                  signature: sigs.signature,
                  key: sigs.vkey,
                },
              }));
              setValue('verificationSignature', sigs.signature);
              setValue('verificationKey', sigs.vkey);
              addSuccessAlert('Signature verified successfully');
              await createProfile();
              return true;
            }
          }
          addErrorAlert(
            'An error occurred while verifying the signature. Please try again',
          );
          return false;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
    return true;
  };

  const createProfile = async () => {
    try {
      const formData: drepInput = {
        signatures: [
          {
            signature: getValues('verificationSignature'),
            key: getValues('verificationKey'),
            type: 'drep',
          },
        ],
        stake_addr: stakeKeyBech32,
        voter_id: convertDrepPhraseToCIP105(dRepIdBech32),
        drep_bech32: convertDrepPhraseToCIP105(dRepIDToClaimBech32),
      };
      const { insertedDrep, token } = await newDRepMutation.mutateAsync({
        drep: formData as any,
      });
      savedDRepId.current = insertedDrep.raw[0].id;
      setItemToLocalStorage('token_1694', token);
      addSuccessAlert('Profile created successfully');
    } catch (error) {
      console.log(error);
      addErrorAlert('An error occurred while creating your profile');
    }
  };

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      const loginData = {
        stakeKey: stakeKeyBech32,
        signature: getValues('verificationSignature'),
        signatureKey: getValues('verificationKey'),
        method: 'hot_wallet' as any,
      };
      //TODO: refacfor signature logic
      await userLogin(loginData);
      queryClient.invalidateQueries(QUERY_KEYS.getVoterClaimedProfilesKey);
      addChangesSavedAlert();
    } catch (error) {
      console.log(error);
      addErrorAlert('An error occurred while saving your profile');
    }
  };

  useEffect(() => {
    if (hasClaimedProfile) {
      switch (hasClaimedProfile.voterSignatureType) {
        case 'drep':
          setSignatures((prev) => ({
            ...prev,
            verification: {
              signature: hasClaimedProfile.voterSignature,
              key: hasClaimedProfile.voterSignatureKey,
            },
          }));
          setValue('verificationSignature', hasClaimedProfile.voterSignature);
          setValue('verificationKey', hasClaimedProfile.voterSignatureKey);
          break;
        case 'signer':
          setSignatures((prev) => ({
            ...prev,
            current: {
              signature: hasClaimedProfile.voterSignature,
              key: hasClaimedProfile.voterSignatureKey,
            },
          }));
          break;
        default:
          //do nothing
          break;
      }
      setUserInfo({
        dRepClaimProgress: {
          [ProfileWorkflowStepKey.SIGNATURES]: 'update',
        },
      });
    } else {
      setUserInfo({
        dRepClaimProgress: {
          [ProfileWorkflowStepKey.SIGNATURES]: 'active',
        },
      });
    }

    return () => {
      if (hasClaimedProfile) {
        setUserInfo({
          dRepClaimProgress: {
            [ProfileWorkflowStepKey.SIGNATURES]: 'success',
          },
        });
      } else {
        setUserInfo({
          dRepClaimProgress: {
            [ProfileWorkflowStepKey.SIGNATURES]: 'pending',
          },
        });
      }
    };
  }, [dRepProfilesClaimed, dRepIDToClaimBech32]);

  const onError = (err) => {
    console.log(err);
  };

  return (
    <div className="flex w-full flex-col gap-5 px-10 py-5">
      <div className="flex flex-col gap-5">
        <Typography variant="h1" className="font-bold text-zinc-800">
          Your Signatures
        </Typography>
        {dRepIDToClaimBech32 && (
          <div className="flex flex-row flex-wrap gap-1 lg:flex-nowrap">
            <CopyToClipboard
              text={dRepIDToClaimBech32}
              textStyles="w-full break-words text-slate-500 lg:w-fit"
            >
              <img src="/svgs/copy.svg" alt="copy" />
            </CopyToClipboard>
          </div>
        )}
        <Typography variant="body1" paragraph={true}>
          Signatures below will be able to login and manage this profile. <br />
          Support for additional signatures coming soon.
        </Typography>
      </div>
      <Box>
        <Typography variant="h6">Signatures</Typography>
      </Box>
      <form id="profile_form" onSubmit={handleSubmit(saveProfile, onError)}>
        <div className="flex flex-col gap-1">
          {!isConnected ? (
            <WalletConnectButton
              test_name={'component'}
              isConnecting={isConnecting}
              handleConnect={() => {
                openModal(ModalType.LOGIN);
              }}
            />
          ) : (
            <>
              {!signatures.current.signature &&
              !signatures.verification.signature ? (
                <div className="flex flex-col items-center justify-center">
                  {/* <LoginButton isHardware={isHardware} /> */}
                </div>
              ) : (
                <Box className="flex flex-col gap-3">
                  {signatures.current.signature && (
                    <Box className="border-b border-gray-200 pb-2">
                      <Typography variant="body2" color="textSecondary">
                        Current Signature:{' '}
                        {convertString(signatures.current.signature, false)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Wallet: {address && convertString(address, false)}
                      </Typography>
                    </Box>
                  )}
                  {signatures.verification.signature && (
                    <Box className="border-b border-gray-200 pb-2">
                      <Typography variant="body2" color="textSecondary">
                        Verification Signature:{' '}
                        {convertString(
                          signatures.verification.signature,
                          false,
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Wallet: {address && convertString(address, false)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </div>
        <ProfileSubmitArea
          isUpdate
          preNavigationCheck={async () => {
            return await handleCheck();
          }}
        />
      </form>
    </div>
  );
};

export default UpdateProfileStep2;
