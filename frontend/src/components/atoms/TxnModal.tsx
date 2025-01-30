import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import Button from './Button';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { handleCopyText } from '@/lib';

interface CardanoTxModalProps {
  open?: boolean;
  onClose?: () => void;
  onWalletSign?: () => Promise<any>;
  onDownloadUnsigned?: () => Promise<any>;
  onSubmitSignedTx?: (signedTx: File) => Promise<any>;
  disableSigning?: boolean;
  disableDownload?: boolean;
  txHash?: string;
  txType?: string;
  error?: string;
  isLoading?: boolean;
}

const CardanoTxModal = ({
  open = false,
  onClose = () => {},
  onWalletSign,
  onDownloadUnsigned,
  onSubmitSignedTx,
  disableDownload = false,
  disableSigning = false,
  txHash = '',
  error = '',
  txType = '',
  isLoading = false,
}: CardanoTxModalProps) => {
  const [step, setStep] = useState<'initial' | 'download'>('initial');
  const ETA = txType === 'hardwareWallet' ? 0 : 30;
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

  const handleCopyHelperSnippet = () => {
    const textToCopy =
      'cardano-cli transaction sign --tx-file tx.raw --signing-key-file payment.skey --signing-key-file drep.skey --testnet-magic 2 --out-file tx.signed';
    handleCopyText(textToCopy);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSignedTxFile(event.target.files[0]);
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
    const isMissingSignatures = error.includes('Transaction is missing signatures from');

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/svgs/alert-circle.svg" alt="error" />
          <Typography variant="body2" color="error">
            {isMissingSignatures
              ? 'Transaction requires multiple signatures'
              : error}
          </Typography>
        </Box>

        {isMissingSignatures && (
          <>
            <Typography variant="body2">
              This transaction requires both DRep and payment key signatures.
              Use the following cardano-cli command:
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                position: 'relative',
                border: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                cardano-cli transaction sign \ --tx-file tx.raw \
                --signing-key-file payment.skey \ --signing-key-file drep.skey \
                --testnet-magic 2 \ --out-file tx.signed
              </pre>
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 4, 
                  right: 4,
                  bgcolor: 'transparent' 
                }}
                onClick={handleCopyHelperSnippet}
              >
                <img src="/svgs/copy.svg" alt="copy" />
              </IconButton>
            </Box>
          </>
        )}
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
            {txType === 'hardwareWallet' ? '(Expired)' : ''}
          </Typography>
        </Box>
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
            variant="outlined"
            handleClick={() => fileInputRef.current?.click()}
            className="mb-2 w-full text-white hover:text-blue-600"
            color="inherit"
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
      onClose={isLoading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
    >
      {step === 'initial' ? renderInitialContent() : renderDownloadContent()}
      <DialogActions>
        <Button handleClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CardanoTxModal;
