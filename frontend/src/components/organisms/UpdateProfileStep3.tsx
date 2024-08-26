import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { usePostUpdateDrepMutation } from '@/hooks/usePostUpdateDRepMutation';
import { drepInput } from '@/models/drep';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getItemFromIndexedDB, setItemToIndexedDB } from '@/lib/indexedDb';
import { getItemFromLocalStorage } from '@/lib';
import { processExternalMetadata } from '@/lib/metadataProcessor';
import { renderJsonldValue } from '../atoms/MetadataViewer';
import { blake2bHex } from 'blakejs';
const FormSchema = z.object({
  statement: z.string(),
});
type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep3 = () => {
  const { register, handleSubmit, getValues, setValue } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const { dRepIDBech32 } = useCardano();
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const {
    setIsNotDRepErrorModalOpen,
    drepId,
    setStep3Status,
    setNewDrepId,
    metadataJsonLd,
    setMetadataJsonLd,
  } = useDRepContext();
  const { addChangesSavedAlert, addSuccessAlert } = useGlobalNotifications();
  useEffect(() => {
    const getDRep = () => {
      try {
        if (!metadataJsonLd) return;
        const metadataBody = metadataJsonLd?.body;
        setValue('statement', renderJsonldValue(metadataBody?.motivations));
        //map through the metadata and set the current metadata for each exisitng field
        const isUpdating = getItemFromLocalStorage('isUpdating');
        if (isUpdating) {
          addSuccessAlert('Draft restored!');
        }
        return;
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      if (Boolean(getValues('statement'))) {
        setStep3Status('success');
      } else setStep3Status('pending');
    };
  }, [metadataJsonLd]);

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      if (!dRepIDBech32 || dRepIDBech32 == '') {
        setIsNotDRepErrorModalOpen(true);
        return;
      }
      let submittingMetadataJsonLd = metadataJsonLd;
      //get existing metadata
      //update the motivations field
      //save the metadata locally
      const hasExistingMotivations =
        submittingMetadataJsonLd?.body?.motivations;
      if (hasExistingMotivations) {
        submittingMetadataJsonLd.body.motivations['@value'] = data.statement;
      } else {
        submittingMetadataJsonLd.body.motivations = {
          '@value': data.statement,
        };
      }
      //since its one field, we can just hash directly
      const jsonHash = await blake2bHex(
        JSON.stringify(submittingMetadataJsonLd),
        undefined,
        32,
      );
      setMetadataJsonLd(submittingMetadataJsonLd);
      await setItemToIndexedDB('metadataJsonLd', submittingMetadataJsonLd);
      await setItemToIndexedDB('metadataJsonHash', jsonHash);
      addChangesSavedAlert();
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
        <h1 className="text-4xl font-bold text-zinc-800">Your Statement</h1>
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
          Write down your statement. This is optional
        </p>
      </div>
      <form id="profile_form" onSubmit={handleSubmit(saveProfile, onError)}>
        <div className="flex flex-col gap-1">
          <label>Statement</label>
          <textarea
            className={`min-h-20 rounded-lg border border-zinc-100 py-3 pl-5 pr-3`}
            {...register('statement')}
            placeholder="Your statement"
          />
        </div>
        <ProfileSubmitArea isUpdate />
      </form>
    </div>
  );
};

export default UpdateProfileStep3;
