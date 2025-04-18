import {
  Box,
  Typography,
  Switch,
  switchClasses,
  Checkbox,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import { useDRepContext } from '@/context/drepContext';
import { ChangeEvent, useState, useRef } from 'react';
import { useWallet } from '@/context/walletContext';
import { AuthMethod as ExtendedAuthMethod } from '../../../types/auth';
import { LoginFileFlowModal } from './LoginFileFlowModal';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
export const getSwitchWithTextTrack = (isMobile, switchWidth) =>
  styled(Switch)(({ theme }) => ({
    width: switchWidth,
    height: 48,
    padding: 8,
    [`& .${switchClasses.switchBase}`]: {
      padding: 11,
      color: '#fff',
    },
    [`& .${switchClasses.thumb}`]: {
      width: 26,
      height: 26,
      backgroundColor: 'none',
      '&::before': {
        content: "''",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transition: 'background-image 1s ease-in-out',
      },
    },
    [`& .${switchClasses.track}`]: {
      background: 'linear-gradient(to right, #ee0979, #ff6a00)',
      opacity: '1 !important',
      borderRadius: 20,
      position: 'relative',
      '&:before, &:after': {
        display: 'inline-block',
        position: 'absolute',
        top: '50%',
        width: '50%',
        transform: 'translateY(-50%)',
        color: '#fff',
        textAlign: 'center',
        textWrap: 'nowrap',
        fontSize: isMobile ? 8 : 12,
        fontWeight: 500,
      },
      '&:before': {
        content: '"Sign in with hot wallet"',
        left: 8,
        opacity: 0,
      },
      '&:after': {
        content: '"Sign in with hardware wallet"',
        paddingLeft: 30,
      },
    },
    [`& .${switchClasses.checked}`]: {
      [`&.${switchClasses.switchBase}`]: {
        color: '#fff',
        transform: `translateX(calc(${switchWidth} - 105%))`,
        '&:hover': {
          backgroundColor: 'rgba(24,90,257,0.08)',
        },
      },

      [`& .${switchClasses.thumb}`]: {
        backgroundColor: 'none',
        '&::before': {},
      },
      [`& + .${switchClasses.track}`]: {
        background: 'linear-gradient(to right, #43cea2, #185a9d)',
        '&:before': {
          opacity: 1,
        },
        '&:after': {
          opacity: 0,
        },
      },
    },
  }));
export function UserLoginModal({
  hideCloseButton,
}: {
  hideCloseButton: boolean;
}) {
  const [isLoginFlowModalOpen, setIsLoginFlowModalOpen] = useState(false);
  const { setLoginModalOpen, setIsWalletListModalOpen } = useDRepContext()
  const [isChecked, setIsChecked] = useState(false);
  const [loginPeriod, setLoginPeriod] = useState('24 hrs');
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {addErrorAlert} =useGlobalNotifications()
  const theme = useTheme();

  const { wallet:{isConnected}, connectWallet } = useWallet();

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

  const handleBrowserWalletLogin = () => {
    setIsWalletListModalOpen(true);
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
      await connectWallet(ExtendedAuthMethod.LOGIN_FILE, {
        file: selectedFile,
      });
      setLoginModalOpen(false);
    } catch (error) {
      console.error('Error logging in with file:', error);
      addErrorAlert('Error logging in with file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColdWalletLogin = async () => {
    setIsLoading(true);
    try {
      await connectWallet(ExtendedAuthMethod.COLD_WALLET);
      setLoginModalOpen(false);
    } catch (error) {
      console.error('Error logging in with cold wallet:', error);
      addErrorAlert('Error logging in with cold wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ModalWrapper
        dataTestId="login-modal"
        hideCloseButton={hideCloseButton}
        onClose={() => setLoginModalOpen(false)}
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
            <Tab label="Cold Wallet" />
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
                  onClick={handleBrowserWalletLogin}
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
                  Use or generate a login file to authenticate
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleLoginFileGenerate}
                  disabled={isLoading}
                  sx={{ mb: 3 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Generate Login File'
                  )}
                </Button>

                <Typography sx={{ mb: 1 }}>- OR -</Typography>

                <Typography variant="body2" sx={{ mb: 1, textAlign: 'left' }}>
                  Upload an existing login file:
                </Typography>

                <input
                  type="file"
                  accept=".signed"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mb: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Choose Login File'}
                </Button>

                {selectedFile && (
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={handleLoginWithFile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Login with File'
                    )}
                  </Button>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                {/* <Typography variant="body1" sx={{ mb: 2 }}>
                Sign a transaction offline with your cold wallet
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                This will prepare an expired transaction for you to sign offline.
                You'll download the transaction, sign it, and upload the result.
                </Typography>
                <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleColdWalletLogin}
                disabled={isLoading}
                >
                {isLoading ? <CircularProgress size={24} /> : 'Start Cold Wallet Authentication'}
                </Button> */}
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Coming soon
                </Typography>
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
              {activeTab === 2 &&
                'Signing in with a cold wallet requires signing an expired transaction.'}
            </Typography>
          </Box>
        </ModalContents>
      </ModalWrapper>
      {
        isLoginFlowModalOpen && (
          <LoginFileFlowModal
            onClose={() => setIsLoginFlowModalOpen(false)}
          />
        )
      }
    </>
  );
}
