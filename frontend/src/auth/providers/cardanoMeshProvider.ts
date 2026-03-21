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
      console.log(`Connecting to wallet: ${walletName} via MeshJS`);
      
      const { BrowserWallet } = await import('@meshsdk/core');
      
      // Enable wallet with CIP-95 extension
      this.wallet = await BrowserWallet.enable(walletName, [{ cip: 95 }]);
      this.walletName = walletName;

      // Validate network
      const network = await this.wallet.getNetworkId();
      if (network !== CONFIGURED_NETWORK_ID) {
        const errorMsg = CONFIGURED_NETWORK_ID === 1 
          ? 'Mainnet network wallet required' 
          : 'Testnet network wallet required';
        throw new Error(errorMsg);
      }

      // Get account info
      const info = await this.fetchAccountInfo();
      this.accountInfo = info;
      this.connected = true;

      // Save to local storage for reconnection
      setItemToLocalStorage(`${WALLET_LS_KEY}_name`, walletName);
      // Note: we don't save the API object itself as Mesh handles it

      return {
        success: true,
        accountInfo: info,
        walletApi: (await window.cardano[walletName].enable()) as CardanoApiWallet,
      };
    } catch (error) {
      console.error('MeshJS connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
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
    const address = convertAddressToBech32(rawAddress);
    
    const balance = await this.wallet.getLovelace();
    const hexRewardAddresses = await walletApi.getRewardAddresses();
    console.log('Hex reward addresses:', hexRewardAddresses);
    if (!hexRewardAddresses || hexRewardAddresses.length === 0) {
      throw new Error('No reward addresses found in wallet');
    }
    const stakeKeyHex = hexRewardAddresses[0];
    const stakeKeyBech32 = convertAddressToBech32(stakeKeyHex);

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
