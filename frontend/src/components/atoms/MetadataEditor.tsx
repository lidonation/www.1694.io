import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ModalWrapper } from './modal/ModalWrapper';
import { HtmlTooltip } from './HoverChip';
import Button from './Button';
import { generateMetadataBody } from '@/lib/metadataProcessor';
import { CIP_100, CIP_QQQ, createDREPContext } from '@/lib/drepActions/jsonContext';
import { generateJsonld } from '@/lib/generateJSONLD';
import { blake2bHex } from 'blakejs';
import { downloadJson } from '@/lib/jsonutils';
import { postMetadata } from '@/services/requests/postMetadata';
import { MetadataStandard } from '../../../types/commonTypes';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useCardano } from '@/context/walletContext';
import { CircularProgress } from '@mui/material';
import { postAddMetadataAttachment } from '@/services/requests/postAttachment';
import { urls } from '@/constants';

const IMMUTABLE_KEYS = ['dRepName', 'bio', 'email'];

const MetadataEditor = ({
  drepId,
  onClose,
  initialMetadata = null,
  setFinalMetadata,
}) => {
  const [metadata, setMetadata] = useState([]);
  const {
    signAndSubmitTransaction,
    buildDRepUpdateCert,
    loginSignTransaction,
  } = useCardano();
  const [isValidatingSubmission, setIsValidatingSubmission] = useState(false);
  const [isSigningData, setIsSigningData] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [jsonld, setJsonld] = useState<any>(null);
  const [jsonHash, setJsonHash] = useState(null);
  const { addErrorAlert, addSuccessAlert } = useGlobalNotifications();
  const [validationStart, setValidationStart] = useState(false);
  const [metadataUrl, setMetadataUrl] = useState('');

  useEffect(() => {
    if (initialMetadata === null) {
      const defaultMetadata = IMMUTABLE_KEYS.reduce((acc, key) => {
        acc.push({ id: uuidv4(), key, value: '' });
        return acc;
      }, []);
      defaultMetadata.push({ id: uuidv4(), key: 'references', value: '[]' });
      setMetadata(defaultMetadata);
    } else {
      setMetadata(initialMetadata);
    }
  }, [initialMetadata]);

  const handleChange = (id, field, value) => {
    setMetadata(
      metadata.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );

    // Clear error for this field if it exists
    if (errors[id] && errors[id][field]) {
      setErrors({ ...errors, [id]: { ...errors[id], [field]: null } });
    }
  };

  const handleAddNew = () => {
    const newItem = { id: uuidv4(), key: '', value: '' };
    setMetadata([...metadata, newItem]);
  };

  const handleDelete = (id) => {
    const itemToDelete = metadata.find((item) => item.id === id);
    if (IMMUTABLE_KEYS.includes(itemToDelete.key)) {
      return;
    }
    setMetadata(metadata.filter((item) => item.id !== id));
    // Remove any errors for this item
    const { [id]: _, ...restErrors } = errors;
    setErrors(restErrors);
  };

  const downloadJsonFile = () => {
    if (jsonld) {
      downloadJson(jsonld, 'metadata');
    }
  };

  const validateAndSave = async () => {
    try {
      const newErrors = {};
      let hasErrors = false;

      metadata.forEach((item) => {
        newErrors[item.id] = {};

        // Check if the key is empty or contains spaces
        if (!item.key.trim()) {
          newErrors[item.id].key = 'Key cannot be empty';
          hasErrors = true;
        } else if (/\s/.test(item.key)) {
          newErrors[item.id].key = 'Key cannot contain spaces';
          hasErrors = true;
        }

        // Check if the value is empty
        if (!item.value.trim()) {
          newErrors[item.id].value = 'Value cannot be empty';
          hasErrors = true;
        }
      });

      setErrors(newErrors);
      if (!hasErrors) {
        const modifiedMetadata = metadata.reduce((acc, item) => {
          const value =
            typeof item.value === 'object' &&
            item.value !== null &&
            '@value' in item.value
              ? item.value['@value']
              : item.value;

          acc[item.key] = value;

          return acc;
        }, {});
        // Extract keys from the metadata
        const metadataKeys = metadata.map((item) => item.key);
        // Create the dynamic DREP_CONTEXT
        const dynamicDREPContext = createDREPContext(metadataKeys);
        const jsonLdData = await generateMetadataBody({
          data: modifiedMetadata as any,
          standardReference: CIP_QQQ,
        });
        // sign metadata tx
        setIsSigningData(true);
        const { signature, key: vkey } = await loginSignTransaction();
        const vkeys = {
          vkey,
          signature,
        };
        const jsonld = await generateJsonld(
          jsonLdData,
          JSON.parse(modifiedMetadata['references']),
          dynamicDREPContext,
          CIP_QQQ,
          vkeys,
        );
        //hasing the raw kay value pairs to be validated
        const jsonHash = blake2bHex(JSON.stringify(jsonld), undefined, 32);
        setJsonld(jsonld);
        setJsonHash(jsonHash);
        setValidationStart(true);
        setIsSigningData(false);
        //upload metadata to db
        await postAddMetadataAttachment({
          metadata: jsonld,
          hash: jsonHash,
          drepId,
          name: jsonHash.slice(0, 10),
        });
        setMetadataUrl(
          `${urls.baseServerUrl}/dreps/${drepId}/metadata/${jsonHash}`,
        );
      }
    } catch (error) {
      console.log(error);
      setIsSigningData(false);
      addErrorAlert(String(error));
    }
  };

  const handleValidation = async (e: any) => {
    try {
      setIsValidatingSubmission(true);
      setMetadataUrl(e.target.value);
      if (e.target.value) {
        const { status, valid } = await postMetadata({
          hash: jsonHash,
          url: e.target.value,
          standard: MetadataStandard.CIP100,
        });
        if (status) {
          addErrorAlert(status);
          setIsValidatingSubmission(false);
          return;
        }
        setIsValidatingSubmission(false);
        if (valid && metadataUrl) {
          addSuccessAlert('Metadata Valid');
        }
      }
    } catch (error) {
      setIsValidatingSubmission(false);
      addErrorAlert(String(error));
      console.log(error);
    }
  };

  const onSubmit = async () => {
    try {
      //save new url on chain
      const updateDRepMetadataCert = await buildDRepUpdateCert(
        metadataUrl,
        jsonHash,
      );
      await signAndSubmitTransaction(updateDRepMetadataCert);
      addSuccessAlert(
        'Metadata updated successfully. It will probably take few minutes to reflect',
      );
      setFinalMetadata(metadata);
      onClose();
    } catch (error) {
      console.log(error);
      addErrorAlert(String(error));
    }
  };

  const modalContent = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4 ">
        <h2 className="text-xl font-bold">Edit Metadata</h2>
        <div className="max-h-72 overflow-y-auto">
          {metadata &&
            metadata.length > 0 &&
            metadata.map(({ id, key, value }) => (
              <div key={id} className="mb-4">
                <div className="my-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleChange(id, 'key', e.target.value)}
                    placeholder="Key"
                    disabled={IMMUTABLE_KEYS.includes(key) || validationStart}
                    className="flex-grow rounded border p-2"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(id, 'value', e.target.value)}
                    placeholder="Value"
                    disabled={validationStart}
                    className="flex-grow rounded border p-2"
                  />
                  <div
                    onClick={() => handleDelete(id)}
                    aria-label="delete"
                    className={`h-5 w-5 ${IMMUTABLE_KEYS.includes(key) || validationStart ? 'pointer-events-none' : 'cursor-pointer'}`}
                  >
                    <img
                      src="/svgs/trash.svg"
                      alt="delete"
                      className="h-5 w-5"
                    />
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
                        alt="delete"
                        className="h-5 w-5"
                      />
                    </HtmlTooltip>
                  )}
                </div>
              </div>
            ))}
        </div>
        <div className="mb-2 flex w-full">
          <Button
            handleClick={handleAddNew}
            aria-valuetext="add"
            disabled={validationStart}
            className="flex w-full items-center gap-3 rounded-xl border border-dotted shadow-md"
            bgColor="transparent"
            variant="outlined"
          >
            <img src="/svgs/circle-plus.svg" alt="add" className="h-5 w-5" />
            <p>Add another</p>
          </Button>
        </div>
        <div className="flex flex-row justify-between gap-2">
          <div className="flex gap-2">
            <div>
              <Button
                handleClick={() => setValidationStart(false)}
                disabled={!validationStart}
              >
                Edit
              </Button>
            </div>
            <div>
              <Button
                handleClick={() => {
                  downloadJsonFile();
                }}
                disabled={!validationStart}
              >
                <img
                  src="/svgs/download.svg"
                  alt="download"
                  className="h-5 w-5"
                />
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button handleClick={onClose} disabled={validationStart}>
              Cancel
            </Button>
            <Button
              handleClick={validateAndSave}
              disabled={validationStart || isSigningData}
            >
              {isSigningData ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>
      {validationStart && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Download the json and host it in a platform of your choice, then
            paste the platform URL here, or leave us the work of hosting your
            metadata and leave this field as is:
          </p>
          <div className="flex items-center gap-2">
            <div className="flex w-[80%] flex-col gap-1">
              <input
                type="text"
                value={metadataUrl}
                onChange={handleValidation}
                placeholder="Metadata URL"
                className="w-full rounded border p-2"
              />
              {isValidatingSubmission && (
                <div className="w-full text-center">
                  <CircularProgress size={20} />
                </div>
              )}
            </div>
            <div className="w-[20%]">
              <Button
                handleClick={() => {
                  onSubmit();
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ModalWrapper
      onClose={onClose}
      variant="modal"
      hideCloseButton
      children={modalContent}
    />
  );
};

export default MetadataEditor;
