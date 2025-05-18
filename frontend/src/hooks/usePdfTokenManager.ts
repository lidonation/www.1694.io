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
import { useOAuth } from '@/hooks/useOAuth';
import { getOAuthProvider } from '@/services/requests/oAuthQueries';
import {
  ExternalOAuthMetadata,
  GovToolsJwtPayload,
  OAuthProviderType,
} from '@/models/oauth';

export const usePdfTokenManager = () => {
  const {
    signMessage,
    wallet: { stakeKeyBech32 },
    user: { externalLogins },
  } = useWallet();
  const { openModal } = useModals();
  const { addSuccessAlert, addWarningAlert, addErrorAlert } =
    useGlobalNotifications();
  const { createOAuth, updateOAuth, handleCheckOAuthProvider } = useOAuth();

  const storeJwtInOAuth = async (
    jwt: string,
    stakeKeyBech32: string,
    expiresAt?: Date,
    metadata?: ExternalOAuthMetadata[OAuthProviderType.GOVTOOLS],
  ) => {
    try {
      await createOAuth({
        provider: OAuthProviderType.GOVTOOLS,
        accessToken: jwt,
        stakeKeyBech32,
        expiresAt,
        metadata,
      });
      addSuccessAlert('Gov.tools token saved for future use.');
      return true;
    } catch (error) {
      addErrorAlert('Failed to save gov.tools token:', error);
      return false;
    }
  };

  const updateJwtInOAuth = async (
    jwt: string,
    stakeKeyBech32: string,
    providerId: number,
    expiresAt?: Date,
  ) => {
    try {
      await updateOAuth(
        {
          accessToken: jwt,
          expiresAt,
        },
        providerId,
        stakeKeyBech32,
      );
      return true;
    } catch (error) {
      addErrorAlert('Failed to update gov.tools token:', error);
      return false;
    }
  };

  const validateAndRefreshToken = async () => {
    let jwt = getDataFromSession('pdfUserJwt');

    if (!jwt) {
      // No token found in session
      if (externalLogins?.[OAuthProviderType.GOVTOOLS]?.jwt) {
        // User has an external login, but no session token
        saveDataInSession(
          'pdfUserJwt',
          externalLogins[OAuthProviderType.GOVTOOLS].jwt,
        );
        jwt = externalLogins[OAuthProviderType.GOVTOOLS].jwt;
      } else {
        // No token found in session or external login
        return { tokenExists: false };
      }
    }

    // Token exists, check if it's expired or about to expire
    try {
      const decodedJwt = decodeJWT() as GovToolsJwtPayload;
      if (decodedJwt) {
        const expDate = new Date(decodedJwt?.exp * 1000);
        const now = new Date();

        // Check if token is expired or will expire in less than 5 minutes
        if (expDate <= now || expDate.getTime() - now.getTime() <= 300000) {
          try {
            const refreshedTokens = await getRefreshToken();
            saveDataInSession('pdfUserJwt', refreshedTokens.jwt);

            if (stakeKeyBech32) {
              const providerId = await getOAuthProviderId(
                stakeKeyBech32,
                OAuthProviderType.GOVTOOLS,
              );
              if (providerId) {
                const decodedRefreshToken = decodeJWT(
                  refreshedTokens.jwt,
                ) as GovToolsJwtPayload;
                await updateJwtInOAuth(
                  refreshedTokens.jwt,
                  stakeKeyBech32,
                  providerId,
                  decodedRefreshToken.exp
                    ? new Date(decodedRefreshToken.exp * 1000)
                    : undefined,
                );
              }
            }

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
      console.error('Error decoding JWT:', error);
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
          },
        ],
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
              },
            ],
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

          if (stakeKeyBech32) {
            //check if user has an existing provider(gave consent for saving the token)
            const decodedToken = decodeJWT(
              drepResponse.jwt,
            ) as GovToolsJwtPayload;
            const { hasProvider } = await handleCheckOAuthProvider(
              stakeKeyBech32,
              OAuthProviderType.GOVTOOLS,
            );
            if (!hasProvider) {
              openModal(ModalType.SAVE_JWT, {
                jwt: drepResponse.jwt,
                stakeKeyBech32,
                expiresAt: decodedToken.exp
                  ? new Date(decodedToken.exp * 1000)
                  : undefined,
                metadata: {
                  keyType: 'drep',
                },
              });
            } else {
              storeJwtInOAuth(
                drepResponse.jwt,
                stakeKeyBech32,
                decodedToken.exp
                  ? new Date(decodedToken.exp * 1000)
                  : undefined,
                {
                  keyType: 'drep',
                },
              );
            }
          }
        } catch (error) {
          addErrorAlert('DRep verification failed:', error);
          deleteDataFromSession('pdfUserJwt');
          addErrorAlert('DRep verification failed. Please try again.');
          return { loginFailed: true };
        }
      } else {
        if (stakeKeyBech32) {
          const decodedToken = decodeJWT(
            userResponse.jwt,
          ) as GovToolsJwtPayload;
          const { hasProvider } = await handleCheckOAuthProvider(
            stakeKeyBech32,
            OAuthProviderType.GOVTOOLS,
          );
          if (!hasProvider) {
            openModal(ModalType.SAVE_JWT, {
              jwt: userResponse.jwt,
              stakeKeyBech32,
              expiresAt: decodedToken.exp
                ? new Date(decodedToken.exp * 1000)
                : undefined,
              metadata: {
                keyType: 'stake',
              },
            });
          } else {
            storeJwtInOAuth(
              userResponse.jwt,
              stakeKeyBech32,
              decodedToken.exp ? new Date(decodedToken.exp * 1000) : undefined,
              {
                keyType: 'drep',
              },
            );
          }
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

  const getOAuthProviderId = async (
    stakeKeyBech32: string,
    provider: OAuthProviderType,
  ) => {
    try {
      const providerData = await getOAuthProvider({ stakeKeyBech32, provider });
      return providerData?.id || null;
    } catch (error) {
      console.error('Failed to get OAuth provider ID:', error);
      return null;
    }
  };

  return {
    validateAndRefreshToken,
    performFullLogin,
    ensureAuthenticated,
    storeJwtInOAuth,
    updateJwtInOAuth,
  };
};
