import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getNetworkFlag } from '@/lib/helpers';
import { CONFIGURED_NETWORK_ID } from '@/constants';
import { MessageBodyAfterSign } from '@/models/wallet';
import { useVerifyLoginFileSignatures } from '@/hooks/useVerifyLoginFileSignatures';
import {
  Credential,
  PublicKey,
  RewardAddress,
} from '@emurgo/cardano-serialization-lib-asmjs';

const StyledStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    marginTop: theme.spacing(1),
    fontSize: '0.875rem',
  },
  '& .MuiStepLabel-label.Mui-active': {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  '& .MuiStepLabel-label.Mui-completed': {
    color: theme.palette.success.main,
  },
}));

const CodeSnippet = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  position: 'relative',
  overflow: 'auto',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxHeight: '150px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  color: theme.palette.grey[400],
  '&:hover': {
    color: theme.palette.common.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const FileInput = styled('input')({
  display: 'none',
});

interface LoginFileFlowModalProps {
  hideCloseButton?: boolean;
  onClose?: () => void;
}

export function LoginFileFlowModal({
  hideCloseButton = false,
  onClose = () => {},
}: LoginFileFlowModalProps) {
  const { verifyLoginFileSigs } = useVerifyLoginFileSignatures();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loginFile, setLoginFile] = useState({
    name: '1694-login.signed',
    content: '',
  } as { name: string; content: string | null } | null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const cliCommand = `cardano-signer sign --cip30 \\
         --data-file ${verificationFile} \\
         --out-file message.signed \\
         --secret-key stake.skey \\
         --address stake.addr \\
         ${getNetworkFlag(CONFIGURED_NETWORK_ID)} \\
         --json`;

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const steps = [
    'Generate Verification File',
    'Upload Signed File',
    'Download Login File',
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleGenerateVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const messageHex = Buffer.from(
        'Please sign this message to verify your identity',
      ).toString('hex');
      const blob = new Blob([JSON.stringify(messageHex, null, 2)], {
        type: 'text/plain',
      });
      const url = window.URL.createObjectURL(blob);
      const fileName = `message${Date.now()}.txt`;
      setVerificationFile(fileName);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      handleNext();
    } catch (err) {
      setError('Failed to generate verification file. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSignedFile = async () => {
    if (!selectedFile) {
      setError('Please select a signed file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileContent = await selectedFile.text();
      const content = JSON.parse(fileContent) as MessageBodyAfterSign;

      if (!content.COSE_Key_hex || !content.COSE_Sign1_hex) {
        setError('Invalid signed file format. Please upload a valid file.');
        return;
      }

      const res = await verifyLoginFileSigs({
        signature: content.COSE_Sign1_hex,
        vkey: content.COSE_Key_hex,
      });

      const stakeKeyHex = RewardAddress.new(
        CONFIGURED_NETWORK_ID,
        Credential.from_keyhash(
          PublicKey.from_bytes(Buffer.from(res.publicKey, 'hex') as any).hash(),
        ),
      ).to_address();

      const loginFileContent = {
        signatures: {
          signature: content.COSE_Sign1_hex,
          vkey: content.COSE_Key_hex,
        },
        stakeKeyPub: res.publicKey,
        stakeKeyHex: stakeKeyHex.to_hex(),
        stakeKeyBech32: stakeKeyHex.to_bech32(),
      };

      const loginFileName = '1694-login.signed';
      const loginFile = new Blob([JSON.stringify(loginFileContent)], {
        type: 'application/json',
      });
      setLoginFile({
        name: loginFileName,
        content: URL.createObjectURL(loginFile),
      });

      handleNext();
    } catch (err) {
      setError(
        'Failed to process the signed file. Please check that you uploaded the correct file.',
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLoginFile = async () => {
    setLoading(true);

    try {
      const a = document.createElement('a');
      a.href = loginFile?.content || '';
      a.download = loginFile?.name || '1694-login.signed';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(loginFile?.content || '');
      onClose();
    } catch (err) {
      setError('Failed to complete authentication. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" paragraph>
              We're going to help you generate a verification file
              using the cardano-signer cli tool.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Once created and signed the file using CIP-08,
              you will be able to reuse the file in the future to
              login to 1694 and participate in Cardano governance.
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleGenerateVerification}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                'Generate Verification File'
              )}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" paragraph>
              Now you need to sign the verification file using your command-line
              wallet tool. You need the following pre-requisites:
            </Typography>
            <Typography variant="body2" paragraph>
              1.{' '}
              <a
                href="https://github.com/gitmachtl/cardano-signer"
                target="_blank"
                className="underline"
              >
                Cardano-signer
              </a>{' '}
              installed <br />
              2. Your stake signing key file (e.g., stake.skey) <br />
              3. The verification file you just generated 4. Your stake address
              (e.g., stake.addr) containing the stake key stake...,
              stake_test...
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 'bold', my: 1 }}>
              1. Sign the file with this command:
            </Typography>

            <CodeSnippet>
              {cliCommand}
              <CopyButton onClick={handleCopyCommand} size="small">
                {copied ? 'Copied!' : <ContentCopyIcon fontSize="small" />}
              </CopyButton>
            </CodeSnippet>

            <Typography variant="body2" sx={{ fontWeight: 'bold', my: 1 }}>
              2. Upload the signed file:
            </Typography>

            <FileInput
              type="file"
              accept=".signed,.json"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <Button
              variant="outlined"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              {selectedFile ? selectedFile.name : 'Choose Signed File'}
            </Button>

            {selectedFile && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleProcessSignedFile}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Process Signed File'
                )}
              </Button>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" paragraph>
              Great job! Your signed file has been verified successfully.
            </Typography>

            <Typography variant="body2" paragraph>
              Now you can download your login file which will allow you to
              authenticate without connecting your wallet in the future.
            </Typography>

            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 2,
                my: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {loginFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Store this file securely - it can be used to access your account
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleDownloadLoginFile}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                'Download Login File & Complete'
              )}
            </Button>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <ModalWrapper
      dataTestId="login-file-flow-modal"
      hideCloseButton={hideCloseButton || loading}
      onClose={onClose}
      sx={{
        width: '100%',
        maxWidth: '600px',
        padding: 2,
        borderRadius: 2,
      }}
    >
      <ModalHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <Typography variant="h4" component="h2">
          Login File Setup
        </Typography>
      </ModalHeader>

      <ModalContents>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StyledStepLabel>{label}</StyledStepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 1 }} />

        {error && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: 'error.light',
              color: 'error.dark',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              {error}
            </Typography>
          </Box>
        )}

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
            Back
          </Button>

          {activeStep < steps.length - 1 && (
            <Button
              disabled={
                (activeStep === 0 && !verificationFile) ||
                (activeStep === 1 && !selectedFile) ||
                loading
              }
              variant="text"
              onClick={handleNext}
            >
              Skip
            </Button>
          )}
        </Box>
      </ModalContents>
    </ModalWrapper>
  );
}
