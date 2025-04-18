import { TransactionHandler } from '@/hooks/useTransactionHandler';
import { AuthMethod as ExtendedAuthMethod } from '../../types/auth';
import { authService } from './authService';
import { CardanoWalletProvider } from './providers/cardanoWalletProvider';
import { ColdWalletProvider } from './providers/coldWalletProvider';
import { LoginFileProvider } from './providers/loginViaFileProvider';
import { CardanoContext } from '@/context/cardanoContext';


/**
 * Initialize the authentication service with providers
 * @param cardanoContext Cardano context for wallet provider
 * @param transactionHandler Transaction handler for cold wallet provider
 * @returns Initialized authentication service
 */
export function initializeAuthentication(cardanoContext: CardanoContext, transactionHandler: TransactionHandler) {
  authService.registerProvider(
    ExtendedAuthMethod.HOT_WALLET,
    new CardanoWalletProvider(cardanoContext)
  );
  
  authService.registerProvider(
    ExtendedAuthMethod.COLD_WALLET,
    new ColdWalletProvider(transactionHandler)
  );
  
  authService.registerProvider(
    ExtendedAuthMethod.LOGIN_FILE,
    new LoginFileProvider(cardanoContext)
  );
  
  console.log('Authentication service initialized with all providers');
  return authService;
}
