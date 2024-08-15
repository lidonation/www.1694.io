import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import UpdateProfileForm from '../molecules/UpdateProfileForm';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { usePostUpdateDrepMutation } from '@/hooks/usePostUpdateDRepMutation';
import { drepInput } from '@/models/drep';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { v4 as uuidv4 } from 'uuid';
import { renderJsonldValue } from '../atoms/MetadataViewer';
import { getItemFromLocalStorage, setItemToLocalStorage } from '@/lib';
import {
  processExternalMetadata,
  submitMetadata,
} from '@/lib/metadataProcessor';
const FormSchema = z.object({
  profileName: z.string().min(1, { message: 'Profile name is required' }),
  profileEmail: z.string().min(1, { message: 'Email is required' }),
  profileBio: z.string().min(1, { message: 'You need to fill in your bio' }),
  profileUrl: z.any(),
});
type InputType = z.infer<typeof FormSchema>;

const UpdateProfile = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const { dRepIDBech32, loginSignTransaction } = useCardano();
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(
    null,
  );
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState({
    dRepName: '',
    bio: '',
    email: '',
    references: '',
  });
  const { setIsNotDRepErrorModalOpen, drepId, setStep1Status, setNewDrepId, setCurrentRegistrationStep } =
    useDRepContext();
  const { addSuccessAlert } = useGlobalNotifications();
  const updateDrepMutation = usePostUpdateDrepMutation();
  useEffect(() => {
    setCurrentRegistrationStep(1);
    const getDRep = async () => {
      try {
        let drep;
        if (drepId) {
          drep = await getSingleDRep(drepId);
        } else if (dRepIDBech32) {
          drep = await getSingleDRepViaVoterId(dRepIDBech32);
        }
        if (drep?.cexplorerDetails?.metadata_url) {
          setMetadataUrl(drep.cexplorerDetails.metadata_url);
        }
        setNewDrepId(drep?.drep_id);
        setCurrentProfileUrl(drep?.attachment_url);
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      setStep1Status('success');
    };
  }, [dRepIDBech32]);
  useEffect(() => {
    const restoreDraftIfAny = async () => {
      try {
        //before fetching try to get from local storage, and if isUpdating is true, preventing unnecessary fetch and later, txs
        const isUpdating = getItemFromLocalStorage('isUpdating');
        if (isUpdating) {
          const locallySavedJsonld = getItemFromLocalStorage('metadataJsonLd');
          const metadataBody = locallySavedJsonld?.body;
          setValue('profileName', renderJsonldValue(metadataBody?.dRepName));
          setValue('profileBio', renderJsonldValue(metadataBody?.bio));
          setValue('profileEmail', renderJsonldValue(metadataBody?.email));
          setCurrentMetadata({
            dRepName: renderJsonldValue(metadataBody?.dRepName),
            bio: renderJsonldValue(metadataBody?.bio),
            email: renderJsonldValue(metadataBody?.email),
            references: metadataBody?.references,
          });
          addSuccessAlert('Draft restored!');
          return;
        }
        if (!metadataUrl) return;
        //else fetch metadata
        const { jsonLdData } = await processExternalMetadata({
          metadataUrl,
        });
        const jsonLdDataBody = jsonLdData?.body;
        setValue('profileName', renderJsonldValue(jsonLdDataBody?.dRepName));
        setValue('profileBio', renderJsonldValue(jsonLdDataBody?.bio));
        setValue('profileEmail', renderJsonldValue(jsonLdDataBody?.email));
        setCurrentMetadata({
          dRepName: renderJsonldValue(jsonLdDataBody?.dRepName),
          bio: renderJsonldValue(jsonLdDataBody?.bio),
          email: renderJsonldValue(jsonLdDataBody?.email),
          references: jsonLdDataBody?.references,
        });
      } catch (error) {
        console.log(error);
      }
    };
    restoreDraftIfAny();
  }, [metadataUrl]);

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      if (!dRepIDBech32 || dRepIDBech32 == '') {
        setIsNotDRepErrorModalOpen(true);
        return;
      }
      //if previous data doesnt match with current data, set isUpdating to true
      if (
        currentMetadata?.dRepName !== data.profileName ||
        currentMetadata?.bio !== data.profileBio ||
        currentMetadata?.email !== data.profileEmail
      ) {
        const metadataJson = {
          dRepName: data.profileName,
          bio: data.profileBio,
          email: data.profileEmail,
          references: JSON.stringify(currentMetadata?.references),
        };
        const modifiedJson = Object.entries(metadataJson).map(
          ([key, value]: any[]) => {
            return { id: uuidv4(), key: key, value: value };
          },
        );
        const metadataKeys = Object.keys(metadataJson);
        //submit the metadata
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          metadataJson as any,
          loginSignTransaction,
        );
        setItemToLocalStorage('metadataJson', modifiedJson);
        setItemToLocalStorage('metadataJsonLd', jsonld);
        setItemToLocalStorage('metadataJsonHash', jsonHash);
        setItemToLocalStorage('isUpdating', 'true');
      }
      const formData = new FormData();
      if (data.profileUrl) {
        formData.append('profileUrl', data?.profileUrl[0] as string);
      }
      await updateDrepMutation.mutateAsync({
        drepId: drepId,
        drep: formData as drepInput,
      });
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
        {dRepIDBech32 && (
          <div className="flex flex-row flex-wrap gap-1 lg:flex-nowrap">
            <span className="w-full break-words text-slate-500 lg:w-fit">
              {dRepIDBech32}
            </span>
            <CopyToClipboard
              text={dRepIDBech32}
              onCopy={() => {
                console.log('copied!');
              }}
              className="clipboard-text cursor-pointer"
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
