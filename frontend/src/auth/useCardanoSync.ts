// src/auth/syncCardanoContext.ts
import { useEffect } from 'react';
import { useCardano } from '@/context/cardanoContext';
import { authService } from './authService';
import { CardanoWalletProvider } from './providers/cardanoWalletProvider';
import { LoginFileProvider } from './providers/loginViaFileProvider';
import { AuthMethod as ExtendedAuthMethod } from '../../types/auth';
/**
 * Hook to sync CardanoContext state with authentication providers
 */
export function useCardanoSync() {
  const cardanoContext = useCardano();
  const hotWalletProvider = authService.getProviders()[ExtendedAuthMethod.HOT_WALLET] as CardanoWalletProvider;
  const loginFileProvider = authService.getProviders()[ExtendedAuthMethod.LOGIN_FILE] as LoginFileProvider;
  
  useEffect(() => {
    if (hotWalletProvider) {
      hotWalletProvider.updateCardanoContext(cardanoContext);
    }
    
    if (loginFileProvider) {
      loginFileProvider.updateCardanoContext(cardanoContext);
    }
    
    if (cardanoContext.isEnabled && !authService.isConnected() && hotWalletProvider) {
      hotWalletProvider.syncConnectionState();
    }
    
    if (!cardanoContext.isEnabled && authService.isConnected()) {
      console.log('Cardano context is disabled, disconnecting from wallet');
      authService.disconnect();
    }
    
  }, [
    cardanoContext,
    hotWalletProvider,
    loginFileProvider,
    authService.isConnected(),
  ]);
}