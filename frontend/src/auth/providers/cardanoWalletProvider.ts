import {
  deleteDataFromSession,
  fromBech32ToHex,
  getItemFromLocalStorage,
  getPubDRepID,
  removeItemFromLocalStorage,
  setEpochParams,
  setItemToLocalStorage,
  WALLET_LS_KEY,
} from '@/lib';
import {
  AuthenticationProvider,
  AccountInfo,
  AuthResult,
} from '../../../types/auth';
import { CardanoApiWallet } from '@/models/wallet';
import {
  Address,
  Credential,
  Ed25519KeyHash,
  PublicKey,
  RewardAddress,
  Value,
} from '@emurgo/cardano-serialization-lib-asmjs';
import { CONFIGURED_NETWORK_ID } from '@/constants';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';

export class CardanoWalletProvider implements AuthenticationProvider {
  private connected: boolean = false;
  private addressBech32?: string = undefined;
  private walletName: string | null = null;
  private isEnabled: boolean = false;
  private isEnabling: boolean = false;
  private isEnableLoading: string | null = null;
  private enabledNetwork: number | null = null;
  private walletApi?: CardanoApiWallet;
  private address?: string;
  private pubDRepKey: string = '';
  private dRepID: string = '';
  private dRepIDBech32: string = '';
  private stakeKey?: string = null;
  private stakeKeyBech32?: string = null;
  private stakeKeys: string[] = [];
  private registeredStakeKeysListState: string[] = [];
  private error?: string;
  private delegatedDRepID?: string;
  private walletState: {
    changeAddress?: string;
    usedAddress?: string;
    balance?: number;
  } = {};
  private dRepRegistration: {
    registered: boolean;
    view: string;
    deposit: string | null;
    voting_power: string;
  } | null = null;
  private loginCredentials: {
    signature: string;
    key: string;
  } | null = null;

  supportsMessageSigning = true;
  supportsColdWallet = false;

  constructor() {}

  /**
   * Connect to a Cardano wallet extension
   * @param walletName Name of the wallet to connect to (e.g., 'nami', 'eternl')
   * @returns Authentication result
   */
  async connect(walletName: string): Promise<AuthResult> {
    try {
      const result = await this.enable(walletName);

      if (result.status === 'ok') {
        const messageToSign = 'Please verify your identity';
        const payloadBuffer = Buffer.from(messageToSign).toString('hex');
        const loginPayload = await this.walletApi.signData(
          this.stakeKey,
          payloadBuffer,
        );
        this.loginCredentials = {
          signature: loginPayload.signature,
          key: loginPayload.key,
        };
        this.connected = true;
        this.walletName = walletName;

        return {
          success: true,
          accountInfo: await this.getAccountInfo(),
          walletApi: this.walletApi,
        };
      }
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
    this.disconnectWallet();
    this.connected = false;
    this.walletName = null;
    deleteDataFromSession('pdfUserJwt');
  }

  /**
   * Check if connected to a wallet
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean {
    return this.connected && this.isEnabled;
  }

  /**
   * Get current account information
   * @returns Account information
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    if (!this.isConnected()) return null;

    const dRepId = fromBech32ToHex(this.dRepIDBech32);
    const dRepCredential = this.buildCredentialFromBech32Key(dRepId);

    return {
      address: this.address || '',
      addressBech32: this.addressBech32 || '',
      stakeKey: this.stakeKey || '',
      stakeKeyBech32: this.stakeKeyBech32 || '',
      balance: this.walletState?.balance?.toString() || '',
      registeredStakeKeysListState: this.registeredStakeKeysListState || [],
      dRepInfo: {
        isDRep: this?.dRepRegistration?.registered || false,
        dRepId: this.dRepID || '',
        dRepKeyHash: dRepCredential.to_keyhash() || null,
        dRepIdBech32: this.dRepIDBech32 || '',
        delegatedTo: this.delegatedDRepID || '',
        votingPower: this.dRepRegistration?.voting_power || '',
      },
      loginCredentials: this.loginCredentials || null,
    };
  }

  /**
   * Sync connection state with the wallet
   */
  syncConnectionState() {
    if (!this.connected) {

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

      this.walletApi = existingWalletAPI;

      const result = await this.enable(walletName);

      if (result.status === 'ok') {
        this.connected = true;
        this.walletName = walletName;

        return {
          success: true,
          accountInfo: await this.getAccountInfo(),
          walletApi: this.walletApi,
        };
      }

      return {
        success: false,
        error: 'Failed to reconnect wallet',
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

  async getChangeAddress(enabledApi: CardanoApiWallet) {
    try {
      const raw = await enabledApi.getChangeAddress();
      const changeAddress = Address.from_bytes(
        Buffer.from(raw, 'hex') as any,
      ).to_bech32();
      this.walletState.changeAddress = changeAddress;
      return changeAddress;
    } catch (err) {
      console.log(err);
    }
  }

  async getBalance(enabledApi: CardanoApiWallet) {
    try {
      const balanceCBORHex = await enabledApi.getBalance();
      const balance = Number(
        Value.from_bytes(Buffer.from(balanceCBORHex, 'hex') as any)
          .coin()
          .to_str(),
      );
      this.walletState.balance = balance;
      return balance;
    } catch (err) {
      console.log(err);
    }
  }

  async getUsedAddresses(enabledApi: CardanoApiWallet) {
    try {
      const raw = await enabledApi.getUsedAddresses();
      const rawFirst = raw[0];
      const usedAddress = Address.from_bytes(
        Buffer.from(rawFirst, 'hex') as any,
      ).to_bech32();
      this.walletState.usedAddress = usedAddress;
      return usedAddress;
    } catch (err) {
      console.log(err);
    }
  }

  async getDRepRegistration() {
    try {
      const res = await getDRepRegStatus(this.dRepID);
      if (res) {
        this.dRepRegistration = {
          registered: res.registered,
          view: res.view,
          deposit: res.deposit,
          voting_power: res.voting_power,
        };
        return this.dRepRegistration;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  disconnectWallet() {
    this.resetProviderState();
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_name`);
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_stake_key`);
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_api`);
  }

  resetProviderState() {
    this.connected = false;
    this.walletName = null;
    this.isEnabled = false;
    this.isEnabling = false;
    this.isEnableLoading = null;
    this.enabledNetwork = null;
    this.walletApi = undefined;
    this.address = undefined;
    this.addressBech32 = undefined;
    this.pubDRepKey = '';
    this.dRepID = '';
    this.dRepIDBech32 = '';
    this.stakeKey = undefined;
    this.stakeKeyBech32 = undefined;
    this.stakeKeys = [];
    this.registeredStakeKeysListState = [];
    this.error = undefined;
    this.delegatedDRepID = undefined;
    this.walletState = {
      changeAddress: undefined,
      usedAddress: undefined,
      balance: undefined,
    };
    this.dRepRegistration = null;
  }

  async enable(walletName: string) {
    this.isEnableLoading = walletName;
    this.isEnabling = true;
    try {
      if (this.isEnabled || !walletName) {
        throw new Error('Wallet already enabled or invalid wallet name');
      }

      // Check that this wallet supports CIP-95 connection
      if (!window.cardano[walletName].supportedExtensions) {
        throw new Error('walletNoCIP30Nor90Support');
      } else if (
        !window.cardano[walletName].supportedExtensions.some(
          (item) => item.cip === 95,
        )
      ) {
        throw new Error('walletNoCIP95Support');
      }

      // Enable wallet connection
      const enabledApi = await window.cardano[walletName]
        .enable({
          extensions: [{ cip: 95 }],
        })
        .catch((e) => {
          throw e.info;
        });

      // Get the network ID of the connected wallet
      const network = await enabledApi.getNetworkId();
      const requiredNetwork = CONFIGURED_NETWORK_ID;

      console.log('network', network);
      console.log('requiredNetwork', requiredNetwork);

      if (requiredNetwork !== network) {
        if (requiredNetwork == 1) {
          throw new Error(
            'Mainnet network wallet required, please switch to the mainnet',
          );
        } else {
          throw new Error(
            'Testnet network wallet required, please switch to the testnet',
          );
        }
      }

      this.enabledNetwork = network;
      console.log('Fetching change address...');
      await this.getChangeAddress(enabledApi);
      console.log('Fetching used addresses...');
      await this.getUsedAddresses(enabledApi);
      this.isEnabled = true;
      this.walletApi = enabledApi;
      // Check if wallet has enabled the CIP-95 extension
      console.log('Checking extensions...');
      const enabledExtensions = await enabledApi.getExtensions();
      if (!enabledExtensions.some((item) => item.cip === 95)) {
        throw new Error('Wallet does not support CIP-95 extensions');
      }

      //Check and set wallet balance
      console.log('Checking balance...');
      await this.getBalance(enabledApi);
      // Check and set wallet address
      console.log('Checking used/unused addresses...');
      const usedAddresses = await enabledApi.getUsedAddresses();
      const unusedAddresses = await enabledApi.getUnusedAddresses();
      if (!usedAddresses.length && !unusedAddresses.length) {
        throw new Error('No addresses found in the wallet');
      }
      if (!usedAddresses.length) {
        this.address = unusedAddresses[0];
        console.log('Using unused address:', this.address);
      } else {
        this.address = usedAddresses[0];
        console.log('Using used address:', this.address);
      }
      this.addressBech32 = Address.from_hex(this.address).to_bech32();

      console.log('Fetching stake keys (cip95)...');
      let registeredStakeKeysList: string[] = [];
      let unregisteredStakeKeysList: string[] = [];
      
      if (enabledApi.cip95) {
        registeredStakeKeysList = await enabledApi.cip95.getRegisteredPubStakeKeys() || [];
        this.registeredStakeKeysListState = registeredStakeKeysList;
        unregisteredStakeKeysList = await enabledApi.cip95.getUnregisteredPubStakeKeys() || [];
      } else {
        console.warn('CIP-95 API not found on enabled wallet, even though it was expected.');
      }

      let stakeKeysList: string[] = [];
      if (registeredStakeKeysList.length > 0) {
        stakeKeysList = registeredStakeKeysList.map((stakeKey) => {
          const stakeKeyHash = PublicKey.from_hex(stakeKey).hash();
          const stakeCredential = Credential.from_keyhash(stakeKeyHash);
          if (network === 1)
            return RewardAddress.new(1, stakeCredential).to_address().to_hex();
          else
            return RewardAddress.new(0, stakeCredential).to_address().to_hex();
        });
      } else if (unregisteredStakeKeysList.length > 0) {
        console.warn('warnings.usingUnregisteredStakeKeys');
        stakeKeysList = unregisteredStakeKeysList.map((stakeKey) => {
          const stakeKeyHash = PublicKey.from_hex(stakeKey).hash();
          const stakeCredential = Credential.from_keyhash(stakeKeyHash);
          if (network === 1)
            return RewardAddress.new(1, stakeCredential).to_address().to_hex();
          else
            return RewardAddress.new(0, stakeCredential).to_address().to_hex();
        });
      }
      
      this.stakeKeys = stakeKeysList;

      let stakeKeySet = false;
      const savedStakeKey = getItemFromLocalStorage(
        `${WALLET_LS_KEY}_stake_key`,
      );
      if (savedStakeKey && stakeKeysList.includes(savedStakeKey)) {
        this.stakeKey = savedStakeKey;
        const stakeAddress = Address.from_bytes(
          Buffer.from(savedStakeKey, 'hex') as any,
        ).to_bech32();
        this.stakeKeyBech32 = stakeAddress;
        stakeKeySet = true;
      } else if (stakeKeysList.length === 1) {
        this.stakeKey = stakeKeysList[0];
        const stakeAddress = Address.from_bytes(
          Buffer.from(stakeKeysList[0], 'hex') as any,
        ).to_bech32();
        this.stakeKeyBech32 = stakeAddress;
        setItemToLocalStorage(`${WALLET_LS_KEY}_stake_key`, stakeKeysList[0]);
        stakeKeySet = true;
      }
      console.log('Fetching PubDRepID...');
      const dRepIDs = await getPubDRepID(enabledApi);
      this.pubDRepKey = dRepIDs?.dRepKey || '';
      this.dRepID = dRepIDs?.dRepID || '';
      this.dRepIDBech32 = dRepIDs?.dRepIDBech32 || '';

      console.log('Setting epoch params...');
      await setEpochParams();
      console.log('Fetching DRep registration status...');
      await this.getDRepRegistration();

      setItemToLocalStorage(`${WALLET_LS_KEY}_name`, walletName);
      setItemToLocalStorage(`${WALLET_LS_KEY}_api`, enabledApi);
      this.isEnabling = false;
      this.isEnableLoading = null;
      this.isEnabled = true;
      console.log('Wallet enable successful');
      return { status: 'ok', stakeKey: stakeKeySet };
    } catch (e) {
      console.error('Error during enable wallet:', e);
      this.resetProviderState();
      // Try to extract a meaningful error message
      let errorMsg = 'Error enabling wallet';
      if (typeof e === 'string') {
        errorMsg = e;
      } else if (e instanceof Error) {
        errorMsg = e.message;
      } else if (e && typeof e === 'object') {
        errorMsg = e.info?.error || e.message || JSON.stringify(e);
      }
      throw new Error(errorMsg);
    }
  }
}
