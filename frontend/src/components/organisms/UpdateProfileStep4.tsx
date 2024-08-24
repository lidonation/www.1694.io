import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { getItemFromLocalStorage, setItemToLocalStorage } from '@/lib';
import {
  processExternalMetadata,
  renderJSONLDToJSON,
  submitMetadata,
} from '@/lib/metadataProcessor';
import {
  FACEBOOK_REGEX,
  GITHUB_REGEX,
  INSTAGRAM_REGEX,
  TWITTER_REGEX,
} from '@/constants';
import { getItemFromIndexedDB, setItemToIndexedDB } from '@/lib/indexedDb';
import { blake2bHex } from 'blakejs';
const FormSchema = z.object({
  github: z
    .string()
    .nullable()
    .refine((val) => val === null || val === '' || GITHUB_REGEX.test(val), {
      message: 'Invalid Github URL',
    }),
  x: z
    .string()
    .nullable()
    .refine((val) => val === null || val === '' || TWITTER_REGEX.test(val), {
      message: 'Invalid Twitter URL',
    }),
  facebook: z
    .string()
    .nullable()
    .refine((val) => val === null || val === '' || FACEBOOK_REGEX.test(val), {
      message: 'Invalid Facebook URL',
    }),
  instagram: z
    .string()
    .nullable()
    .refine((val) => val === null || val === '' || INSTAGRAM_REGEX.test(val), {
      message: 'Invalid Instagram URL',
    }),
});
type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep4 = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const { dRepIDBech32, loginSignTransaction } = useCardano();
  const { setIsNotDRepErrorModalOpen, setStep4Status, metadataJsonLd, setMetadataJsonLd } =
    useDRepContext();
  const { addChangesSavedAlert, addSuccessAlert } = useGlobalNotifications();
  const retrieveLink = (link: string, metadataReferences: any[]) => {
    return (
      metadataReferences.find((ref) => ref.label?.['@value'].includes(link))
        ?.uri?.['@value'] || ''
    );
  };

  useEffect(() => {
    const getDRep = () => {
      try {
        if (!metadataJsonLd) return;
        const metadataBody = metadataJsonLd?.body;
        const metadataReferences = (metadataBody?.references as any[]) || [];
        setValue('github', retrieveLink('github', metadataReferences));
        setValue('x', retrieveLink('x', metadataReferences));
        setValue('facebook', retrieveLink('facebook', metadataReferences));
        setValue('instagram', retrieveLink('instagram', metadataReferences));
        //map through the metadata and set the current metadata for each exisitng field
        const isUpdating = getItemFromLocalStorage('isUpdating');
        if (isUpdating) {
          addSuccessAlert('Draft restored!');
        }
        if (
          Boolean(getValues('github')) ||
          Boolean(getValues('x')) ||
          Boolean(getValues('facebook')) ||
          Boolean(getValues('instagram'))
        ) {
          setStep4Status('update');
        }
        return;
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      if (
        Boolean(getValues('github')) ||
        Boolean(getValues('x')) ||
        Boolean(getValues('facebook')) ||
        Boolean(getValues('instagram'))
      ) {
        setStep4Status('success');
      } else setStep4Status('pending');
    };
  }, [metadataJsonLd]);

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      let toBeSubmittedMetadataJsonLd = metadataJsonLd;
      if (!dRepIDBech32 || dRepIDBech32 == '') {
        setIsNotDRepErrorModalOpen(true);
        return;
      }
      const references = [];
      const links = getValues();
      for (const link in links) {
        if (links[link] !== null && links[link] !== '') {
          references.push({
            label: link,
            uri: links[link],
          });
        }
      }
      const hasExistingReferences = metadataJsonLd?.body?.references;
      if (!hasExistingReferences) {
        toBeSubmittedMetadataJsonLd.body = {
          ...toBeSubmittedMetadataJsonLd.body,
          references: references,
        };
        const toBeSubmittedMetadata = renderJSONLDToJSON(
          toBeSubmittedMetadataJsonLd,
        );
        toBeSubmittedMetadata['references'] = references;
        const metadataKeys = Object.keys(toBeSubmittedMetadataJsonLd.body);
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          toBeSubmittedMetadata as any,
          loginSignTransaction,
        );
        setMetadataJsonLd(jsonld);
        setItemToLocalStorage('isUpdating', 'true');
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        addChangesSavedAlert();
        return;
      } else {
        const existingMetadataReferences =
          toBeSubmittedMetadataJsonLd?.body?.references || [];
        const modifiedExisting = existingMetadataReferences.map((ref) => {
          return {
            label: ref.label?.['@value'],
            uri: ref.uri?.['@value'],
          };
        });
        //add the new references to the existing references, checking for duplicate keys
        const newReferences = references.filter(
          (ref) =>
            !modifiedExisting.find(
              (existingRef) => existingRef?.label == ref.label,
            ),
        );
        const updatedReferences = [
          ...existingMetadataReferences,
          ...newReferences,
        ];
        const metadataKeys = Object.keys(toBeSubmittedMetadataJsonLd.body);
        const toBeSubmittedMetadata = renderJSONLDToJSON(
          toBeSubmittedMetadataJsonLd,
        );
        toBeSubmittedMetadata['references'] = updatedReferences;
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          toBeSubmittedMetadata as any,
          loginSignTransaction,
        );
        setItemToLocalStorage('isUpdating', 'true');
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        addChangesSavedAlert();
      }
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
        <h1 className="text-4xl font-bold text-zinc-800">Social Media</h1>
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
          Share your social media links as this will increase the credibility of
          your profile. This will be a part of your metadata.
        </p>
      </div>
      <form id="profile_form" onSubmit={handleSubmit(saveProfile, onError)}>
        <div className="flex flex-col gap-1">
          <label>Github</label>
          <input
            type="text"
            className={`rounded-full border border-zinc-100 py-3 pl-5 pr-3`}
            {...register('github')}
            placeholder="Paste your github url here"
          />
          <div className="text-sm text-red-700" data-testid="error-msg">
            {errors?.github && errors?.github?.message}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label>X</label>
          <input
            type="text"
            className={`rounded-full border border-zinc-100 py-3 pl-5 pr-3`}
            {...register('x')}
            placeholder="Paste your x url here"
          />
          <div className="text-sm text-red-700" data-testid="error-msg">
            {errors?.x && errors?.x?.message}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label>Facebook</label>
          <input
            type="text"
            className={`rounded-full border border-zinc-100 py-3 pl-5 pr-3`}
            {...register('facebook')}
            placeholder="Paste your facebook url here"
          />
          <div className="text-sm text-red-700" data-testid="error-msg">
            {errors?.facebook && errors?.facebook?.message}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label>Instagram</label>
          <input
            type="text"
            className={`rounded-full border border-zinc-100 py-3 pl-5 pr-3`}
            {...register('instagram')}
            placeholder="Paste your instagram url here"
          />
          <div className="text-sm text-red-700" data-testid="error-msg">
            {errors?.instagram && errors?.instagram?.message}
          </div>
        </div>
        <ProfileSubmitArea isUpdate />
      </form>
    </div>
  );
};

export default UpdateProfileStep4;
