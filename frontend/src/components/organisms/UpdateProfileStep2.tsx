import React, { ChangeEvent, useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { usePostUpdateDrepMutation } from '@/hooks/usePostUpdateDRepMutation';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { Box, Typography } from '@mui/material';
import {
  convertDrepPhraseToCIP105,
  convertString,
  setItemToLocalStorage,
} from '@/lib';
import WalletConnectButton from '../molecules/WalletConnectButton';
import LoginButton from '../molecules/LoginButton';
import { getSwitchWithTextTrack } from './UserLoginModal';
import { useScreenDimension } from '@/hooks';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { useVerifyTransactionWitness } from '@/hooks/useGetWitnessVerification';
import { usePostNewDrepMutation } from '@/hooks/usePostNewDRepMutation';
import { drepInput } from '@/models/drep';
import { ProfileWorkflowStepKey } from '@/lib/enums';

const FormSchema = z.object({
  signature: z.string(),
  key: z.string(),
  verificationSignature: z.string().optional(),
  verificationKey: z.string().optional(),
});

type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep2 = () => {
  const { handleSubmit, setValue, getValues } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const { isMobile } = useScreenDimension();
  const [isHardware, setIsHardware] = useState(!false);
  const [signatures, setSignatures] = useState({
    current: { signature: null, key: null },
    verification: { signature: null, key: null },
  });
  const {
    address,
    isEnabled,
    stakeKey,
    loginCredentials,
    loginHardwareWalletTransaction,
    dRepIDBech32,
  } = useCardano();

  const SwitchWithTextTrack = getSwitchWithTextTrack(
    isMobile,
    isMobile ? '9.375rem' : '13.75rem',
  );
  const {
    drepId,
    drepToBeClaimed,
    drepClaimMismatch,
    setDrepClaimMismatch,
    drepEntityToBeClaimed,
    setNewDrepId,
    updateStep,
  } = useDRepContext();

  const {
    addChangesSavedAlert,
    addErrorAlert,
    addSuccessAlert,
    addPendingAlert,
  } = useGlobalNotifications();
  const { verifyWitness, isWitnessVerifying } = useVerifyTransactionWitness();
  const newDRepMutation = usePostNewDrepMutation();
  const updateDrepMutation = usePostUpdateDrepMutation();

  const handleCheck = async () => {
    if (drepClaimMismatch) {
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
            address: drepEntityToBeClaimed.reg_address,
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
              setDrepClaimMismatch(false);
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
      const stakeAddress = Address.from_bytes(
        Buffer.from(stakeKey, 'hex') as any,
      ).to_bech32();
      const formData: drepInput = {
        signatures: [
          {
            signature: getValues('signature'),
            key: getValues('key'),
            type: 'signer',
          },
          {
            signature: getValues('verificationSignature'),
            key: getValues('verificationKey'),
            type: 'drep',
          },
        ],
        stake_addr: stakeAddress,
        voter_id: convertDrepPhraseToCIP105(dRepIDBech32),
        drep_bech32: convertDrepPhraseToCIP105(drepToBeClaimed),
      };
      const { insertedDrep, token } = await newDRepMutation.mutateAsync({
        drep: formData as any,
      });
      setNewDrepId(insertedDrep.raw[0].id);
      setItemToLocalStorage('token_1694', token);
      addSuccessAlert('Profile created successfully');
    } catch (error) {
      console.log(error);
      addErrorAlert('An error occurred while creating your profile');
    }
  };

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      const stakeAddress = Address.from_bytes(
        Buffer.from(stakeKey, 'hex') as any,
      ).to_bech32();

      const formData: drepInput = {
        signatures: [
          {
            signature: getValues('signature'),
            key: getValues('key'),
            type: 'signer',
          },
          {
            signature: getValues('verificationSignature'),
            key: getValues('verificationKey'),
            type: 'drep',
          },
        ],
        stake_addr: stakeAddress,
        voter_id: convertDrepPhraseToCIP105(dRepIDBech32),
        drep_bech32: convertDrepPhraseToCIP105(drepToBeClaimed),
      };

      await updateDrepMutation.mutateAsync({
        drepId: drepId,
        drep: formData,
      });
      addChangesSavedAlert();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    try {
      if (loginCredentials?.signature || loginCredentials?.vkey) {
        const { signature, vkey } = loginCredentials;
        setSignatures((prev) => ({
          ...prev,
          current: { signature, key: vkey },
        }));
        setValue('signature', signature);
        setValue('key', vkey);
        updateStep(ProfileWorkflowStepKey.SIGNATURES, 'update');
      } else updateStep(ProfileWorkflowStepKey.SIGNATURES, 'active');
    } catch (error) {
      console.log(error);
      addErrorAlert(
        String(error) || 'An error occurred while loading your credentials',
      );
    }

    return () => {
      if (loginCredentials) {
        updateStep(ProfileWorkflowStepKey.SIGNATURES, 'success');
      } else {
        updateStep(ProfileWorkflowStepKey.SIGNATURES, 'pending');
      }
    };
  }, [loginCredentials]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsHardware(!event.target.checked);
  };

  const onError = (err) => {
    console.log(err);
  };

  return (
    <div className="flex w-full flex-col gap-5 px-10 py-5">
      <div className="flex flex-col gap-5">
        <Typography variant="h1" className="font-bold text-zinc-800">
          Your Signatures
        </Typography>
        {drepToBeClaimed && (
          <div className="flex flex-row flex-wrap gap-1 lg:flex-nowrap">
            <CopyToClipboard
              text={drepToBeClaimed}
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
          {!isEnabled ? (
            <WalletConnectButton test_name={'component'} />
          ) : (
            <>
              {!signatures.current.signature &&
              !signatures.verification.signature ? (
                <div className="flex flex-col items-center justify-center">
                  <SwitchWithTextTrack
                    checked={!isHardware}
                    onChange={handleChange}
                  />
                  <LoginButton isHardware={isHardware} />
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
