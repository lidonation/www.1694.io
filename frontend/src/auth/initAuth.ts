import { AuthMethod as ExtendedAuthMethod } from '../../types/auth';
import { authService } from './authService';
import { CardanoMeshProvider } from './providers/cardanoMeshProvider';
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
    ExtendedAuthMethod.MESH_HOT_WALLET,
    new CardanoMeshProvider()
  );
  
  authService.registerProvider(
    ExtendedAuthMethod.LOGIN_FILE,
    new LoginFileProvider()
  );

  return authService;
}
