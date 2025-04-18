'use client';
import { CardanoProvider } from './cardanoContext';
import { DRepProvider } from './drepContext';
import QueryProvider from './queryClientProvider';
import { GlobalNotificationsProvider } from './globalNotificationContext';
import { SharedProvider } from './sharedContext';
import { WalletProvider } from './walletContext';
import { AuthProvider } from './authContext';
import { useEffect, useRef } from 'react';
import { useCardano } from './cardanoContext';
import { useTransactionHandler } from '@/hooks/useTransactionHandler';
import { initializeAuthentication } from '../auth/initAuth';
import { useCardanoSync } from '@/auth/useCardanoSync';


function AuthInitializer({ children }) {
  const cardanoContext = useCardano();
  const { walletState } = cardanoContext;
  const transactionHandler = useTransactionHandler({ walletState });
  const isInitialized = useRef(false);
  
  useEffect(() => {
    if (!isInitialized.current) {
      initializeAuthentication(cardanoContext, transactionHandler);
      isInitialized.current = true;
    }
  }, [cardanoContext, transactionHandler]);

  useCardanoSync()

  return <>{children}</>;
}

export function AppContextProvider({ children }) {
  return (
    <QueryProvider>
      <GlobalNotificationsProvider>
        <SharedProvider>
          <CardanoProvider>
            <AuthProvider>
              <AuthInitializer>
                <WalletProvider>
                  <DRepProvider>
                    {children}
                  </DRepProvider>
                </WalletProvider>
              </AuthInitializer>
            </AuthProvider>
          </CardanoProvider>
        </SharedProvider>
      </GlobalNotificationsProvider>
    </QueryProvider>
  );
}