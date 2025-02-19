import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';

const SharedContext = createContext(null);
export interface SharedState {
  isWalletListModalOpen: boolean;
  isLoginModalOpen: boolean;
  isLoggedIn: boolean;
  isNotDRepErrorModalOpen: boolean;
  isMobileDrawerOpen: boolean;
  hideCloseButtonOnLoginModal: boolean;
  loginCredentials: {
    signature: string | null;
    key: string | null;
  };
  drepId: number;
  dRepIDBech32: string;
  stakeKey: string;
}
export function SharedProvider({ children }) {
  const [sharedState, setSharedState] = useState({
    isWalletListModalOpen: false,
    isLoginModalOpen: false,
    isLoggedIn: false,
    isNotDRepErrorModalOpen: false,
    isMobileDrawerOpen: false,
    hideCloseButtonOnLoginModal: false,
    loginCredentials: {
      signature: null,
      key: null,
    },
    dRepIDBech32: '',
    stakeKey: '',
    drepId: null,
  });

  const updateSharedState = useCallback((newState) => {
    setSharedState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  const value = useMemo(
    () => ({
      sharedState,
      updateSharedState,
    }),
    [sharedState, updateSharedState],
  );

  return (
    <SharedContext.Provider value={value}>{children}</SharedContext.Provider>
  );
}

export function useSharedContext() {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error('useSharedContext must be used within a SharedProvider');
  }
  return context;
}
