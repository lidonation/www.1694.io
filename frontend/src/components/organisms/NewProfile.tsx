import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import NewProfileForm from '../molecules/NewProfileForm';
import { usePostNewDrepMutation } from '@/hooks/usePostNewDRepMutation';
import { drepInput } from '@/models/drep';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { setItemToLocalStorage } from '@/lib';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { getExternalMetadata } from '@/services/requests/postExternalMetadataUrl';
import { renderJsonldValue } from '../atoms/MetadataViewer';
import { submitMetadata } from '@/lib/metadataProcessor';
const FormSchema = z.object({
  profileName: z.string().min(1, { message: 'Profile name is required' }),
  profileEmail: z.string().min(1, { message: 'Profile email is required' }),
  profileBio: z.string().min(1, { message: 'Profile bio is required' }),
  profileUrl: z.any(),
});
type InputType = z.infer<typeof FormSchema>;

const NewProfile = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const { dRepIDBech32, stakeKey, loginSignTransaction } = useCardano();
  const { addSuccessAlert, addErrorAlert } = useGlobalNotifications();
  const [currentMetadata, setCurrentMetadata] = useState({
    dRepName: '',
    bio: '',
    email: '',
    references: '',
  });
  const router = useRouter();
  const newDRepMutation = usePostNewDrepMutation();
  const {
    setIsNotDRepErrorModalOpen,
    setNewDrepId,
    setCurrentRegistrationStep,
    setIsLoggedIn
  } = useDRepContext();
  useEffect(() => {
    // Get DRep details from the blockchain, and set the profile name if it exists
    const getDRep = async () => {
      try {
        if(!dRepIDBech32) return;
        let drep= await getSingleDRepViaVoterId(dRepIDBech32);
        if (drep?.cexplorerDetails?.metadata_url) {
          try {
            const res = await getExternalMetadata({
              metadataUrl: drep.cexplorerDetails.metadata_url,
            });
            const metadataBody = res?.body;
            setValue('profileName', renderJsonldValue(metadataBody?.dRepName));
            setValue('profileEmail', renderJsonldValue(metadataBody?.email));
            setValue('profileBio', renderJsonldValue(metadataBody?.bio));
            setCurrentMetadata({
              dRepName: renderJsonldValue(metadataBody?.dRepName),
              bio: renderJsonldValue(metadataBody?.bio),
              email: renderJsonldValue(metadataBody?.email),
              references: metadataBody?.references || [],
            });
          } catch (error) {
            console.log(error);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
  }, [dRepIDBech32]);
  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      if (!dRepIDBech32 || dRepIDBech32 == '') {
        setIsNotDRepErrorModalOpen(true);
        return;
      }
      const { signature, key } = await loginSignTransaction();
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
        const vkeys={
          signature,
          vkey: key
        }
        //submit the metadata
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          metadataJson as any,
          loginSignTransaction,
          vkeys
        );
        setItemToLocalStorage('metadataJson', modifiedJson);
        setItemToLocalStorage('metadataJsonLd', jsonld);
        setItemToLocalStorage('metadataJsonHash', jsonHash);
        setItemToLocalStorage('isUpdating', 'true');
      }
      const stakeAddress = Address.from_bytes(
        Buffer.from(stakeKey, 'hex'),
      ).to_bech32();
      const formData = new FormData();
      formData.append('stake_addr', stakeAddress);
      formData.append('voter_id', dRepIDBech32);
      formData.append('signature', signature);
      formData.append('key', key);
      if (data.profileUrl) {
        formData.append('profileUrl', data?.profileUrl[0] as string);
      }
      const res = await newDRepMutation.mutateAsync({
        drep: formData as drepInput,
      });
      const { insertedDrep, token } = res;
      setNewDrepId(insertedDrep.raw[0].id);
      setCurrentRegistrationStep(2);
      addSuccessAlert('DRep Profile Created Successfully!');
      setItemToLocalStorage('token', token);
      setIsLoggedIn(true);
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
          Completing your profile is not mandatory, unless you want to become a
          DRep.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(saveProfile, onError)}
        encType="multipart/form-data"
      >
        <NewProfileForm
          register={register}
          control={control}
          errors={errors}
          setProfileUrl={setValue}
        />
      </form>
    </div>
  );
};

export default NewProfile;
