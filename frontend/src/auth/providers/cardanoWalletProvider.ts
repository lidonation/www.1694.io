import {
  deleteDataFromSession,
  fromBech32ToHex,
  getItemFromLocalStorage,
  WALLET_LS_KEY,
} from '@/lib';
import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';
import { CardanoContext } from '@/context/cardanoContext';
import { CardanoApiWallet } from '@/models/wallet';
import {
  Credential,
  Ed25519KeyHash,
} from '@emurgo/cardano-serialization-lib-asmjs';

export class CardanoWalletProvider implements AuthenticationProvider {
  private cardanoContext: CardanoContext;
  private connected: boolean = false;
  private walletName: string | null = null;

  supportsMessageSigning = true;
  supportsColdWallet = false;

  constructor(cardanoContext: CardanoContext) {
    this.cardanoContext = cardanoContext;
  }

  /**
   * Connect to a Cardano wallet extension
   * @param walletName Name of the wallet to connect to (e.g., 'nami', 'eternl')
   * @returns Authentication result
   */
  async connect(walletName: string): Promise<AuthResult> {
    try {
      console.log(`Connecting to Cardano wallet: ${walletName}`);
      const result = await this.cardanoContext.enable(walletName);
      console.log('Cardano wallet connection result:', result);

      if (result.status === 'ok') {
        const payloadBuffer = Buffer.from(
          'Please verify your identity',
        ).toString('hex');
        await this.cardanoContext.walletApi.signData(
          this.cardanoContext.stakeKey,
          payloadBuffer,
        );
        this.connected = true;
        this.walletName = walletName;

        return {
          success: true,
          accountInfo: await this.getAccountInfo(),
        };
      }

      if (result.status === 'WRONG_NETWORK') {
        return {
          success: false,
          error: 'Wallet is connected to the wrong network',
        };
      }

      return {
        success: false,
        error: result.error || 'Unknown error connecting to wallet',
      };
    } catch (error) {
      console.error('Error connecting to Cardano wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    await this.cardanoContext.disconnectWallet();
    this.connected = false;
    this.walletName = null;
    deleteDataFromSession('pdfUserJwt');
  }

  /**
   * Check if connected to a wallet
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    return this.connected && this.cardanoContext.isEnabled;
  }

  /**
   * Get current account information
   * @returns Account information
   */
  async getAccountInfo(): Promise<{
    address: string;
    balance: string;
    stakeKey: string;
    dRepInfo: {
      isDRep: boolean;
      votingPower: string;
      dRepId: string;
      dRepKeyHash: Ed25519KeyHash;
      delegatedTo: string;
      dRepIdBech32: string;
    };
    stakeKeyBech32: string;
  }> {
    if (!this.isConnected()) return null;

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });

    const dRepId = fromBech32ToHex(this.cardanoContext.dRepIDBech32);
    const dRepCredential = this.buildCredentialFromBech32Key(dRepId);

    return {
      address: this.cardanoContext.address || '',
      stakeKey: this.cardanoContext.stakeKey || '',
      stakeKeyBech32: this.cardanoContext.stakeKeyBech32 || '',
      balance: this.cardanoContext.walletState?.balance?.toString() || '',
      dRepInfo: {
        isDRep: this.cardanoContext?.dRepRegistration?.registered || false,
        dRepId: this.cardanoContext.dRepID || '',
        dRepKeyHash: dRepCredential.to_keyhash() || null,
        dRepIdBech32: this.cardanoContext.dRepIDBech32 || '',
        delegatedTo: this.cardanoContext.delegatedDRepID || '',
        votingPower: this.cardanoContext.dRepRegistration?.voting_power || '',
      },
    };
  }
  /**
   * Update the Cardano context
   * @param newContext New Cardano context
   */
  updateCardanoContext(newContext: CardanoContext) {
    this.cardanoContext = newContext;
  }
  /**
   * Sync connection state with the wallet
   */
  syncConnectionState() {
    if (!this.connected) {
      console.log('Syncing connection state, enabling wallet');
      this.connected = true;
    }
  }

  /**
   * Reconnect to the wallet using saved information
   * @returns Authentication result
   */
  async reconnect(): Promise<AuthResult> {
    try {
      const walletName = getItemFromLocalStorage(`${WALLET_LS_KEY}_name`);
      const existingWalletAPI = getItemFromLocalStorage(
        `${WALLET_LS_KEY}_api`,
      ) as CardanoApiWallet;

      if (!walletName || !existingWalletAPI) {
        return {
          success: false,
          error: 'No saved wallet information found',
        };
      }

      this.cardanoContext.setWalletApi(existingWalletAPI);

      const result = await this.cardanoContext.enable(walletName);

      if (result.status === 'ok') {
        this.connected = true;
        this.walletName = walletName;

        return {
          success: true,
          accountInfo: await this.getAccountInfo(),
        };
      }

      return {
        success: false,
        error: result.error || 'Failed to reconnect wallet',
      };
    } catch (error) {
      console.error('Error reconnecting to Cardano wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the name of the connected wallet
   * @returns Wallet name or null if not connected
   */
  getWalletName(): string | null {
    return this.walletName;
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
}
