import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import Button from './Button';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import CopySnippet from './CopySnippet';
import { RequiredSigningKeyType, TxnTypes } from '@/hooks/useTransactionHandler';
import { helperSnippets } from '@/models/helperSnippets';

interface CardanoTxModalProps {
  open?: boolean;
  isPrepping?: boolean;
  fileToDownload?: string;
  onClose?: () => void;
  onWalletSign?: () => Promise<any>;
  onDownloadUnsigned?: () => Promise<any>;
  onSubmitSignedTx?: (signedTx: File) => Promise<any>;
  disableSigning?: boolean;
  disableDownload?: boolean;
  txHash?: string;
  txType?: TxnTypes;
  error?: string;
  currentNetwork?: number;
  isLoading?: boolean;
  requiredSigningKey?: RequiredSigningKeyType
}

const CardanoTxModal = ({
  open = false,
  isPrepping = false,
  fileToDownload = 'tx.raw',
  onClose = () => {},
  onWalletSign,
  onDownloadUnsigned,
  onSubmitSignedTx,
  disableDownload = false,
  disableSigning = false,
  txHash = '',
  error = '',
  txType,
  currentNetwork,
  isLoading = false,
  requiredSigningKey,
}: CardanoTxModalProps) => {
  const [step, setStep] = useState<'initial' | 'download'>('initial');
  const ETA = txType === 'loginViaExpiredTxnSigning' || txType === 'loginViaMessageSigning' ? 0 : 60; //usually expired
  const [timeLeft, setTimeLeft] = useState(ETA * 60);
  const { addErrorAlert } = useGlobalNotifications();
  const [signedTxFile, setSignedTxFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer;
    if (step === 'download' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    setTimeLeft(ETA * 60);
  }, [ETA, txType]);

  const renderPreppingContent = () => (
    <>
      <DialogTitle>Preparing Transaction</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 4,
          }}
        >
          <CircularProgress size={40} />
          <Typography>Preparing your transaction...</Typography>
        </Box>
      </DialogContent>
    </>
  );

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setStep('initial');
    setTimeLeft(ETA * 60);
    setSignedTxFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDownloadChoice = async () => {
    setStep('download');
    await onDownloadUnsigned();
  };

  const handleWalletSign = async () => {
    try {
      await onWalletSign();
      handleClose();
    } catch (error) {
      console.error('Error signing with wallet:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSignedTxFile(event.target.files[0]);
    }
  };

  const renderSnippetContent = (txnType: TxnTypes) => {
    switch (txnType) {
      case 'loginViaMessageSigning':
        return helperSnippets.find((s) => s.type === 'messageSigning');
      case 'loginViaExpiredTxnSigning':
        return helperSnippets.find((s) => s.type === 'signExpiredTxn');
      case 'delegationTxn':
        return helperSnippets.find((s) => s.type === 'signDelegationTxn');
      case 'submitMetadataTxn':
        return helperSnippets.find((s) => s.type === 'signUpdateMetadataTxn');
      default:
        return null;
    }
  };

  const handleSubmitSignedTx = async () => {
    if (!signedTxFile) return;

    try {
      await onSubmitSignedTx(signedTxFile);
      handleClose();
    } catch (error) {
      console.error('Error submitting signed transaction:', error);
      addErrorAlert('Error submitting signed transaction ' + String(error));
    }
  };

  const renderErrorContent = (error: string) => {
       return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: 'rgba(255, 51, 51, 0.1)',
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection:'column',  gap: 1 }}>
          <CopySnippet
            extraText={error}
            isError
          />
        </Box>
      </Box>
    );
  };

  const renderInitialContent = () => (
    <>
      <DialogTitle>Choose Signing Method</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Select how you would like to sign your Cardano transaction
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            handleClick={handleWalletSign}
            disabled={isLoading || disableSigning}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Sign with Connected Wallet'
            )}
          </Button>
          <Button
            bgcolor="transparent"
            variant="outlined"
            handleClick={handleDownloadChoice}
            disabled={isLoading || disableDownload}
          >
            <img src="/svgs/download.svg" alt="download" />
            Download Unsigned Transaction
          </Button>
        </Box>
      </DialogContent>
    </>
  );

  const renderDownloadContent = () => (
    <>
      <DialogTitle>Upload Signed Transaction</DialogTitle>
      <DialogContent>
        {error && renderErrorContent(error)}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <img src="/svgs/info-circle.svg" alt="info-circle" />
          <Typography variant="body2" color="warning.main">
            Time remaining: {formatTime(timeLeft)}{' '}
            {txType === 'loginViaExpiredTxnSigning' ? '(Expired)' : ''}
          </Typography>
        </Box>
        <CopySnippet
          snippetToCopy={renderSnippetContent(txType)?.snippetToCopy(
            currentNetwork, fileToDownload, requiredSigningKey
          )}
          extraText={renderSnippetContent(txType)?.extraText}
        />
        <Typography variant="body2" sx={{ mb: 2 }}>
          Your unsigned transaction has been downloaded. You have {ETA} minutes
          to sign and submit it back to the platform before it expires.
        </Typography>
        {txHash && (
          <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
            Transaction Hash: {txHash?.slice(0, 10)}...
          </Typography>
        )}
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            accept=".txt, .signed"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            handleClick={() => fileInputRef.current?.click()}
            className="mb-2 w-full text-white"
          >
            <img
              src="/svgs/download.svg"
              alt="upload"
              className="mr-2 rotate-180"
            />
            {signedTxFile
              ? signedTxFile.name
              : 'Choose Signed Transaction File'}
          </Button>
          {signedTxFile && (
            <Typography variant="caption" display="block">
              Selected file: {signedTxFile.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          handleClick={handleSubmitSignedTx}
          disabled={!signedTxFile || isLoading}
          className="w-full"
        >
          {isLoading ? <CircularProgress size={24} /> : 'Submit Signed Tx'}
        </Button>
      </DialogContent>
    </>
  );

  return (
    <Dialog
      open={open}
      sx={{ zIndex: 9999 }}
      onClose={isLoading || isPrepping ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
    >
      {isPrepping
        ? renderPreppingContent()
        : step === 'initial'
          ? renderInitialContent()
          : renderDownloadContent()}
      <DialogActions>
        <Button handleClick={handleClose} disabled={isLoading || isPrepping}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CardanoTxModal;
