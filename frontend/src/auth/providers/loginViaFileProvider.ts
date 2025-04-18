import { getItemFromLocalStorage, LOGIN_FILE_LS_KEY } from '@/lib';
import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';

/**
 * Provider that handles authentication via a login key file
 * This allows users to download a key file and use it to authenticate later
 * without needing their wallet connected
 */
export class LoginFileProvider implements AuthenticationProvider {
  private cardanoContext: any;
  private connected: boolean = false;
  private accountInfo: AccountInfo | null = null;
  private loginCredentials: {
    signature: string;
    key: string;
  } | null = null;

  // Capabilities
  supportsMessageSigning = false;
  supportsColdWallet = false;

  constructor(cardanoContext: any) {
    this.cardanoContext = cardanoContext;
  }

  /**
   * Generate and download a login file for the user
   * @returns Promise that resolves when the file has been downloaded
   */
  async generateLoginFile(): Promise<boolean> {
    try {
      if (!this.cardanoContext.isEnabled) {
        throw new Error('Wallet must be connected to generate a login file');
      }

      // Generate login credentials using a generic verification message
      const verificationMessage = 'Verify DRep Login';
      const credentials = await this.cardanoContext.signMessage(
        verificationMessage,
        this.cardanoContext.stakeKey,
      );

      if (!credentials || !credentials.signature || !credentials.key) {
        throw new Error('Failed to generate login credentials');
      }

      // Create login file content
      const loginFileContent = {
        version: 1,
        address: this.cardanoContext.address,
        pubKey: this.cardanoContext.pubDRepKey,
        stakeKey: this.cardanoContext.stakeKey,
        signature: credentials.signature,
        key: credentials.key,
        timestamp: Date.now(),
        message: verificationMessage,
      };

      // Download file
      const blob = new Blob([JSON.stringify(loginFileContent)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drep-login-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error generating login file:', error);
      return false;
    }
  }


  updateCardanoContext(newContext: any) {
    this.cardanoContext = newContext;
  }
  
  /**
   * Reconnect using saved credentials
   * @returns Authentication result
   */
  async reconnect(): Promise<AuthResult> {
  try {
    const savedCredentials = getItemFromLocalStorage(LOGIN_FILE_LS_KEY);
    
    if (!savedCredentials) {
      return {
        success: false,
        error: 'No saved login credentials found'
      };
    }
    
    // Connect using saved credentials
    return this.connect({ credentials: savedCredentials });
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

  /**
   * Connect using a login file
   * @param params File object or login credentials directly
   * @returns Authentication result
   */
  async connect(params?: {
    file?: File;
    credentials?: { signature: string; key: string };
  }): Promise<AuthResult> {
    try {
      let credentials;

      if (params?.file) {
        // Read credentials from uploaded file
        const fileContent = await params.file.text();
        const loginData = JSON.parse(fileContent);

        if (!loginData.signature || !loginData.key) {
          throw new Error('Invalid login file format');
        }

        credentials = {
          signature: loginData.signature,
          key: loginData.key,
        };
      } else if (params?.credentials) {
        // Use provided credentials directly
        credentials = params.credentials;
      } else {
        throw new Error('Either a login file or credentials must be provided');
      }

      // Verify credentials with backend if needed
      // In a real implementation, you would verify these credentials
      // with your backend to ensure they're valid

      this.loginCredentials = credentials;
      this.connected = true;

      // Extract account info from the credentials
      // In a real implementation, you might need to make an API call
      // to get this information based on the public key
      this.accountInfo = {
        address: params?.file
          ? JSON.parse(await params.file.text()).address
          : '',
        stakeKey: credentials.key,
        // Other fields would need to be fetched from an API
        balance: '',
        dRepInfo: {
          id: '',
          delegatedTo: '',
          votingPower: '',
        },
      };

      return {
        success: true,
        accountInfo: this.accountInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.accountInfo = null;
    this.loginCredentials = null;
  }

  /**
   * Check if connected
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    return this.connected && this.loginCredentials !== null;
  }

  /**
   * Get account information
   * @returns Account info or null if not connected
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    return this.accountInfo;
  }
}
