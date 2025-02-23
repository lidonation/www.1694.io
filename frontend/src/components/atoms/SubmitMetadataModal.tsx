import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './modal/ModalWrapper';
import Button from './Button';
import { downloadJson } from '@/lib/jsonutils';
import { postMetadata } from '@/services/requests/postMetadata';
import {
  MetadataSaveResponse,
  SubmitMetadataExtra,
  SubmitMetadataType,
} from '../../../types/commonTypes';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useCardano } from '@/context/walletContext';
import { CircularProgress, Tabs, Tab } from '@mui/material';
import { urls } from '@/constants';
import { getItemFromIndexedDB } from '@/lib/indexedDb';
import { postAddMetadataAttachment } from '@/services/requests/postAddMetadataAttachment';
import { useDRepContext } from '@/context/drepContext';
interface SubmitMetadataModalProps {
  onClose: () => void;
  onSuccessfulSubmit: (resultHash?: string) => void;
  data?: {
    jsonld: any;
    jsonHash: string;
  };
  metadataType?: SubmitMetadataType;
  extraData?: SubmitMetadataExtra;
}

const SubmitMetadataModal = ({
  onClose,
  onSuccessfulSubmit,
  data,
  metadataType,
  extraData,
}: SubmitMetadataModalProps) => {
  const {
    signAndSubmitTransaction,
    buildDRepUpdateCert,
    dRepIDBech32,
    buildVote,
  } = useCardano();
  const { drepClaimMismatch, drepToBeClaimed, drepEntityToBeClaimed } =
    useDRepContext();
  const [isValidatingSubmission, setIsValidatingSubmission] = useState(false);
  const [activeTab, setActiveTab] = useState('selfHost');
  const [jsonld, setJsonld] = useState<any>(null);
  const [jsonHash, setJsonHash] = useState(null);
  const { addErrorAlert, addSuccessAlert } = useGlobalNotifications();
  const [metadataUrl, setMetadataUrl] = useState('');
  const [isSubmittingToIPFS, setIsSubmittingToIPFS] = useState(false);

  useEffect(() => {
    const initiateMetadata = async () => {
      if (metadataType === 'drepUpdate') {
        //specifically for drep update
        const drepJsonLd = await getItemFromIndexedDB('metadataJsonLd');
        const drepJsonHash = await getItemFromIndexedDB('metadataJsonHash');
        setJsonld(drepJsonLd);
        setJsonHash(drepJsonHash);
        return;
      }
      setJsonld(data?.jsonld);
      setJsonHash(data?.jsonHash);
    };
    initiateMetadata();
  }, [data]);

  const downloadJsonFile = () => {
    if (jsonld) {
      downloadJson(jsonld, 'metadata');
    } else {
      addErrorAlert('Unable to download metadata');
    }
  };

  const handleValidation = async () => {
    try {
      if (metadataUrl) {
        setIsValidatingSubmission(true);
        setMetadataUrl(metadataUrl);
        const { status, valid } = await postMetadata({
          hash: jsonHash,
          url: metadataUrl,
        });
        if (status) {
          setIsValidatingSubmission(false);
          throw new Error(status);
        }
        setIsValidatingSubmission(false);
        if (valid && metadataUrl) {
          addSuccessAlert('Metadata Valid');
        }
      } else {
        setIsValidatingSubmission(false);
        setMetadataUrl('');
      }
    } catch (error) {
      setIsValidatingSubmission(false);
      console.log(error);
      throw new Error(error);
    }
  };

  const buildActionCert = async ({
    metadataUrl,
    metadataUrlHash,
  }: {
    metadataUrl: string;
    metadataUrlHash: string;
  }) => {
    try {
      switch (metadataType) {
        case 'drepUpdate':
          return await buildDRepUpdateCert(
            metadataUrl,
            metadataUrlHash,
            drepToBeClaimed !== dRepIDBech32 ? drepToBeClaimed : dRepIDBech32,
          );
        case 'voteUpdate':
          const { vote, voteTxHash, voteTxIndex, voterId } = extraData?.voteUpdate;
          return await buildVote(
            vote,
            voteTxHash,
            voteTxIndex,
            voterId,
            metadataUrl,
            metadataUrlHash,
          );
        default:
          return null;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };

  const postSaveMetadata = async () => {
    try {
      setIsSubmittingToIPFS(true);
      //upload metadata to db
      const { content } = (await postAddMetadataAttachment({
        metadata: jsonld,
      })) as MetadataSaveResponse;
      if (!content) {
        console.log('Error saving metadata, hash not received');
        throw new Error('Error saving metadata');
      }
      if (!urls.ipfsGateway) {
        console.log('IPFS Gateway not available in environment');
        throw new Error('Error occured while saving metadata');
      }
      const hostedUrl = `${urls.ipfsGateway}/ipfs/${content}`;
      setIsSubmittingToIPFS(false);
      return hostedUrl;
    } catch (error) {
      console.log(error);
      setIsSubmittingToIPFS(false);
      throw new Error(error);
    }
  };

  const onSubmit = async () => {
    try {
      let currentHostedUrl = metadataUrl;
      if (activeTab === 'hostForMeOnIPFS') {
        currentHostedUrl = await postSaveMetadata();
      }
      if (activeTab === 'selfHost') {
        if (!metadataUrl) {
          addErrorAlert('Please enter a valid url');
          return;
        }
        await handleValidation();
      }
      const actionCert = await buildActionCert({
        metadataUrl: currentHostedUrl,
        metadataUrlHash: jsonHash,
      });
      onClose();
      const res = await signAndSubmitTransaction(
        'submitMetadataTxn',
        actionCert,
        {
          disableSigning: drepClaimMismatch || drepToBeClaimed !== dRepIDBech32,
          deriveUtxosFrom:
            (drepClaimMismatch || drepToBeClaimed !== dRepIDBech32) &&
            drepEntityToBeClaimed?.reg_address, // if drepClaimMismatch, derive utxos from reg_address
        },
      );
      onSuccessfulSubmit(res.resultHash);
    } catch (error) {
      console.log(error);
      addErrorAlert(String(error));
    }
  };

  const renderSelfHostContent = () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <p>Download your metadata</p>
        <Button handleClick={downloadJsonFile}>
          <img src="/svgs/download.svg" alt="download" className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          Host it on a platform of your choice, preferrably long term storage
          like IPFS, then paste the URL here:
        </p>
        <div className="flex items-center gap-2">
          <div className="flex w-[80%] flex-col gap-1">
            <input
              type="text"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              placeholder="Metadata URL"
              className="w-full rounded border p-2"
            />
            {isValidatingSubmission && (
              <div className="mt-2 w-full">
                <CircularProgress size={20} />
              </div>
            )}
          </div>
          <div className="w-[20%]">
            <Button handleClick={onSubmit}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHostForMeOnIPFSContent = () => (
    <div className="flex flex-col gap-4">
      <p>This is the final step. We'll host the metadata for you in IPFS.</p>
      <Button handleClick={onSubmit}>
        {' '}
        {isSubmittingToIPFS ? (
          <CircularProgress size={20} color="inherit" className="text-white" />
        ) : (
          'Submit'
        )}
      </Button>
    </div>
  );

  const modalContent = (
    <div className="flex flex-col gap-4">
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
      >
        <Tab label="Self Host" value="selfHost" />
        <Tab label="Host on IPFS" value="hostForMeOnIPFS" />
      </Tabs>
      {activeTab === 'selfHost'
        ? renderSelfHostContent()
        : renderHostForMeOnIPFSContent()}
    </div>
  );

  return (
    <ModalWrapper onClose={onClose} variant="modal" children={modalContent} />
  );
};

export default SubmitMetadataModal;
