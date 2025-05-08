import {
  decodeJWT,
  deleteDataFromSession,
  getDataFromSession,
  saveDataInSession,
} from '@/lib';
import { getPdfChallenge } from '@/services/requests/getPdfChallenge';
import { getRefreshToken } from '@/services/requests/getRefreshToken';
import { loginUserToPdf } from '@/services/requests/loginUserToPdf';
import { AuthMethod } from '../../types/auth';
import { setUpPdfJwt } from '@/lib/pdfJwtHelper';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';

export const usePdfTokenManager = () => {
  const { signMessage } = useWallet();
  const { openModal } = useModals();
  const { addSuccessAlert, addWarningAlert, addErrorAlert } =
    useGlobalNotifications();

  const validateAndRefreshToken = async () => {
    const jwt = getDataFromSession('pdfUserJwt');

    if (!jwt) {
      return { tokenExists: false };
    }

    // Token exists, check if it's expired or about to expire
    try {
      const decodedJwt = decodeJWT();
      if (decodedJwt) {
        const expDate = new Date(decodedJwt?.exp * 1000);
        const now = new Date();

        // Check if token is expired or will expire in less than 5 minutes
        if (expDate <= now || expDate.getTime() - now.getTime() <= 300000) {
          try {
            const refreshedTokens = await getRefreshToken();
            saveDataInSession('pdfUserJwt', refreshedTokens.jwt);
            return { tokenExists: true, tokenRefreshed: true };
          } catch (refreshError) {
            addErrorAlert('Error refreshing token:', refreshError);
            deleteDataFromSession('pdfUserJwt');
            return { tokenExists: false, refreshFailed: true };
          }
        }
      }
      return { tokenExists: true };
    } catch (error) {
      addErrorAlert('Error decoding JWT:', error);
      deleteDataFromSession('pdfUserJwt');
      return { tokenExists: false, decodeFailed: true };
    }
  };

  const performFullLogin = async (
    stakeKey,
    dRepId = null,
    isDRep = false,
    activeWallet,
  ) => {
    try {
      // Sign with stake key first
      const challengeRes = await getPdfChallenge({
        query: `?identifier=${stakeKey}`,
      });
      const { message } = challengeRes;

      let signedData = await signMessage(
        message,
        stakeKey,
        activeWallet === AuthMethod.HOT_WALLET ? true : false,
        activeWallet === AuthMethod.LOGIN_FILE ? true : false,
        [
          {
            type: 'stake',
            value: stakeKey,
          }
        ]
      );

      const userResponse = await loginUserToPdf({
        identifier: stakeKey,
        signedMessage: {
          ...signedData,
          expectedSignedMessage: message,
        },
      });

      await setUpPdfJwt(userResponse);

      // Check if username needs to be set
      if (!userResponse?.user?.govtool_username) {
        openModal(ModalType.USERNAME);
        return { userNameModalActive: true };
      }

      // Handle DRep verification
      if (isDRep && userResponse?.user?.govtool_username) {
        addWarningAlert(
          'You are a DRep! We need to verify your drep key.',
          false,
        );

        try {
          const challengeRes = await getPdfChallenge({
            query: `?identifier=${dRepId}`,
          });
          const { message } = challengeRes;

          let signedData = await signMessage(
            message,
            dRepId,
            activeWallet === AuthMethod.HOT_WALLET ? true : false,
            activeWallet === AuthMethod.LOGIN_FILE ? true : false,
            [
              {
                type: 'drep',
                value: dRepId,
              }
            ]
          );

          const drepResponse = await loginUserToPdf({
            jwt: userResponse?.jwt,
            identifier: dRepId,
            signedMessage: {
              ...signedData,
              expectedSignedMessage: message,
            },
          });

          await setUpPdfJwt(drepResponse);
          addSuccessAlert('DRep verification passed.');
        } catch (error) {
          addErrorAlert('DRep verification failed:', error);
          deleteDataFromSession('pdfUserJwt');
          addErrorAlert('DRep verification failed. Please try again.');
          return { loginFailed: true };
        }
      }

      addSuccessAlert('Login verification passed.');
      return { loginSuccess: true };
    } catch (error) {
      addErrorAlert('Login process failed:', error);
      deleteDataFromSession('pdfUserJwt');
      addErrorAlert('Login failed. Please try again.');
      return { loginFailed: true };
    }
  };

  // Ensure authentication before performing an action
  const ensureAuthenticated = async (
    stakeKey: string,
    dRepId = null,
    isDRep = false,
    activeWallet: string,
  ) => {
    // First validate and refresh token if needed
    const tokenStatus = await validateAndRefreshToken();

    // If token doesn't exist or refresh failed, perform full login
    if (!tokenStatus.tokenExists) {
      return await performFullLogin(stakeKey, dRepId, isDRep, activeWallet);
    }

    // Token exists and is valid
    return { loginSuccess: true };
  };

  return {
    validateAndRefreshToken,
    performFullLogin,
    ensureAuthenticated,
  };
};
