import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import { getItemFromLocalStorage, setItemToLocalStorage } from '@/lib';
import {
  renderJSONLDToJSON,
  renderJSONLDToJSONArr,
  submitMetadata,
} from '@/lib/metadataProcessor';
import { setItemToIndexedDB } from '@/lib/indexedDb';
import { HtmlTooltip } from '../atoms/HoverChip';
import Button from '../atoms/Button';
import CopyToClipboard from '../atoms/CopyToClipboard';
import { ProfileWorkflowStepKey } from '@/lib/enums';
const UpdateProfileStep3 = () => {
  const { dRepIDBech32, loginSignTransaction } = useCardano();

  const [errors, setErrors] = useState({});
  const [referencesArr, setReferencesArr] = useState([]);
  const { metadataJsonLd, handleRefresh, updateStep, ownership } =
    useDRepContext();
  const { addChangesSavedAlert, addSuccessAlert } = useGlobalNotifications();

  useEffect(() => {
    const getDRep = () => {
      let availableReferences = [];
      try {
        if (!metadataJsonLd) return;
        const metadataJson = renderJSONLDToJSONArr(metadataJsonLd);
        const referencesData = metadataJson.find(
          (item) => item.key === 'references',
        );
        if (referencesData) {
          try {
            availableReferences = referencesData.value;
            setReferencesArr(availableReferences);
          } catch (error) {
            console.error('Error parsing references:', error);
            setReferencesArr([]);
          }
        }
        //map through the metadata and set the current metadata for each exisitng field
        if (getItemFromLocalStorage('isUpdating')) {
          addSuccessAlert('Draft restored!');
        }
        if (availableReferences.length > 0) {
          updateStep(ProfileWorkflowStepKey.SOCIALS, 'update');
        } else updateStep(ProfileWorkflowStepKey.SOCIALS, 'active');
        return;
      } catch (error) {
        console.log(error);
      }
    };
    getDRep();
    return () => {
      if (referencesArr.length > 0) {
        updateStep(ProfileWorkflowStepKey.SOCIALS, 'success');
      } else updateStep(ProfileWorkflowStepKey.SOCIALS, 'pending');
    };
  }, [metadataJsonLd]);

  const handleAddReference = () => {
    setReferencesArr([...referencesArr, { id: uuidv4(), key: '', value: '' }]);
  };

  const handleReferenceChange = (id, field, value) => {
    setReferencesArr(
      referencesArr.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleDeleteReference = (id) => {
    setReferencesArr(referencesArr.filter((item) => item.id !== id));
  };

  const validateAndSave = async (e?: React.FormEvent) => {
    try {
      if (e?.preventDefault) {
        e.preventDefault();
      }
      const newErrors = {};
      let hasErrors = false;
      referencesArr.forEach((item) => {
        newErrors[item.id] = {};
        if (!item.key.trim()) {
          newErrors[item.id].key = 'Key cannot be empty';
          hasErrors = true;
        } else if (/\s/.test(item.key)) {
          newErrors[item.id].key = 'Key cannot contain spaces';
          hasErrors = true;
        }
        if (!item.value.trim()) {
          newErrors[item.id].value = 'Value cannot be empty';
          hasErrors = true;
        }
      });

      setErrors(newErrors);
      if (!hasErrors) {
        await saveProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const saveProfile = async () => {
    try {
      let toBeSubmittedMetadataJsonLd = metadataJsonLd;
      const signatures = ownership?.signatures.map((sig) => {
        return {
          signature: sig.signature,
          vkey: sig.key,
        };
      })?.[0];
      const references = [];
      const links = referencesArr.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
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
          signatures
        );
        setItemToLocalStorage('isUpdating', 'true');
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        await handleRefresh();
        addChangesSavedAlert();
        return;
      } else {
        const existingMetadataReferences =
          toBeSubmittedMetadataJsonLd?.body?.references || [];
        const modifiedExisting = existingMetadataReferences.map((ref) => {
          return {
            label: ref.label?.['@value'] || ref.label,
            uri: ref.uri?.['@value'] || ref.uri,
          };
        });
        //add the new references to the existing references, checking for duplicate keys
        const newReferences = references.filter(
          (ref) =>
            !modifiedExisting.find(
              (existingRef) => existingRef?.label == ref.label,
            ),
        );
        const previousReferences = references.filter((ref) =>
          modifiedExisting.find(
            (existingRef) => existingRef?.label == ref.label,
          ),
        );
        const updatedReferences = [...previousReferences, ...newReferences];
        const metadataKeys = Object.keys(toBeSubmittedMetadataJsonLd.body);
        const toBeSubmittedMetadata = renderJSONLDToJSON(
          toBeSubmittedMetadataJsonLd,
        );
        toBeSubmittedMetadata['references'] = updatedReferences;
        const { jsonHash, jsonld } = await submitMetadata(
          metadataKeys,
          toBeSubmittedMetadata as any,
          loginSignTransaction,
          signatures
        );
        setItemToLocalStorage('isUpdating', 'true');
        await setItemToIndexedDB('metadataJsonLd', jsonld);
        await setItemToIndexedDB('metadataJsonHash', jsonHash);
        await handleRefresh();
        addChangesSavedAlert();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 px-10 py-5">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold text-zinc-800">Social Media</h1>
        {dRepIDBech32 && (
          <div className="flex flex-row flex-wrap gap-1 lg:flex-nowrap">
            <CopyToClipboard
              text={dRepIDBech32}
              textStyles="w-full break-words text-slate-500 lg:w-fit"
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
      <form id="profile_form">
        {referencesArr &&
          referencesArr.map(({ id, key, value }, index) => (
            <div key={index} className="mb-4">
              <div className="my-2 flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) =>
                    handleReferenceChange(id, 'key', e.target.value)
                  }
                  placeholder="Key (e.g., twitter)"
                  className="flex-grow rounded border p-2"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    handleReferenceChange(id, 'value', e.target.value)
                  }
                  placeholder="Value (e.g., x.com/username)"
                  className="flex-grow rounded border p-2"
                />
                <div
                  onClick={() => handleDeleteReference(id)}
                  aria-label="delete"
                  className="cursor-pointer"
                >
                  <img src="/svgs/trash.svg" alt="delete" className="h-5 w-5" />
                </div>
                {errors[id] && (errors[id].key || errors[id].value) && (
                  <HtmlTooltip
                    title={
                      <div className="text-sm text-red-500">
                        {errors[id].key && <p>{errors[id].key}</p>}
                        {errors[id].value && <p>{errors[id].value}</p>}
                      </div>
                    }
                    arrow
                    placement="top"
                  >
                    <img
                      src="/svgs/alert-circle.svg"
                      alt="error"
                      className="h-5 w-5"
                    />
                  </HtmlTooltip>
                )}
              </div>
            </div>
          ))}
        <Button
          handleClick={handleAddReference}
          aria-valuetext="add reference"
          className="flex w-full items-center gap-3 rounded-xl border border-dotted shadow-md"
          bgcolor="transparent"
          variant="outlined"
        >
          <img src="/svgs/circle-plus.svg" alt="add" className="h-5 w-5" />
          <p>Add reference</p>
        </Button>
        <ProfileSubmitArea
          isUpdate
          autoSubmit={false}
          preNavigationCheck={() => validateAndSave()}
        />
      </form>
    </div>
  );
};

export default UpdateProfileStep3;
