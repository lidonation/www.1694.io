import { AuthMethod as ExtendedAuthMethod } from '../../types/auth';
import { authService } from './authService';
import { CardanoMeshProvider } from './providers/cardanoMeshProvider';
import { LoginFileProvider } from './providers/loginViaFileProvider';

/**
 * Initialize the authentication service with providers
 * @returns Initialized authentication service
 */
export function initializeAuthentication() {
  if (typeof window === 'undefined') return authService;

  authService.registerProvider(
    ExtendedAuthMethod.HOT_WALLET,
    new CardanoMeshProvider(),
  );

  authService.registerProvider(
    ExtendedAuthMethod.LOGIN_FILE,
    new LoginFileProvider(),
  );

  return authService;
}
