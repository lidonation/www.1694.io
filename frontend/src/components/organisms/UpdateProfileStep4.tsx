import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { getItemFromLocalStorage, removeItemFromLocalStorage } from '@/lib';
import MetadataEditor from '../atoms/MetadataEditor';
import MetadataViewer from '../atoms/MetadataViewer';
import Button from '../atoms/Button';
import SubmitMetadataModal from '../atoms/SubmitMetadataModal';
import { useRouter } from 'next/navigation';
import { renderJSONLDToJSONArr } from '@/lib/metadataProcessor';
import { deleteItemFromIndexedDB } from '@/lib/indexedDb';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { useWallet } from '@/context/globalContext';
const FormSchema = z.object({
  metadata: z.string().optional(),
});
type InputType = z.infer<typeof FormSchema>;

const UpdateProfileStep4 = () => {
  const {
    user: {
      dRepClaimInfo: { dRepIDToClaimBech32, dRepToBeClaimedJsonLd },
    },
    setUserInfo,
    handleRefreshUserJsonLd,
  } = useWallet();
  const { handleSubmit, setValue } = useForm<InputType>({
    resolver: zodResolver(FormSchema),
  });
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);
  const { addChangesSavedAlert, addSuccessAlert } = useGlobalNotifications();
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataJson, setMetadataJson] = useState(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const processMetadata = async () => {
      try {
        if (!dRepToBeClaimedJsonLd) {
          setUserInfo({
            dRepClaimProgress: {
              [ProfileWorkflowStepKey.REVIEW]: 'pending',
            },
          });
          return;
        }
        setIsMetadataLoading(true);
        const convertedMetadata = renderJSONLDToJSONArr(dRepToBeClaimedJsonLd);
        setMetadataJson(convertedMetadata);
        setMetadata(dRepToBeClaimedJsonLd);
        setValue('metadata', JSON.stringify(convertedMetadata));
        setUserInfo({
          dRepClaimProgress: {
            [ProfileWorkflowStepKey.REVIEW]: 'active',
          },
        });
        return;
      } catch (error) {
        console.log(error);
        setMetadata(null);
        setMetadataError('Metadata Unprocessable');
      } finally {
        setIsMetadataLoading(false);
      }
    };
    processMetadata();
    return () => {
      if (metadata) {
        setUserInfo({
          dRepClaimProgress: {
            [ProfileWorkflowStepKey.REVIEW]: 'success',
          },
        });
      } else {
        setUserInfo({
          dRepClaimProgress: {
            [ProfileWorkflowStepKey.REVIEW]: 'pending',
          },
        });
      }
    };
  }, [dRepToBeClaimedJsonLd, refresh]);

  const resetDraft = async () => {
    removeItemFromLocalStorage('isUpdating');
    await deleteItemFromIndexedDB('metadataJsonLd');
    await deleteItemFromIndexedDB('metadataJsonHash');
  };

  const saveProfile: SubmitHandler<InputType> = async (data) => {
    try {
      //is local change
      if (getItemFromLocalStorage('isUpdating')) {
        setIsSubmittingMetadata(true);
      } else {
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

  const handleSuccessfulSubmit = (hash?: string) => {
    addSuccessAlert(
      'Metadata updated successfully. It will probably take a few minutes to reflect',
    );
    resetDraft();

    if (hash) {
      router.push(`/dreps/workflow/profile/success?hash=${hash}`);
    } else {
      router.push('/dreps/workflow/profile/success');
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 px-10 py-5">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold text-zinc-800">Your metadata</h1>
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
              onClose={() => {
                setCanEdit(false);
              }}
              initialMetadata={metadataJson}
              onSuccessfulSubmit={() => {
                handleRefreshUserJsonLd();
                setRefresh(!refresh);
              }}
            />
          )}
          {isSubmittingMetadata && (
            <SubmitMetadataModal
              onClose={() => setIsSubmittingMetadata(false)}
              onSuccessfulSubmit={handleSuccessfulSubmit}
              metadataType="drepUpdate"
            />
          )}
        </div>
        <ProfileSubmitArea isUpdate />
      </form>
    </div>
  );
};

export default UpdateProfileStep4;
