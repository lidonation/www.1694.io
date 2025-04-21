import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { authService, AuthenticationService } from '../auth/authService';
import { 
  AuthMethod,
  AccountInfo, 
} from '../../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  accountInfo: AccountInfo | null;
  isAuthenticating: boolean;
  authError: string | null;
  activeProvider: AuthMethod | null;
  authenticate: (method: AuthMethod | string, params?: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accountInfo: null,
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
  service = authService 
}) => {
  const hasReconnected=useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AuthMethod | null>(null);

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
  const authenticate = async (method: AuthMethod | string, params?: any): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      const result = await service.authenticate(method, params);
      
      if (result.success) {
        setIsAuthenticated(true);
        setAccountInfo(result.accountInfo || null);
        setActiveProvider(service.getActiveProviderName());
        return {
          success: true,
          error: null,
        }
      } else {
        setAuthError(result.error || 'Authentication failed');
        return {
          success: false,
          error: result.error || 'Authentication failed',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setAuthError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await service.disconnect();
      setIsAuthenticated(false);
      setAccountInfo(null);
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
    logout
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