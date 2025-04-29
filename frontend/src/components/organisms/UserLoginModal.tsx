import {
  Box,
  Typography,
  Checkbox,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import { ChangeEvent, useState, useRef } from 'react';
import { useWallet } from '@/context/globalContext';
import { AuthMethod as ExtendedAuthMethod } from '../../../types/auth';
import { LoginFileFlowModal } from './LoginFileFlowModal';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import Button from '../atoms/Button';

export interface UserLoginModalProps {
  hideCloseButton?: boolean;
  handleHotWalletLogin?: () => void;
  onClose?: () => void;
}

export function UserLoginModal({
  hideCloseButton,
  onClose,
  handleHotWalletLogin,
}: UserLoginModalProps) {
  const [isLoginFlowModalOpen, setIsLoginFlowModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [, setLoginPeriod] = useState('24 hrs');
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addErrorAlert } = useGlobalNotifications();

  const {
    wallet: { isConnected },
    connectWallet,
  } = useWallet();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCheck = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setLoginPeriod('2 weeks');
      setIsChecked(true);
    } else {
      setLoginPeriod('24 hrs');
      setIsChecked(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleLoginFileGenerate = async () => {
    setIsLoading(true);
    try {
      setIsLoginFlowModalOpen(true);
    } catch (error) {
      console.error('Error generating login file:', error);
      addErrorAlert('Error generating login file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithFile = async () => {
    if (!selectedFile) {
      addErrorAlert('Please select a login file first');
      return;
    }
    setIsLoading(true);
    try {
      const { success } = await connectWallet(
        ExtendedAuthMethod.LOGIN_FILE,
        {
          file: selectedFile,
        },
      );
      if (!success) {
        addErrorAlert('Error logging in with file. Please try again.');
        return;
      }
      onClose();
    } catch (error) {
      console.error('Error logging in with file:', error);
      addErrorAlert('Error logging in with file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ModalWrapper
        dataTestId="login-modal"
        hideCloseButton={hideCloseButton}
        onClose={onClose}
      >
        <ModalHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <img src="/img/info-circle.png" width={'0.125rem'} alt="login icon" />
          <Typography
            variant="h4"
            className="py-1 text-center"
            component="span"
          >
            Login
          </Typography>
        </ModalHeader>

        <ModalContents>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Browser Wallet" />
            <Tab label="Login File" />
          </Tabs>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              maxHeight: '25rem',
              overflow: 'auto',
              width: '100%',
              padding: '0.25rem',
            }}
          >
            {activeTab === 0 && (
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Connect and authenticate with your browser wallet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"                  
                  handleClick={handleHotWalletLogin}
                  disabled={isLoading || isConnected}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
                {isConnected && (
                  <Typography variant="body2" color="success.main">
                    Wallet connected! Proceed to authenticate.
                  </Typography>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box
                sx={{
                  width: '100%',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Upload a login file:
                </Typography>

                <input
                  type="file"
                  accept=".signed"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />

                <Button
                  variant={selectedFile ? 'outlined' : 'contained'}
                  color="primary"
                  fullWidth
                  handleClick={() => fileInputRef.current?.click()}
                  sx={{ mb: 2 }}
                  bgcolor={selectedFile ? 'transparent' : undefined}
                >
                  {selectedFile ? selectedFile.name : 'Choose Login File'}
                </Button>

                {selectedFile && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    handleClick={handleLoginWithFile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Login with File'
                    )}
                  </Button>
                )}

                <Typography sx={{ mb: 1 }}>- OR -</Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                  Generate a login file to authenticate
                </Typography>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="large"
                  handleClick={handleLoginFileGenerate}
                  disabled={isLoading}
                  sx={{ mb: 3 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Generate Login File'
                  )}
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <label
              htmlFor="checkbox"
              className="flex cursor-pointer items-center gap-1"
            >
              <Checkbox
                id="checkbox"
                checked={isChecked}
                onChange={handleCheck}
              />
              <Typography variant="subtitle2" color="text.secondary">
                Keep me logged in for two weeks.
              </Typography>
            </label>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {activeTab === 0 &&
                'Signing in with a browser wallet requires signature verification.'}
              {activeTab === 1 &&
                'Login files allow you to authenticate without connecting your wallet each time.'}
            </Typography>
          </Box>
        </ModalContents>
      </ModalWrapper>
      {isLoginFlowModalOpen && (
        <LoginFileFlowModal onClose={() => setIsLoginFlowModalOpen(false)} />
      )}
    </>
  );
}
