import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import { useAuth } from './authContext';
import { AuthMethod } from '../../types/auth';

interface WalletState {
  address: string | null;
  stakeKey: string | null;
  stakeKeyBech32: string | null;
  isConnected: boolean;
  balance: string | null;
  dRepDelegatedTo?: string | null;
  dRepDelegatedToVotingPower?: string | null;
  isConnecting: boolean;
  error: string | null;
}

interface WalletContextType {
  wallet: WalletState;
  connectWallet: (method: string, params?: any) => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  isHotWallet: boolean;
  isColdWallet: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const {
    accountInfo,
    isAuthenticated,
    isAuthenticating,
    authError,
    logout,
    authenticate,
    activeProvider,
  } = useAuth();

  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    stakeKey: null,
    stakeKeyBech32: null,
    isConnected: false,
    balance: null,
    dRepDelegatedTo: null,
    dRepDelegatedToVotingPower: null,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    if (isAuthenticated && !isAuthenticating && accountInfo) {
      setWallet({
        address: accountInfo.address,
        stakeKey: accountInfo.stakeKey || null,
        stakeKeyBech32: accountInfo.stakeKeyBech32 || null,
        isConnected: true,
        balance: accountInfo.balance || null,
        dRepDelegatedTo: accountInfo.dRepInfo?.delegatedTo || null,
        dRepDelegatedToVotingPower: accountInfo.dRepInfo?.votingPower || null,
        isConnecting: false,
        error: null,
      });
    }
  }, [isAuthenticated, accountInfo, isAuthenticating, authError]);

  /**
   * Connect wallet using a specific method
   * @param method Authentication method
   * @param params Optional parameters for the method
   * @returns Success status
   */
  const connectWallet = async (
    method: string,
    params?: any,
  ): Promise<boolean> => {
    try {
      return await authenticate(method, params);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    await logout();
    setWallet({
      address: null,
      stakeKey: null,
      stakeKeyBech32: null,
      isConnected: false,
      balance: null,
      dRepDelegatedTo: null,
      dRepDelegatedToVotingPower: null,
      isConnecting: false,
      error: null,
    });
  };

  const isHotWallet = activeProvider === AuthMethod.HOT_WALLET;
  const isColdWallet = activeProvider === AuthMethod.COLD_WALLET;

  const value = useMemo(
    () => ({
      wallet,
      connectWallet,
      disconnectWallet,
      isHotWallet,
      isColdWallet,
    }),
    [wallet, isHotWallet, isColdWallet],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

/**
 * Hook to use the wallet context
 * @returns Wallet context
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
};
