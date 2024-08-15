import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SubmitHandler, useForm } from 'react-hook-form';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { getItemFromLocalStorage, removeItemFromLocalStorage } from '@/lib';
import MetadataEditor from '../atoms/MetadataEditor';
import MetadataViewer from '../atoms/MetadataViewer';
import Button from '../atoms/Button';
import SubmitMetadataModal from '../atoms/SubmitMetadataModal';
import { useRouter } from 'next/navigation';
import { processExternalMetadata } from '@/lib/metadataProcessor';
const FormSchema = z.object({
  metadata: z.string().optional(),
});
type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep5 = () => {
  const { register, handleSubmit, getValues, formState, setValue } =
    useForm<InputType>({
      resolver: zodResolver(FormSchema),
    });
  const { dRepIDBech32, stakeKey } = useCardano();
  const {
    setIsNotDRepErrorModalOpen,
    drepId,
    setStep5Status,
    setNewDrepId,
    setCurrentRegistrationStep,
  } = useDRepContext();
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);
  const [jsonHash, setJsonHash] = useState<string | null>(null);
  const [isAwaitingSubmission, setIsAwaitingSubmission] = useState(false);
  const { addChangesSavedAlert, addSuccessAlert } = useGlobalNotifications();
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [metadataJson, setMetadataJson] = useState(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    setCurrentRegistrationStep(5);
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
      } catch (error) {
        console.log(error);
        setMetadata(null);
        setMetadataError('Metadata Unprocessable');
      } finally {
        setIsMetadataLoading(false);
      }
    };
    getDRep();
    return () => {
      if (Boolean(getValues('metadata'))) {
        setStep5Status('success');
      } else setStep5Status('pending');
    };
  }, [dRepIDBech32]);

  useEffect(() => {
    const processMetadata = async () => {
      try {
        setIsMetadataLoading(true);
        //before fetching try to get from local storage, and if isUpdating is true, preventing unnecessary fetch and later, txs
        const isUpdating = getItemFromLocalStorage('isUpdating');
        if (isUpdating) {
          const locallySavedMetadata = getItemFromLocalStorage('metadataJson');
          const locallySavedJsonld = getItemFromLocalStorage('metadataJsonLd');
          const locallySavedHash = getItemFromLocalStorage('metadataJsonHash');
          setMetadataJson(locallySavedMetadata);
          setMetadata(locallySavedJsonld);
          setJsonHash(locallySavedHash);
          setValue('metadata', JSON.stringify(locallySavedMetadata));
          setIsMetadataLoading(false);
          return;
        }
        if (!metadataUrl) {
          setIsMetadataLoading(false);
          return;
        }
        //else fetch metadata
        const { jsonLdData, modifiedJson } = await processExternalMetadata({
          metadataUrl,
        });
        setMetadataJson(modifiedJson);
        setMetadata(jsonLdData);
        setValue('metadata', JSON.stringify(modifiedJson));
        if (jsonLdData) {
          setStep5Status('update');
        } else setStep5Status('active');
        setIsMetadataLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    processMetadata();
  }, [metadataUrl, refresh]);
  const resetDraft=()=>{
    removeItemFromLocalStorage('isUpdating');
    removeItemFromLocalStorage('metadataJson');
    removeItemFromLocalStorage('metadataJsonLd');
    removeItemFromLocalStorage('metadataJsonHash');
  }
  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      if (!dRepIDBech32 || dRepIDBech32 == '') {
        setIsNotDRepErrorModalOpen(true);
        return;
      }
      //is local change
      if (getItemFromLocalStorage('isUpdating')) {
        setIsSubmittingMetadata(true);
        setIsAwaitingSubmission(true);
      }else{
        //just redirect to success page
        router.push('/dreps/workflow/profile/success');
      }
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
        <h1 className="text-4xl font-bold text-zinc-800">Your metadata</h1>
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
          Complete your profile by submitting your metadata. You can include
          extra fields. This may or may not be supported in GovTool.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        <MetadataViewer
          metadata={metadata}
          metadataError={metadataError}
          isMetadataLoading={isMetadataLoading}
        />
        <Button className="w-fit" handleClick={() => setCanEdit(true)}>
          Edit Metadata
        </Button>
      </div>
      <form id="profile_form" onSubmit={handleSubmit(saveProfile, onError)}>
        <div className="flex flex-col gap-1">
          {canEdit && (
            <MetadataEditor
              drepId={drepId}
              onClose={() => {
                setCanEdit(false);
              }}
              initialMetadata={metadataJson}
              onSuccessfulSubmit={() => {
                setRefresh(!refresh);
              }}
            />
          )}
          {isSubmittingMetadata && (
            <SubmitMetadataModal
              onClose={() => setIsSubmittingMetadata(false)}
              onSuccessfulSubmit={() => {
                if (isAwaitingSubmission) {
                  addSuccessAlert(
                    'Metadata updated successfully. It will probably take few minutes to reflect',
                  );
                  resetDraft();
                  router.push('/dreps/workflow/profile/success');

                }
              }}
            />
          )}
        </div>
        <ProfileSubmitArea isUpdate />
      </form>
    </div>
  );
};

export default UpdateProfileStep5;
