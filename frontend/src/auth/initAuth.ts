import { AuthMethod as ExtendedAuthMethod } from '../../types/auth';
import { authService } from './authService';
import { CardanoWalletProvider } from './providers/cardanoWalletProvider';
import { LoginFileProvider } from './providers/loginViaFileProvider';


/**
 * Initialize the authentication service with providers
 * @returns Initialized authentication service
 */
export function initializeAuthentication() {
  authService.registerProvider(
    ExtendedAuthMethod.HOT_WALLET,
    new CardanoWalletProvider()
  );
  
  authService.registerProvider(
    ExtendedAuthMethod.LOGIN_FILE,
    new LoginFileProvider()
  );
  
  console.log('Authentication service initialized with all providers');
  return authService;
}
