import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';
import { CardanoApiWallet } from '@/models/wallet';
import {
  deleteDataFromSession,
  fromBech32ToHex,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setItemToLocalStorage,
  WALLET_LS_KEY,
} from '@/lib';
import { CONFIGURED_NETWORK_ID } from '@/constants';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';

export class CardanoMeshProvider implements AuthenticationProvider {
  private wallet: any | null = null;
  private walletName: string | null = null;
  private connected: boolean = false;
  private accountInfo: AccountInfo | null = null;

  supportsMessageSigning = true;
  supportsColdWallet = false;

  async connect(walletName: string): Promise<AuthResult> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Connection must be initiated from the browser');
      }

      const { BrowserWallet } = await import('@meshsdk/core');
      
      console.log(`[MeshProvider] Connecting with Network ID: ${CONFIGURED_NETWORK_ID}`);
      
      try {
        this.wallet = await BrowserWallet.enable(walletName, [{ cip: 95 }]);
      } catch (e) {
        this.wallet = await BrowserWallet.enable(walletName);
      }

      if (!this.wallet) {
        throw new Error(`Failed to enable wallet: ${walletName}`);
      }
      this.walletName = walletName;

      const network = await this.wallet.getNetworkId();
      console.log(`[MeshProvider] Wallet reported network ID: ${network}`);
      
      if (network !== CONFIGURED_NETWORK_ID) {
        const networkName = CONFIGURED_NETWORK_ID === 1 ? 'Mainnet' : 'Testnet/Preview';
        throw new Error(`Wallet network mismatch. Please switch your wallet to ${networkName}.`);
      }

      const info = await this.fetchAccountInfo();
      this.accountInfo = info;
      this.connected = true;

      setItemToLocalStorage(`${WALLET_LS_KEY}_name`, walletName);

      return {
        success: true,
        accountInfo: info,
        walletApi: (await window.cardano[walletName].enable()) as CardanoApiWallet,
      };
    } catch (error) {
      console.error('[MeshProvider] Connection error full object:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' ? JSON.stringify(error) : String(error));
        
      return {
        success: false,
        error: errorMessage === 'undefined' ? 'Unknown wallet error (connection rejected or timed out)' : errorMessage,
      };
    }
  }

  async reconnect(): Promise<AuthResult> {
    const savedName = getItemFromLocalStorage(`${WALLET_LS_KEY}_name`);
    if (savedName) {
      return this.connect(savedName);
    }
    return { success: false, error: 'No saved wallet found' };
  }

  async disconnect(): Promise<void> {
    this.wallet = null;
    this.walletName = null;
    this.connected = false;
    this.accountInfo = null;
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_name`);
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_stake_key`);
    deleteDataFromSession('pdfUserJwt');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getAccountInfo(): Promise<AccountInfo | null> {
    return this.accountInfo;
  }

  private async fetchAccountInfo(): Promise<AccountInfo> {
    if (!this.wallet) throw new Error('Wallet not enabled');

    const { convertAddressToBech32 } = await import('@/lib');
    
    // Use the low-level wallet API for signing to avoid Bech32 issues in high-level SDKs
    const walletApi = await window.cardano[this.walletName!].enable();
    
    const rawAddress = await walletApi.getChangeAddress();
    console.log('[MeshProvider] Raw Change Address:', rawAddress);
    
    let address = '';
    try {
      address = convertAddressToBech32(rawAddress);
    } catch (e) {
      console.error(`[MeshProvider] Failed to convert change address: ${rawAddress}`, e);
      throw new Error(`Invalid change address: ${String(e)}`);
    }
    
    const balance = await this.wallet.getLovelace();
    const hexRewardAddresses = await walletApi.getRewardAddresses();
    console.log('[MeshProvider] Raw Reward Addresses:', hexRewardAddresses);
    
    if (!hexRewardAddresses || hexRewardAddresses.length === 0) {
      throw new Error('No reward addresses found in wallet');
    }
    
    let stakeKeyHex = hexRewardAddresses[0];
    let stakeKeyBech32 = '';
    
    try {
      stakeKeyBech32 = convertAddressToBech32(stakeKeyHex);
    } catch (e) {
      console.error(`[MeshProvider] Failed to convert stake address: ${stakeKeyHex}`, e);
      throw new Error(`Invalid stake address: ${String(e)}`);
    }

    // CIP-95 specific data
    const dRepKey = await walletApi.cip95?.getPubDRepKey();
    const dRepIDBech32 = dRepKey
      ? await this.getDRepIdentifier(walletApi)
      : '';
    
    const registeredStakeKeys = await walletApi.cip95?.getRegisteredPubStakeKeys() || [];

    // Fetch DRep registration status from backend
    let dRepRegistration = null;
    if (dRepIDBech32 && dRepIDBech32.includes('1')) {
      dRepRegistration = await getDRepRegStatus(dRepIDBech32);
    }

    // Backend authentication credentials
    // IMPORTANT: The backend expects this exact message
    const message = 'Please verify your identity';
    const payloadHex = Buffer.from(message).toString('hex');
    
    // Sign using the low-level API with the hex address
    const signedData = await walletApi.signData(stakeKeyHex, payloadHex);

    return {
      address: '', 
      addressBech32: address,
      stakeKeyBech32: stakeKeyBech32,
      registeredStakeKeysListState: registeredStakeKeys,
      balance: balance,
      loginCredentials: {
        signature: signedData.signature,
        key: signedData.key,
      },
      dRepInfo: {
        isDRep: !!dRepRegistration?.registered,
        dRepId: (dRepIDBech32 && dRepIDBech32.includes('1')) ? fromBech32ToHex(dRepIDBech32) : null,
        dRepIdBech32: dRepIDBech32,
        votingPower: dRepRegistration?.voting_power || '0',
        delegatedTo: dRepRegistration?.delegated_to || '',
      },
    };
  }

  private async getDRepIdentifier(walletApi: CardanoApiWallet): Promise<string> {
    try {
      const { getPubDRepID } = await import('@/lib');
      const dRepIDs = await getPubDRepID(walletApi);
      return dRepIDs.dRepIDBech32;
    } catch (e) {
      console.error('Error getting DRep ID:', e);
      return '';
    }
  }
}
