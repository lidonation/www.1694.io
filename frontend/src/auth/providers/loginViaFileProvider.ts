import {  deleteDataFromSession, LOGIN_FILE_LS_KEY } from '@/lib';
import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';
import { verifySignatures } from '@/services/requests/verifySignatures';
import { getProfileData } from '@/services/requests/getProfileData';
import {
  deleteItemFromIndexedDB,
  getFileFromIndexedDB,
  setFileToIndexedDB,
} from '@/lib/indexedDb';
import {
  Credential,
  Ed25519KeyHash,
} from '@emurgo/cardano-serialization-lib-asmjs';

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
      const savedLoginData = (await getFileFromIndexedDB(
        LOGIN_FILE_LS_KEY,
      )) as File;

      if (!savedLoginData) {
        return {
          success: false,
          error: 'No saved login credentials found',
        };
      }

      return this.connect({ file: savedLoginData });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Connect using a login file
   * @param params File object or login credentials directly
   * @returns Authentication result
   */
  async connect(params?: { file?: File }): Promise<AuthResult> {
    try {
      if (params?.file) {
        const fileContent = await params.file.text();
        const loginData = JSON.parse(fileContent);

        if (
          !loginData.signatures.signature ||
          !loginData.signatures.vkey ||
          !loginData.stakeKeyBech32
        ) {
          throw new Error('Invalid login file format');
        }

        const signaturesVerification = await verifySignatures({
          signatures: {
            signature: loginData.signatures.signature,
            vkey: loginData.signatures.vkey,
          },
          address: loginData.stakeKeyBech32,
        });

        if (!signaturesVerification.payloadResultMatch) {
          throw new Error('Signature verification failed');
        }

        const credentials = {
          signature: loginData.signatures.signature,
          key: loginData.signatures.vkey,
        };

        this.loginCredentials = credentials;

        const profileData = await getProfileData(loginData.stakeKeyBech32);

        this.accountInfo = {
          address: null,
          stakeKey: loginData.stakeKeyHex,
          stakeKeyBech32: loginData.stakeKeyBech32,
          balance: profileData?.walletBalance,
          dRepInfo: {
            isDRep: profileData?.isDrep,
            dRepId: profileData?.isDrep ? profileData?.selfDRepRaw : '',
            dRepIdBech32: profileData?.isDrep ? profileData?.selfDRepView : '',
            dRepKeyHash: profileData?.isDrep
              ? this.buildCredentialFromBech32Key(
                  profileData?.selfDRepRaw,
                ).to_keyhash()
              : null,
            delegatedTo: profileData?.isDrep
              ? profileData?.selfDRepView
              : profileData?.delegatedToDRepView,
            votingPower: profileData?.isDrep
              ? profileData?.selfVotingPower
              : profileData?.delegatedToVotingPower,
          },
        } as AccountInfo;

        this.connected = true;
        await setFileToIndexedDB(LOGIN_FILE_LS_KEY, params.file);
      } else {
        throw new Error('Either a login file or credentials must be provided');
      }

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
    await deleteItemFromIndexedDB(LOGIN_FILE_LS_KEY);
    deleteDataFromSession('pdfUserJwt');
  }

  /**
   * Check if connected
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    return this.connected && this.loginCredentials !== null;
  }

  buildCredentialFromBech32Key(key: string) {
    try {
      const keyHash = Ed25519KeyHash.from_hex(key);
      return Credential.from_keyhash(keyHash);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Get account information
   * @returns Account info or null if not connected
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    return this.accountInfo;
  }
}
