import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import UpdateProfileForm from '../molecules/UpdateProfileForm';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import {
  getItemFromLocalStorage,
  renderJsonLdValue,
  setItemToLocalStorage,
  sha256,
} from '@/lib';
import { submitMetadata } from '@/lib/metadataProcessor';
import { DRepMetadata, IPFSResponse } from '../../../types/commonTypes';
import { setItemToIndexedDB } from '@/lib/indexedDb';
import { postAddAttachmentToIPFS } from '@/services/requests/postAttachmentToIPFS';
import { urls } from '@/constants';
import { PREDEFINED_KEYS } from './NewProfile';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { useWallet } from '@/context/globalContext';
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

const UpdateProfile = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const {
    user: {
      dRepClaimInfo: { dRepToBeClaimedJsonLd, dRepIDToClaimBech32 },
    },
    setUserInfo,
    handleRefreshUserJsonLd,
    loginSignTransaction,
    wallet: { address },
  } = useWallet();
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(
    null,
  );
  const [currentMetadata, setCurrentMetadata] = useState(null);
  const { addSuccessAlert } = useGlobalNotifications();

  useEffect(() => {
    const getDRep = () => {
      try {
        if (!dRepToBeClaimedJsonLd) return;
        const metadataBody = dRepToBeClaimedJsonLd?.body;
        setValue('profileName', renderJsonLdValue(metadataBody?.givenName));
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
          renderJsonLdValue(metadataBody?.image?.contentUrl),
        );
        //map through the metadata and set the current metadata for each exisitng field
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
        const isUpdating = getItemFromLocalStorage('isUpdating');
        if (isUpdating) {
          addSuccessAlert('Draft restored!');
        }
        if (Boolean(getValues('profileName'))) {
          setUserInfo({
            dRepClaimProgress: {
              [ProfileWorkflowStepKey.PROFILE]: 'update',
            },
          });
        } else {
          setUserInfo({
            dRepClaimProgress: {
              [ProfileWorkflowStepKey.PROFILE]: 'active',
            },
          });
        }
        return;
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      setUserInfo({
        dRepClaimProgress: {
          [ProfileWorkflowStepKey.PROFILE]: 'success',
        },
      });
    };
  }, [dRepToBeClaimedJsonLd]);

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      //if previous data doesnt match with current data, set isUpdating to true
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
        //add the preexisitgn image if it exists
        if (currentMetadata?.image) {
          metadataJson['image'] = currentMetadata.image;
        }

        if (data.profileUrl) {
          let imageFile: File | null = null;

          if (typeof data.profileUrl !== 'string') {
            if (data.profileUrl instanceof FileList) {
              if (data.profileUrl.length > 0) {
                imageFile = data.profileUrl[0];
              }
            } else {
              // instance of File object
              imageFile = data.profileUrl;
            }
          }

          if (imageFile) {
            // upload image to ipfs first (File format)
            const formData = new FormData();
            formData.append('attachment', imageFile);
            const { ipfs_hash }: IPFSResponse = await postAddAttachmentToIPFS({
              attachment: formData,
            });
            const imageUrl = `${urls.ipfsGateway}/ipfs/${ipfs_hash}`;
            // hash the image to sha256
            const imageHash = await sha256(imageFile);
            metadataJson['image'] = {
              contentUrl: imageUrl,
              sha256: imageHash,
            };
          } else if (typeof data.profileUrl === 'string') {
            // If it's a string, assume it's an existing URL
            metadataJson['image'] = {
              contentUrl: decodeURIComponent(data?.profileUrl).replace(
                /^"|"$/g, // sanitize the url
                '',
              ),
              sha256:
                String(currentMetadata?.image?.sha256).replace(
                  /^"|"$/g, // sanitize the url
                  '',
                ) || '',
            };
          }
        }
        const metadataKeys = Object.keys(metadataJson);
        //submit the metadata
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          metadataJson as any,
          loginSignTransaction,
        );
        // after saving to blockchain, save to indexedDB in jOSN format
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        setItemToLocalStorage('isUpdating', 'true');
        await handleRefreshUserJsonLd();
      }

      addSuccessAlert('Draft saved!');
    } catch (error) {
      console.log(error);
    }
  };
  const onError = (err) => {
    console.log(err);
  };
  return (
    <div className="flex w-full flex-col gap-5 px-10 py-5">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold text-zinc-800">
          Update your Profile
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
          Updating your profile is not mandatory, unless you want to become a
          DRep.
        </p>
      </div>
      <form id="profile_form" onSubmit={handleSubmit(saveProfile, onError)}>
        <UpdateProfileForm
          register={register}
          control={control}
          errors={errors}
          setProfileUrl={setValue}
          currentProfileUrl={currentProfileUrl}
        />
      </form>
    </div>
  );
};

export default UpdateProfile;
