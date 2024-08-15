import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ModalWrapper } from './modal/ModalWrapper';
import { HtmlTooltip } from './HoverChip';
import Button from './Button';
import { generateMetadataBody, submitMetadata } from '@/lib/metadataProcessor';
import { downloadJson } from '@/lib/jsonutils';
import { postMetadata } from '@/services/requests/postMetadata';
import { MetadataStandard } from '../../../types/commonTypes';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useCardano } from '@/context/walletContext';
import { CircularProgress } from '@mui/material';
import { setItemToLocalStorage } from '@/lib';

const IMMUTABLE_KEYS = ['dRepName', 'bio', 'email', 'references'];

const MetadataEditor = ({ drepId, onClose, initialMetadata = null, onSuccessfulSubmit }) => {
  const [metadata, setMetadata] = useState([]);
  const { loginSignTransaction } = useCardano();
  const [isSigningData, setIsSigningData] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { addErrorAlert, addSuccessAlert } = useGlobalNotifications();
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
        // sign metadata tx
        setIsSigningData(true);
        const { jsonld, jsonHash } = await submitMetadata(
          metadataKeys,
          modifiedMetadata,
          loginSignTransaction,
        );
        setItemToLocalStorage('isUpdating', 'true');
        setItemToLocalStorage('metadataJson', metadata);
        setItemToLocalStorage('metadataJsonLd', jsonld);
        setItemToLocalStorage('metadataJsonHash', jsonHash);
        setIsSigningData(false);
        addSuccessAlert('Metadata updated!');
        onSuccessfulSubmit();
        onClose()
      }
    } catch (error) {
      console.log(error);
      setIsSigningData(false);
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
                    disabled={IMMUTABLE_KEYS.includes(key)}
                    className="flex-grow rounded border p-2"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-grow rounded border p-2"
                  />
                  <div
                    onClick={() => handleDelete(id)}
                    aria-label="delete"
                    className={`h-5 w-5 ${IMMUTABLE_KEYS.includes(key) ? 'pointer-events-none' : 'cursor-pointer'}`}
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
            className="flex w-full items-center gap-3 rounded-xl border border-dotted shadow-md"
            bgColor="transparent"
            variant="outlined"
          >
            <img src="/svgs/circle-plus.svg" alt="add" className="h-5 w-5" />
            <p>Add another</p>
          </Button>
        </div>
        <div className="flex flex-row justify-end gap-2">
          <div className="flex justify-end gap-2">
            <Button handleClick={onClose}>Cancel</Button>
            <Button handleClick={validateAndSave} disabled={isSigningData}>
              {isSigningData ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>
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
