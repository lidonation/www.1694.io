import {
  ACTIVE_PROVIDER_LS_KEY,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  saveDataInSession,
  setItemToLocalStorage,
} from '@/lib';
import {
  AuthenticationProvider,
  AuthResult,
  AccountInfo,
  AuthMethod,
  UnifiedLoginDto,
} from '../../types/auth';
import { CardanoApiWallet } from '@/models/wallet';
import { userLogin } from '@/services/requests/userLogin';
import { LOGIN_TOKEN_1694 } from '@/constants/storage';

/**
 * Service that coordinates different authentication providers
 */
export class AuthenticationService {
  private providers: Record<string, AuthenticationProvider> = {};
  private activeProvider: AuthMethod | null = null;
  private walletApi: CardanoApiWallet | undefined = undefined;

  /**
   * Register an authentication provider
   * @param name Unique identifier for the provider
   * @param provider Implementation of AuthenticationProvider
   */
  registerProvider(name: string, provider: AuthenticationProvider): void {
    this.providers[name] = provider;
  }

  /**
   * Get all registered providers
   * @returns Record of provider names and instances
   */
  getProviders(): Record<string, AuthenticationProvider> {
    return this.providers;
  }

  /**
   * Authenticate with a specific provider
   * @param providerName The name of the provider to use
   * @param params Optional parameters for the provider
   * @returns Authentication result
   */
  async authenticate(providerName: string, params?: any): Promise<AuthResult> {
    const provider = this.providers[providerName];
    if (!provider) {
      return { success: false, error: `Provider ${providerName} not found` };
    }

    try {
      const result = await provider.connect(params);
      if (!result.success) {
        throw new Error(result?.error || 'An error occured');
      }
      const loginRes = await this.login({
        signature: result.accountInfo.loginCredentials.signature,
        signatureKey: result.accountInfo.loginCredentials.key,
        stakeKey: result.accountInfo.stakeKeyBech32,
        method: providerName as AuthMethod,
      });
      if (!loginRes.success) {
        throw new Error(loginRes?.error || 'An error occured');
      }
      saveDataInSession(LOGIN_TOKEN_1694, loginRes.response.access_token);
      this.setActiveProvider(providerName);
      if (result.walletApi) {
        this.walletApi = result.walletApi;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'object'
              ? JSON.stringify(error)
              : String(error),
      };
    }
  }

  /**
   * Login with a specific provider
   * @param providerName The name of the provider to use
   * @param params Optional parameters for the provider
   * @returns Login Result (JWT)
   */

  private async login(loginDto: UnifiedLoginDto) {
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
  }
  /**
   * Get the currently active provider name
   * @returns Provider name or null if none active
   */
  getActiveProviderName(): AuthMethod | null {
    return this.activeProvider;
  }

  getWalletApi(): CardanoApiWallet | undefined {
    return this.walletApi;
  }

  async reconnect(): Promise<AuthResult> {
    const lastProvider = getItemFromLocalStorage(ACTIVE_PROVIDER_LS_KEY);
    let isReconnecting = false; // Flag to prevent spamming reconnections

    if (lastProvider && this.providers[lastProvider]) {
      const provider = this.providers[lastProvider];

      if (provider.reconnect && !isReconnecting) {
        isReconnecting = true;
        try {
          const result = await provider.reconnect();
          if (result.success) {
            this.setActiveProvider(lastProvider);
            isReconnecting = false;
            return result;
          }
        } catch (error) {
          console.error(`Error reconnecting with ${lastProvider}:`, error);
        }
      }
    }

    return {
      success: false,
      error: 'Could not reconnect with the last provider',
    };
  }

  /**
   * Get the currently active provider
   * @returns Provider instance or null if none active
   */
  getActiveProvider(): AuthenticationProvider | null {
    if (!this.activeProvider) return null;
    return this.providers[this.activeProvider];
  }

  /**
   * Get current account information
   * @returns Account info or null if not connected
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    const provider = this.getActiveProvider();
    if (!provider) return null;
    return provider.getAccountInfo();
  }

  /**
   * Check if currently connected
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    const provider = this.getActiveProvider();
    return provider ? provider.isConnected() : false;
  }

  private setActiveProvider(providerName: string) {
    this.activeProvider = providerName as AuthMethod;
    setItemToLocalStorage(ACTIVE_PROVIDER_LS_KEY, providerName);
  }

  /**
   * Disconnect the active provider
   */
  async disconnect(): Promise<void> {
    if (!this.activeProvider) return;
    await this.providers[this.activeProvider].disconnect();
    this.activeProvider = null;
    removeItemFromLocalStorage(ACTIVE_PROVIDER_LS_KEY);
  }
}

// Create a singleton instance for global use
export const authService = new AuthenticationService();
