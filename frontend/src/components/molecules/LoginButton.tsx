import React from 'react';
import Button from '../atoms/Button';
import { useCardano } from '@/context/cardanoContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { CircularProgress } from '@mui/material';
import { useDRepContext } from '@/context/drepContext';
import { userLogin } from '@/services/requests/userLogin';
import { convertDrepPhraseToCIP105, setItemToLocalStorage } from '@/lib';
const LoginButton = ({
  isHardware = false,
  loginMode = false,
  loginPeriod = '24 hrs',
}: {
  isHardware?: boolean;
  loginPeriod?: string;
  loginMode?: boolean;
}) => {
  const {
    loginSignTransaction,
    loginHardwareWalletTransaction,
    isGettingSignatures,
    stakeKeyBech32,
    dRepIDBech32,
  } = useCardano();
  const { setIsLoggedIn, setLoginModalOpen, drepId, setSignatureId } =
    useDRepContext();
  const { addErrorAlert } = useGlobalNotifications();
  const handleLogin = async () => {
    let signature;
    let key;
    try {
      if (isHardware) {
        const { signature: hardwareSig, vkey } =
          await loginHardwareWalletTransaction();
        signature = hardwareSig;
        key = vkey;
      } else {
        const { signature: hotSig, key: hotSigKey } =
          await loginSignTransaction();
        signature = hotSig;
        key = hotSigKey;
      }

      if (signature && key && loginMode) {
        setIsLoggedIn(true);
        const loginCredentials = {
          drepId,
          voterId: convertDrepPhraseToCIP105(dRepIDBech32),
          stakeKey: stakeKeyBech32,
          signatures: [{ signature, key, type: 'signer' }],
          expiry: loginPeriod,
          drep_bech32: convertDrepPhraseToCIP105(dRepIDBech32),
        };
        const { token, session } = await userLogin(loginCredentials);
        setSignatureId(session.id);
        setItemToLocalStorage('signatures', { signature, key });
        setItemToLocalStorage('token_1694', token);
        setIsLoggedIn(true);
        setLoginModalOpen(false);
      }
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        const stringifiedError = error.toString();
        addErrorAlert(stringifiedError);
      } else if (typeof error?.info === 'string') addErrorAlert(error?.info);
    }
  };
  return (
    <Button handleClick={handleLogin} sx={{ width: '100%' }}>
      {isGettingSignatures ? (
        <CircularProgress size={20} color="info" />
      ) : (
        'Login'
      )}
    </Button>
  );
};

export default LoginButton;
