import { TransactionHandler } from '@/hooks/useTransactionHandler';
import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';
import {Ed25519KeyHash} from "@emurgo/cardano-serialization-lib-asmjs";
/**
 * Provider that handles cold wallet signing via file download/upload
 */
export class ColdWalletProvider implements AuthenticationProvider {
  private transactionHandler: TransactionHandler;
  private connected: boolean = false;
  private accountInfo: AccountInfo | null = null;

  // Capabilities
  supportsMessageSigning = true;
  supportsColdWallet = true;

  constructor(transactionHandler: TransactionHandler) {
    this.transactionHandler = transactionHandler;
  }

  /**
   * Connect using a cold wallet flow
   * @returns Authentication result
   */
  async connect(): Promise<AuthResult> {
    try {
      console.log('Connecting to cold wallet...');
      const result = await this.transactionHandler.handleTransaction(
        null,
        'loginViaMessageSigning',
        undefined,
        {
          disableSigning: true,
          disableDownload: false, 
          objectToSign: 'message',
          message: 'Verify DRep Login',
        },
      );

      if (result && result.signature && result.vkey) {
        this.connected = true;

        //TODO: Send data to backend for verification and deriving address
        this.accountInfo = {
          address: '', // Derive from vkey if possible
          stakeKey: result.vkey,
          balance: '', // Cold wallet can't know balance
        };

        return {
          success: true,
          accountInfo: this.accountInfo,
        };
      }

      return {
        success: false,
        error: 'Failed to authenticate with cold wallet',
      };
    } catch (error) {
      console.error('Cold wallet connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Disconnect the cold wallet
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.accountInfo = null;
  }

  /**
   * Check if connected
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get account information
   * @returns Account info or null if not connected
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    return this.accountInfo;
  }

 
}
