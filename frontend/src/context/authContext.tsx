import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { authService, AuthenticationService } from '../auth/authService';
import { AuthMethod, AccountInfo, UnifiedLoginDto } from '../../types/auth';
import { CardanoApiWallet } from '@/models/wallet';
import { userLogin } from '@/services/requests/userLogin';
import { saveDataInSession } from '@/lib';
import { LOGIN_TOKEN_1694 } from '@/constants/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  accountInfo: AccountInfo | null;
  walletApi?: CardanoApiWallet;
  isAuthenticating: boolean;
  authError: string | null;
  walletBeingConnected?: string | null;
  activeProvider: AuthMethod | null;
  authenticate: (
    method: AuthMethod | string,
    params?: any,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accountInfo: null,
  walletApi: undefined,
  walletBeingConnected: null,
  isAuthenticating: false,
  authError: null,
  activeProvider: null,
  authenticate: async () => ({
    success: false,
    error: 'No authentication method provided',
  }),
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
  service?: AuthenticationService;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  service = authService,
}) => {
  const hasReconnected = useRef(false);
  const [walletBeingConnected, setWalletBeingConnected] = useState<
    string | null
  >(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AuthMethod | null>(null);
  const [walletApi, setWalletApi] = useState<CardanoApiWallet | undefined>(
    undefined,
  );

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (service.isConnected()) {
        setIsAuthenticated(true);
        setActiveProvider(service.getActiveProviderName());
        const info = await service.getAccountInfo();
        setAccountInfo(info);
      }
    };

    checkAuthStatus();
  }, [service]);

  useEffect(() => {
    const tryReconnect = async () => {
      if (hasReconnected.current) return;
      try {
        const result = await service.reconnect();
        if (result.success) {
          setIsAuthenticated(true);
          setActiveProvider(service.getActiveProviderName());
          setAccountInfo(result.accountInfo || null);
          hasReconnected.current = true;
          if (result.walletApi) {
            setWalletApi(result.walletApi);
          }
        }
      } catch (error) {
        console.error('Reconnection error:', error);
      }
    };

    tryReconnect();
  }, [service]);

  /**
   * Authenticate with a specific method
   * @param method Authentication method to use
   * @param params Optional parameters for the method
   * @returns Success status
   */
  const authenticate = async (
    method: AuthMethod | string,
    params?: any,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (method === AuthMethod.HOT_WALLET) {
        setWalletBeingConnected(params);
      }
      const result = await service.authenticate(method, params);

      if (!result.success) {
        setAuthError(result.error || 'Authentication failed');
        setIsAuthenticated(false);
        setAccountInfo(null);
        setActiveProvider(null);
        setWalletApi(undefined);
        setWalletBeingConnected(null);
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
      const loginRes = await login({
        signature: result.accountInfo.loginCredentials.signature,
        signatureKey: result.accountInfo.loginCredentials.key,
        stakeKey: result.accountInfo.stakeKeyBech32,
        method: method as AuthMethod,
      });

      if (!loginRes.success) {
        throw new Error(loginRes?.error || 'An error occured');
      }

      saveDataInSession(LOGIN_TOKEN_1694, loginRes.response.access_token);

      setIsAuthenticated(true);
      setAccountInfo(result.accountInfo || null);
      setActiveProvider(service.getActiveProviderName());
      if (result.walletApi) {
        setWalletApi(result.walletApi);
      }
      setWalletBeingConnected(null);
      return {
        success: true,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setAuthError(errorMessage);
      setIsAuthenticated(false);
      setAccountInfo(null);
      setActiveProvider(null);
      setWalletApi(undefined);
      setWalletBeingConnected(null);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const login = async (loginDto: UnifiedLoginDto) => {
    try {
      const response = await userLogin(loginDto);
      return {
        success: true,
        response,
        error: null,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
      };
    }
  };
  const logout = async (): Promise<void> => {
    try {
      await service.disconnect();
      setIsAuthenticated(false);
      setAccountInfo(null);
      setWalletApi(undefined);
      setActiveProvider(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    isAuthenticated,
    accountInfo,
    isAuthenticating,
    authError,
    activeProvider,
    authenticate,
    logout,
    walletApi,
    walletBeingConnected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use the authentication context
 * @returns Authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
