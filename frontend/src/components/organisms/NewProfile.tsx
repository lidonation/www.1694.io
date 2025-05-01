import React, { useEffect, useState } from 'react';
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import NewProfileForm from '../molecules/NewProfileForm';
import { usePostNewDrepMutation } from '@/hooks/usePostNewDRepMutation';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import {
  convertDrepPhraseToCIP105,
  renderJsonLdValue,
  setItemToLocalStorage,
  sha256,
} from '@/lib';
import { submitMetadata } from '@/lib/metadataProcessor';
import { setItemToIndexedDB } from '@/lib/indexedDb';
import { postAddAttachmentToIPFS } from '@/services/requests/postAttachmentToIPFS';
import { urls } from '@/constants';
import { DRepMetadata, IPFSResponse } from '../../../types/commonTypes';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { Typography } from '@mui/material';
import { drepInput } from '@/models/drep';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';

const FormSchema = z.object({
  profileName: z.string().min(1, { message: 'Profile name is required' }),
  profileEmail: z.string().optional(),
  profileBio: z.string().optional(),
  profileUrl: z.any(),
  objectives: z.string().optional(),
  motivations: z.string().optional(),
  qualifications: z.string().optional(),
  paymentAddress: z.string().optional(),
});

type InputType = z.infer<typeof FormSchema>;

export const PREDEFINED_KEYS = [
  'givenName',
  'bio',
  'email',
  'references',
  'paymentAddress',
  'image',
  'objectives',
  'motivations',
  'qualifications',
];

const NewProfile = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const queryClient = useQueryClient();
  const {
    wallet: { address, stakeKey, dRepIdBech32, isConnected },
    user: {
      dRepClaimInfo: {
        isCurrentOwnerOfDRepToClaim,
        dRepIDToClaimBech32,
        isDRepTobeClaimedRegistered,
        dRepToBeClaimedJsonLd,
        isFetchingMetadataForClaim
      },
    },
    loginSignTransaction,
    handleRefreshUserJsonLd,
    setUserInfo,
  } = useWallet();
  const { openModal, closeModal } = useModals();
  const { addSuccessAlert, addErrorAlert } = useGlobalNotifications();
  const [currentMetadata, setCurrentMetadata] = useState(null);
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const newDRepMutation = usePostNewDrepMutation();

  useEffect(() => {
    const getDRep = () => {
      try {
        if (!dRepToBeClaimedJsonLd) return;
        const metadataBody = dRepToBeClaimedJsonLd?.body;
        setValue(
          'profileName',
          renderJsonLdValue(metadataBody?.givenName || metadataBody?.dRepName),
        );
        setValue('profileBio', renderJsonLdValue(metadataBody?.bio));
        setValue('profileEmail', renderJsonLdValue(metadataBody?.email));
        setValue('motivations', renderJsonLdValue(metadataBody?.motivations));
        setValue(
          'qualifications',
          renderJsonLdValue(metadataBody?.qualifications),
        );
        setValue('objectives', renderJsonLdValue(metadataBody?.objectives));
        setValue(
          'paymentAddress',
          renderJsonLdValue(metadataBody?.paymentAddress) || address,
        );
        setValue(
          'profileUrl',
          renderJsonLdValue(metadataBody?.image?.contentUrl) || '',
        );
        setCurrentProfileUrl(
          renderJsonLdValue(metadataBody?.image?.contentUrl) || '',
        );

        for (let key in metadataBody) {
          if (key === 'image') {
            setCurrentMetadata((prev: any) => ({
              ...prev,
              [key]: {
                contentUrl: renderJsonLdValue(metadataBody[key]?.contentUrl),
                sha256: renderJsonLdValue(metadataBody[key]?.sha256),
              },
            }));
            continue;
          }
          if (key === 'references') {
            setCurrentMetadata((prev: any) => ({
              ...prev,
              [key]: metadataBody[key],
            }));
            continue;
          }
          setCurrentMetadata((prev: any) => ({
            ...prev,
            [key]: renderJsonLdValue(metadataBody[key]),
          }));
        }
        return;
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      reset();
      setCurrentMetadata(null);
      setCurrentProfileUrl(null);
    };
  }, [dRepToBeClaimedJsonLd]);

  const renderModal = () => {
    switch (true) {
      //case where the user tries to claim a retired or unknown DRep
      case !isDRepTobeClaimedRegistered && !isCurrentOwnerOfDRepToClaim:
        openModal(ModalType.ACTION, {
          title: 'Invalid DRep Claim',
          severity: 'error',
          children: (
            <Typography
              variant="subtitle2"
              className="text-center font-semibold text-gray-700"
              data-testid="invalid-drep-claim"
            >
              The DRep Profile you are trying to claim is either not registered
              or most likely retired.
            </Typography>
          ),
          actionButtons: [],
          handleClose: () => closeModal(ModalType.ACTION),
        });
        return true;

      //case where the user tries to claim a DRep that is already registered but doesn't match the user's DRep ID
      case isDRepTobeClaimedRegistered && !isCurrentOwnerOfDRepToClaim:
        openModal(ModalType.ACTION, {
          title: 'DRep Claim Mismatch',
          severity: 'warning',
          children: (
            <Typography
              variant="subtitle2"
              className="text-center font-semibold text-gray-700"
              data-testid="invalid-drep-claim"
            >
              The DRep Profile you are trying to claim seems to not match the
              identity of the DRep you are currently logged in with via wallet.
              <br />
              <span>
                Note that you may still proceed with this workflow but you will
                be required to prove that the DRep you are trying to claim is
                yours.
              </span>
            </Typography>
          ),
          actionButtons: [
            {
              label: 'Proceed',
              handleClick: () => {
                saveProfile(getValues());
                closeModal(ModalType.ACTION);
              },
            },
            {
              label: 'Cancel',
              handleClick: () => {
                closeModal(ModalType.ACTION);
              },
            },
          ],
          handleClose: () => closeModal(ModalType.ACTION),
        });
        return true;
      default:
        return false;
    }
  };

  const handleSubmitForm = () => {
    const modalShown = renderModal();
    if (!modalShown) {
      saveProfile(getValues());
    }
  };

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      const signatureResult = await loginSignTransaction(dRepIDToClaimBech32, [
        {
          type: 'drep',
          value: dRepIDToClaimBech32,
        },
      ]);
      if (!signatureResult?.signature || !signatureResult?.key) {
        throw new Error('Failed to get signature');
      }

      const { signature, key } = signatureResult;
      if (
        currentMetadata?.givenName !== data.profileName ||
        currentMetadata?.bio !== data.profileBio ||
        currentMetadata?.email !== data.profileEmail ||
        currentMetadata?.image?.contentUrl !== data.profileUrl ||
        currentMetadata?.paymentAddress !== data.paymentAddress ||
        currentMetadata?.qualifications !== data.qualifications ||
        currentMetadata?.motivations !== data.motivations ||
        currentMetadata?.objectives !== data.objectives
      ) {
        const rest = currentMetadata
          ? Object.keys(currentMetadata)
              .filter((key) => !PREDEFINED_KEYS.includes(key))
              .reduce((acc, key) => {
                acc[key] = currentMetadata[key];
                return acc;
              }, {})
          : {};
        const metadataJson: DRepMetadata = {
          givenName: data.profileName,
          bio: data.profileBio,
          email: data.profileEmail,
          references: currentMetadata?.references as any,
          paymentAddress: data.paymentAddress,
          qualifications: data.qualifications,
          motivations: data.motivations,
          objectives: data.objectives,
          ...rest,
        };
        if (data.profileUrl) {
          let imageFile: File | null = null;

          if (typeof data.profileUrl !== 'string') {
            if (data.profileUrl instanceof FileList) {
              if (data.profileUrl.length > 0) {
                imageFile = data.profileUrl[0];
              }
            } else {
              imageFile = data.profileUrl;
            }
          }

          if (imageFile) {
            const formData = new FormData();
            formData.append('attachment', imageFile);
            const { ipfs_hash }: IPFSResponse = await postAddAttachmentToIPFS({
              attachment: formData,
            });
            const imageUrl = `${urls.ipfsGateway}/ipfs/${ipfs_hash}`;
            const imageHash = await sha256(imageFile);
            metadataJson['image'] = {
              contentUrl: imageUrl,
              sha256: imageHash,
            };
          } else if (typeof data.profileUrl === 'string') {
            // if the user is updating the profile and the image is not changed
            metadataJson['image'] = {
              contentUrl: data.profileUrl,
              sha256: data?.profileUrl ? currentMetadata?.image?.sha256 : '',
            };
          }
        }
        const metadataKeys = Object.keys(metadataJson);
        const vkeys = {
          signature,
          vkey: key,
        };
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          metadataJson as any,
          loginSignTransaction,
          vkeys,
        );
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        setItemToLocalStorage('isUpdating', 'true');
        await handleRefreshUserJsonLd();
      }
      //we are confident that the DRep being claimed is the same as the user's DRep ID
      if (isCurrentOwnerOfDRepToClaim) {
        const stakeAddress = Address.from_bytes(
          Buffer.from(stakeKey, 'hex') as any,
        ).to_bech32();
        const formData: drepInput = {
          signatures: [{ signature, key, type: 'drep' }],
          stake_addr: stakeAddress,
          voter_id: convertDrepPhraseToCIP105(dRepIdBech32),
          drep_bech32: convertDrepPhraseToCIP105(dRepIDToClaimBech32),
        };
        const res = await newDRepMutation.mutateAsync({
          drep: formData as any,
        });
        const { token } = res;
        setItemToLocalStorage('token_1694', token);
      }
      addSuccessAlert(
        !isCurrentOwnerOfDRepToClaim
          ? 'Profile saved locally!'
          : 'DRep Profile created successfully!',
      );
      setUserInfo({
        dRepClaimProgress: {
          [ProfileWorkflowStepKey.PROFILE]: 'success',
          [ProfileWorkflowStepKey.SIGNATURES]: 'active',
          currentRegistrationStep: 2,
        },
      });
      setItemToLocalStorage('signatures', { signature, key });
      queryClient.invalidateQueries(QUERY_KEYS.getVoterClaimedProfilesKey);
      router.push(`/dreps/workflow/profile/update/step2`);
    } catch (error) {
      addErrorAlert('Error Creating DRep Profile!');
      console.log(error);
    }
  };
  const onError = (err: any) => {
    console.log(err);
  };
  return (
    <div className="flex w-full flex-col gap-5 p-10">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold text-zinc-800">
          Create Your DRep Campaign
        </h1>
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
        <p className="text-base font-normal text-gray-800">
          Completing your profile will update your cip 119 on-chain DRep
          metadata.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(handleSubmitForm, onError)}
        encType="multipart/form-data"
      >
        <NewProfileForm
          register={register}
          control={control}
          errors={errors}
          setProfileUrl={setValue}
          currentProfileUrl={currentProfileUrl}
          isDisabled={!isConnected || isFetchingMetadataForClaim}
        />
      </form>
    </div>
  );
};

export default NewProfile;
