import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Address,
  PublicKey,
  RewardAddress,
  TransactionUnspentOutput,
  Value,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  LinearFee,
  BigNum,
  Certificate,
  Ed25519KeyHash,
  DRepUpdate,
  Credential,
  DRep,
  StakeRegistration,
  ScriptHash,
  VoteDelegation,
  DRepDeregistration,
  VotingProcedure,
  VotingBuilder,
  Voter,
  GovernanceActionId,
  TransactionHash,
} from '@emurgo/cardano-serialization-lib-asmjs';
import { Buffer } from 'buffer';

import {
  getPubDRepID,
  WALLET_LS_KEY,
  getItemFromLocalStorage,
  setItemToLocalStorage,
  removeItemFromLocalStorage,
  dRepPhraseProcessor,
  fromBech32ToHex,
} from '@/lib';
import { CardanoApiWallet, Protocol } from '@/models/wallet';
import { useSharedContext } from './sharedContext';
import getEpochParams from '@/services/requests/getEpochParams';
import { generateAnchor } from '@/lib/generateAnchor';
import { CONFIGURED_NETWORK_ID } from '@/constants';
import getFirstEpoch from '@/services/requests/getFIrstEpoch';
import { useGlobalNotifications } from './globalNotificationContext';
import { AutomatedVotingOptionDelegationId } from '@/models/enums';
import CardanoTxModal from '@/components/atoms/TxnModal';
import { TxnTypes, useTransactionHandler } from '@/hooks/useTransactionHandler';
import { checkTxExists } from '@/services/requests/checkTxExists';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';

interface Props {
  children: React.ReactNode;
}

interface EnableResponse {
  status: string;
  stakeKey?: boolean;
  error?: string;
}
export interface CardanoContext {
  address?: string;
  latestEpoch?: number;
  firstEpoch?: number;
  balance?: string;
  disconnectWallet: () => Promise<void>;
  enable: (walletName: string) => Promise<EnableResponse>;
  isEnableLoading: string | null;
  isEnabling: boolean;
  error?: string;
  isEnabled: boolean;
  enabledNetwork: number | null;
  pubDRepKey: string;
  dRepID: string;
  walletState: {
    usedAddress: string | undefined;
    changeAddress: undefined | string;
    balance: number | undefined;
  };
  registeredStakeKeysListState: string[];
  loginCredentials: {
    signature: string | undefined;
    vkey: string | undefined;
  };
  dRepIDBech32: string;
  isGettingSignatures: boolean;
  stakeKey?: string | undefined;
  stakeKeyBech32?: string | undefined;
  setStakeKey: (key: string) => void;
  loginSignTransaction: (drepToVerify?: string) => Promise<any>;
  pollTransaction: (txHash: string) => Promise<boolean>;
  loginHardwareWalletTransaction: (options?: {
    disableSigning?: boolean;
    disableDownload?: boolean;
    autoLogin?: boolean;
  }) => Promise<any>;
  signMessage: (
    message: string,
    signingKey?: string,
    disableDownloadOption?: boolean,
    disableSignatureOption?: boolean,
  ) => Promise<any>;
  buildStakeKeyRegCert: () => Promise<Certificate>;
  buildVoteDelegationCert: (target: string) => Promise<Certificate>;
  buildDRepRetirementCert: (voterDeposit: string) => Promise<Certificate>;
  buildDRepUpdateCert: (
    cip95MetadataURL?: string,
    cip95MetadataHash?: string,
    drepToUpdate?: string,
  ) => Promise<Certificate>;
  buildVote: (
    voteChoice: string,
    txHash: string,
    index: number,
    voterId: string,
    cip95MetadataURL?: string,
    cip95MetadataHash?: string,
  ) => Promise<VotingBuilder>;
  signAndSubmitTransaction: (
    type: TxnTypes,
    certBuilder?: any,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
    },
  ) => Promise<any>;
  stakeKeys: string[];
  walletApi?: CardanoApiWallet;
  setWalletApi: (api: CardanoApiWallet) => void;
  delegatedDRepID?: string;
  setDelegatedDRepID: (key: string) => void;
  setEpochParams: () => Promise<any>;
  dRepRegistration: {
    registered: boolean;
    view: string;
    deposit: string | null;
    voting_power: string;
  };
}

export type Utxos = {
  txid: any;
  txindx: number;
  amount: string;
  str: string;
  multiAssetStr: string;
  TransactionUnspentOutput: TransactionUnspentOutput;
}[];

const CardanoContext = createContext<CardanoContext>({} as CardanoContext);
CardanoContext.displayName = 'CardanoContext';

function CardanoProvider(props: Props) {
  const { sharedState, updateSharedState } = useSharedContext();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEnableLoading, setIsEnableLoading] = useState<string | null>(null);
  const [enabledNetwork, setEnabledNetwork] = useState<number | null>(null);
  const [walletApi, setWalletApi] = useState<CardanoApiWallet | undefined>(
    undefined,
  );
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [pubDRepKey, setPubDRepKey] = useState<string>('');
  const [dRepID, setDRepID] = useState<string>('');
  const [dRepIDBech32, setDRepIDBech32] = useState<string>('');
  const [stakeKey, setStakeKey] = useState<string | undefined>(null);
  const [stakeKeyBech32, setStakeKeyBech32] = useState<string | undefined>(
    null,
  );
  const [stakeKeys, setStakeKeys] = useState<string[]>([]);
  const [isGettingSignatures, setIsGettingSignatures] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{
    signature: string;
    vkey: string;
  } | null>(null);

  const [latestEpoch, setLatestEpoch] = useState<number>(0);
  const [firstEpoch, setFirstEpoch] = useState<number>(0);
  const [registeredStakeKeysListState, setRegisteredPubStakeKeysState] =
    useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [delegatedDRepID, setDelegatedDRepID] = useState<string | undefined>(
    undefined,
  );
  const [walletState, setWalletState] = useState<{
    changeAddress: undefined | string;
    usedAddress: undefined | string;
    balance: number | undefined;
  }>({
    changeAddress: undefined,
    usedAddress: undefined,
    balance: undefined,
  });
  const [dRepRegistration, setDRepRegistration] = useState(null);
  const { addErrorAlert } = useGlobalNotifications();
  const {
    txnModalState,
    userActionState,
    isLoading,
    handleTransaction,
    handleWalletSign,
    handleDownloadUnsigned,
    handleSubmitSignedTxFile,
    closeTxnModal,
  } = useTransactionHandler({ walletState });

  useEffect(() => {
    const getLatestEpoch = async () => {
      const [protocolResult, firstEpochResult] = await Promise.allSettled([
        getEpochParams(),
        getFirstEpoch(),
      ]);

      if (protocolResult.status === 'fulfilled') {
        setLatestEpoch(protocolResult.value.epoch);
      } else {
        console.error('Failed to fetch epoch params:', protocolResult.reason);
      }

      if (firstEpochResult.status === 'fulfilled') {
        setFirstEpoch(firstEpochResult.value.no);
      } else {
        console.error('Failed to fetch first epoch:', firstEpochResult.reason);
      }
    };
    getLatestEpoch();
  }, []);

  useEffect(() => {
    const getDRepRegistration = async () => {
      if (!dRepID) return;
      const res = await getDRepRegStatus(dRepID);
      if (res) setDRepRegistration(res);
    };
    getDRepRegistration();
  }, [dRepID]);

  useEffect(() => {
    if (sharedState?.loginCredentials?.signature) {
      setLoginCredentials({
        signature: sharedState?.loginCredentials?.signature,
        vkey: sharedState?.loginCredentials?.key,
      });
    }
  }, [sharedState?.loginCredentials?.signature]);

  const getChangeAddress = async (enabledApi: CardanoApiWallet) => {
    try {
      const raw = await enabledApi.getChangeAddress();
      const changeAddress = Address.from_bytes(
        Buffer.from(raw, 'hex') as any,
      ).to_bech32();
      setWalletState((prev) => ({ ...prev, changeAddress }));
    } catch (err) {
      console.log(err);
    }
  };

  const getBalance = async (enabledApi: CardanoApiWallet) => {
    try {
      const balanceCBORHex = await enabledApi.getBalance();
      const balance = Number(
        Value.from_bytes(Buffer.from(balanceCBORHex, 'hex') as any)
          .coin()
          .to_str(),
      );
      setWalletState((prev) => ({ ...prev, balance }));
    } catch (err) {
      console.log(err);
    }
  };

  const getUsedAddresses = async (enabledApi: CardanoApiWallet) => {
    try {
      const raw = await enabledApi.getUsedAddresses();
      const rawFirst = raw[0];
      const usedAddress = Address.from_bytes(
        Buffer.from(rawFirst, 'hex') as any,
      ).to_bech32();
      setWalletState((prev) => ({ ...prev, usedAddress }));
    } catch (err) {
      console.log(err);
    }
  };

  const setEpochParams = async () => {
    try {
      const protocol = await getEpochParams();
      setItemToLocalStorage('protocolParams', protocol);
      return protocol;
    } catch (err) {
      console.log(err);
    }
  };

  const enable = useCallback(
    async (walletName: string) => {
      setIsEnableLoading(walletName);
      setIsEnabling(true);
      try {
        if (isEnabled || !walletName) {
          throw {
            status: 'ERROR',
            error: 'Wallet already enabled or invalid wallet name',
          };
        }

        // Check that this wallet supports CIP-95 connection
        if (!window.cardano[walletName].supportedExtensions) {
          throw {
            status: 'ERROR',
            error: 'errors.walletNoCIP30Nor90Support',
          };
        } else if (
          !window.cardano[walletName].supportedExtensions.some(
            (item) => item.cip === 95,
          )
        ) {
          throw {
            status: 'ERROR',
            error: 'errors.walletNoCIP95Support',
          };
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

        if (requiredNetwork !== network) {
          if (requiredNetwork == 1) {
            addErrorAlert(
              'Mainnet network wallet required, please switch to the mainnet',
            );
          } else {
            addErrorAlert(
              'Testnet network wallet required, please switch to the testnet',
            );
          }
          setStakeKey(undefined);
          setStakeKeyBech32(undefined);
          setIsEnableLoading(null);
          setIsEnabling(false);
          return { status: 'WRONG_NETWORK' };
        }
        setEnabledNetwork(network);

        await getChangeAddress(enabledApi);
        await getUsedAddresses(enabledApi);
        setIsEnabled(true);
        setWalletApi(enabledApi);
        // Check if wallet has enabled the CIP-95 extension
        const enabledExtensions = await enabledApi.getExtensions();
        if (!enabledExtensions.some((item) => item.cip === 95)) {
          throw {
            status: 'ERROR',
            error: 'errors.walletNoCIP95Support',
          };
        }

        //Check and set wallet balance
        await getBalance(enabledApi);
        // Check and set wallet address
        const usedAddresses = await enabledApi.getUsedAddresses();
        const unusedAddresses = await enabledApi.getUnusedAddresses();
        if (!usedAddresses.length && !unusedAddresses.length) {
          throw {
            status: 'ERROR',
            error: 'errors.noAddressesFound',
          };
        }
        if (!usedAddresses.length) {
          setAddress(unusedAddresses[0]);
        } else {
          setAddress(usedAddresses[0]);
        }

        const registeredStakeKeysList =
          await enabledApi.cip95.getRegisteredPubStakeKeys();
        setRegisteredPubStakeKeysState(registeredStakeKeysList);

        const unregisteredStakeKeysList =
          await enabledApi.cip95.getUnregisteredPubStakeKeys();

        let stakeKeysList;
        if (registeredStakeKeysList.length > 0) {
          stakeKeysList = registeredStakeKeysList.map((stakeKey) => {
            const stakeKeyHash = PublicKey.from_hex(stakeKey).hash();
            const stakeCredential = Credential.from_keyhash(stakeKeyHash);
            if (network === 1)
              return RewardAddress.new(1, stakeCredential)
                .to_address()
                .to_hex();
            else
              return RewardAddress.new(0, stakeCredential)
                .to_address()
                .to_hex();
          });
        } else {
          console.warn('warnings.usingUnregisteredStakeKeys');
          stakeKeysList = unregisteredStakeKeysList.map((stakeKey) => {
            const stakeKeyHash = PublicKey.from_hex(stakeKey).hash();
            const stakeCredential = Credential.from_keyhash(stakeKeyHash);
            if (network === 1)
              return RewardAddress.new(1, stakeCredential)
                .to_address()
                .to_hex();
            else
              return RewardAddress.new(0, stakeCredential)
                .to_address()
                .to_hex();
          });
        }

        setStakeKeys(stakeKeysList);

        let stakeKeySet = false;
        const savedStakeKey = getItemFromLocalStorage(
          `${WALLET_LS_KEY}_stake_key`,
        );
        if (savedStakeKey && stakeKeysList.includes(savedStakeKey)) {
          setStakeKey(savedStakeKey);
          const stakeAddress = Address.from_bytes(
            Buffer.from(savedStakeKey, 'hex') as any,
          ).to_bech32();
          setStakeKeyBech32(stakeAddress);
          stakeKeySet = true;
        } else if (stakeKeysList.length === 1) {
          setStakeKey(stakeKeysList[0]);
          const stakeAddress = Address.from_bytes(
            Buffer.from(stakeKeysList[0], 'hex') as any,
          ).to_bech32();
          setStakeKeyBech32(stakeAddress);
          setItemToLocalStorage(`${WALLET_LS_KEY}_stake_key`, stakeKeysList[0]);
          stakeKeySet = true;
        }
        const dRepIDs = await getPubDRepID(enabledApi);
        setPubDRepKey(dRepIDs?.dRepKey || '');
        setDRepID(dRepIDs?.dRepID || '');
        setDRepIDBech32(dRepIDs?.dRepIDBech32 || '');
        await setEpochParams();
        setItemToLocalStorage(`${WALLET_LS_KEY}_name`, walletName);
        setItemToLocalStorage(`${WALLET_LS_KEY}_api`, enabledApi);
        setIsEnabling(false);
        updateSharedState({
          isWalletListModalOpen: false,
          dRepIDBech32: dRepIDs?.dRepIDBech32 || '',
          stakeKey: Address.from_bytes(
            Buffer.from(stakeKeysList[0], 'hex') as any,
          ).to_bech32(),
        });

        return { status: 'ok', stakeKey: stakeKeySet };
      } catch (e) {
        console.error(e);
        setError(e);
        setAddress(undefined);
        setWalletApi(undefined);
        setPubDRepKey('');
        setStakeKey(undefined);
        setStakeKeyBech32(undefined);
        setIsEnabled(false);
        setIsEnabling(false);
        addErrorAlert(`Error enabling wallet: ${e}`);
        throw {
          status: 'ERROR',
          error: `${e == undefined ? 'Something went wrong' : e}`,
        };
      } finally {
        setIsEnableLoading(null);
        setIsEnabling(false);
      }
    },
    [isEnabled, stakeKeys],
  );

  const loginSignTransaction = async (drepToVerify?: string) => {
    if (!walletApi) return;
    setIsGettingSignatures(true);
    try {
      const dRepToBeSigned = drepToVerify || dRepIDBech32;
      const payloadBuffer = Buffer.from(
        `Verify DRep ${dRepToBeSigned}`,
      ).toString('hex');
      const sign = await walletApi.signData(dRepID, payloadBuffer);
      const { signature, key } = sign;
      setLoginCredentials({ signature, vkey: key });
      setIsGettingSignatures(false);
      return { signature, key };
    } catch (e) {
      console.error(e);
      setIsGettingSignatures(false);
      throw e;
    }
  };

  const signMessage = async (
    message: string,
    signingKey?: string,
    disableDownloadOption: boolean = false,
    disableSignatureOption: boolean = false,
  ) => {
    // if (!walletApi) return;
    try {
      const res = handleTransaction(
        walletApi,
        'loginViaMessageSigning',
        {
          signingKey: signingKey ? signingKey : stakeKey,
          txBuilder: await initTransactionBuilder(),
        },
        {
          objectToSign: 'message',
          message,
          disableDownload: disableDownloadOption,
          disableSigning: disableSignatureOption,
        },
      );
      return res;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const initTransactionBuilder = async () => {
    let protocolParams = getItemFromLocalStorage('protocolParams') as Protocol;

    if (!protocolParams) {
      protocolParams = await setEpochParams();
    }

    const txBuilder = TransactionBuilder.new(
      TransactionBuilderConfigBuilder.new()
        .fee_algo(
          LinearFee.new(
            BigNum.from_str(String(protocolParams.min_fee_a)),
            BigNum.from_str(String(protocolParams.min_fee_b)),
          ),
        )
        .pool_deposit(BigNum.from_str(protocolParams.pool_deposit))
        .key_deposit(BigNum.from_str(protocolParams.key_deposit))
        .coins_per_utxo_byte(
          BigNum.from_str(String(protocolParams.coins_per_utxo_size)),
        )
        .max_value_size(protocolParams.max_val_size)
        .max_tx_size(protocolParams.max_tx_size)
        .prefer_pure_change(true)
        .build(),
    );

    return txBuilder;
  };

  const loginHardwareWalletTransaction = async (
    options: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      autoLogin?: boolean;
    } = { autoLogin: true },
  ) => {
    if (!walletApi) throw new Error('Wallet not connected');
    setIsGettingSignatures(true);

    try {
      const txBuilder = await initTransactionBuilder();
      const result = await handleTransaction(
        walletApi,
        'loginViaExpiredTxnSigning',
        { txBuilder },
        options,
      );

      if (options?.autoLogin && result?.signature && result?.vkey) {
        setLoginCredentials({ signature: result.signature, vkey: result.vkey });
      }

      setIsGettingSignatures(false);
      return result;
    } catch (error) {
      console.error('Hardware wallet transaction error:', error);
      setIsGettingSignatures(false);
      throw error;
    }
  };

  const buildCredentialFromBech32Key = useCallback(async (key: string) => {
    try {
      const keyHash = Ed25519KeyHash.from_hex(key);
      return Credential.from_keyhash(keyHash);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const buildVote = useCallback(
    async (
      voteChoice: string,
      txHash: string,
      index: number,
      voterId: string, //in bech32
      cip95MetadataURL?: string,
      cip95MetadataHash?: string,
    ): Promise<VotingBuilder> => {
      try {
        // Get wallet's DRep credential
        const dRepId = fromBech32ToHex(voterId);
        const dRepCredential = await buildCredentialFromBech32Key(dRepId);
        // Vote credential
        const voter = Voter.new_drep_credential(dRepCredential);
        const govActionId = GovernanceActionId.new(
          // placeholder
          TransactionHash.from_hex(txHash),
          index,
        );

        let votingChoice;
        voteChoice = voteChoice.toLowerCase();
        if (voteChoice === 'yes') {
          votingChoice = 1;
        } else if (voteChoice === 'no') {
          votingChoice = 0;
        } else {
          votingChoice = 2;
        }

        let votingProcedure;
        if (cip95MetadataURL && cip95MetadataHash) {
          const anchor = generateAnchor(cip95MetadataURL, cip95MetadataHash);
          // Create cert object using one Ada as the deposit
          votingProcedure = VotingProcedure.new_with_anchor(
            votingChoice,
            anchor,
          );
        } else {
          votingProcedure = VotingProcedure.new(votingChoice);
        }

        const votingBuilder = VotingBuilder.new();
        votingBuilder.add(voter, govActionId, votingProcedure);

        return votingBuilder;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [],
  );

  const buildStakeKeyRegCert = useCallback(async (): Promise<Certificate> => {
    try {
      if (!stakeKey) {
        throw new Error('No stake key selected');
      }
      const stakeKeyHash = Ed25519KeyHash.from_hex(stakeKey.substring(2));
      const epochParams = await getEpochParams();
      const stakeCred = Credential.from_keyhash(stakeKeyHash);
      const stakeKeyRegCert = StakeRegistration.new_with_explicit_deposit(
        stakeCred,
        BigNum.from_str(`${epochParams.key_deposit}`),
      );
      return Certificate.new_stake_registration(stakeKeyRegCert);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [stakeKey]);

  const buildVoteDelegationCert = useCallback(
    async (target: string): Promise<Certificate> => {
      try {
        // Build Vote Delegation Certificate
        if (!stakeKey) {
          throw new Error('No stake key selected');
        }
        // Remove network tag from stake key hash
        const stakeKeyHash = Ed25519KeyHash.from_hex(stakeKey.substring(2));
        const stakeCred = Credential.from_keyhash(stakeKeyHash);

        // Create correct DRep
        let targetDRep;
        if (target === AutomatedVotingOptionDelegationId.abstain) {
          targetDRep = DRep.new_always_abstain();
        } else if (target === AutomatedVotingOptionDelegationId.no_confidence) {
          targetDRep = DRep.new_always_no_confidence();
        } else if (target.includes('drep1')) {
          targetDRep = DRep.new_key_hash(Ed25519KeyHash.from_bech32(target));
        } else if (target.includes('drep_script1')) {
          targetDRep = DRep.new_script_hash(ScriptHash.from_hex(target));
        } else {
          targetDRep = DRep.new_key_hash(Ed25519KeyHash.from_hex(target));
        }
        // Create cert object
        const voteDelegationCert = VoteDelegation.new(stakeCred, targetDRep);
        // add cert to tbuilder
        return Certificate.new_vote_delegation(voteDelegationCert);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [stakeKey],
  );

  const buildDRepRetirementCert = useCallback(
    async (voterDeposit: string): Promise<Certificate> => {
      try {
        // Get wallet's DRep key
        const dRepKeyHash = Ed25519KeyHash.from_hex(dRepID);
        const dRepCred = Credential.from_keyhash(dRepKeyHash);

        const dRepRetirementCert = DRepDeregistration.new(
          dRepCred,
          BigNum.from_str(voterDeposit),
        );

        return Certificate.new_drep_deregistration(dRepRetirementCert);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [dRepID],
  );

  const signAndSubmitTransaction = async (
    type: TxnTypes,
    certBuilder?: Certificate | VotingBuilder,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
    },
  ) => {
    if (!walletApi) throw new Error('Wallet not connected');
    try {
      const txBuilder = await initTransactionBuilder();
      const result = await handleTransaction(
        walletApi,
        type,
        { txBuilder, certBuilder },
        options,
      );
      return result;
    } catch (error) {
      console.error('Transaction creation/submission error:', error);
      throw error;
    }
  };

  const pollTransaction = async (txHash: string) => {
    const maxAttempts = 30; // 5 minutes total
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const isTxAvailable = await checkTxExists(txHash);
        if (isTxAvailable) {
          return true;
        }
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
    return false;
  };

  const buildDRepUpdateCert = useCallback(
    async (
      cip95MetadataURL?: string,
      cip95MetadataHash?: string,
      drepToUpdate?: string,
    ): Promise<Certificate> => {
      try {
        const dRepKeyHash = Ed25519KeyHash.from_hex(
          drepToUpdate ? dRepPhraseProcessor(drepToUpdate) : dRepID,
        );
        const dRepCred = Credential.from_keyhash(dRepKeyHash);

        let dRepUpdateCert;
        // If there is an anchor
        if (cip95MetadataURL && cip95MetadataHash) {
          const anchor = generateAnchor(cip95MetadataURL, cip95MetadataHash);
          // Create cert object using one Ada as the deposit
          dRepUpdateCert = DRepUpdate.new_with_anchor(dRepCred, anchor);
        } else {
          dRepUpdateCert = DRepUpdate.new(dRepCred);
        }
        return Certificate.new_drep_update(dRepUpdateCert);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [dRepID],
  );
  const disconnectWallet = useCallback(async () => {
    console.log('Disconnecting wallet');
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_name`);
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_stake_key`);
    removeItemFromLocalStorage(`${WALLET_LS_KEY}_api`);
    setWalletApi(undefined);
    setAddress(undefined);
    setStakeKey(undefined);
    setStakeKeyBech32(undefined);
    setDelegatedDRepID(undefined);
    setPubDRepKey(undefined);
    setDRepID(undefined);
    setDRepIDBech32(undefined);
    setIsEnabled(false);
    setIsEnabling(false);
    setIsEnableLoading(null);
    updateSharedState({
      drepId: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      address,
      walletState,
      enable,
      isEnabled,
      enabledNetwork,
      disconnectWallet,
      loginSignTransaction,
      loginHardwareWalletTransaction,
      buildDRepUpdateCert,
      signAndSubmitTransaction,
      loginCredentials,
      dRepID,
      dRepIDBech32,
      pubDRepKey,
      stakeKey,
      stakeKeyBech32,
      isGettingSignatures,
      latestEpoch,
      firstEpoch,
      setStakeKey,
      stakeKeys,
      walletApi,
      registeredStakeKeysListState,
      pollTransaction,
      error,
      delegatedDRepID,
      setDelegatedDRepID,
      isEnableLoading,
      isEnabling,
      sharedState,
      buildVoteDelegationCert,
      buildStakeKeyRegCert,
      buildDRepRetirementCert,
      buildVote,
      signMessage,
      dRepRegistration,
      setWalletApi,
      setEpochParams,
    }),
    [
      address,
      enable,
      isEnabling,
      enabledNetwork,
      walletState,
      isEnabled,
      disconnectWallet,
      dRepID,
      dRepIDBech32,
      latestEpoch,
      firstEpoch,
      pubDRepKey,
      isGettingSignatures,
      stakeKey,
      stakeKeyBech32,
      setStakeKey,
      stakeKeys,
      walletApi,
      error,
      delegatedDRepID,
      setDelegatedDRepID,
      sharedState,
      isEnableLoading,
      registeredStakeKeysListState,
      buildVote,
      dRepRegistration,
      setEpochParams,
    ],
  );

  return (
    <CardanoContext.Provider value={value}>
      {props.children}
      <CardanoTxModal
        open={txnModalState.isOpen}
        isPrepping={txnModalState.isPrepping}
        onClose={closeTxnModal}
        onWalletSign={() => handleWalletSign(walletApi)}
        onDownloadUnsigned={handleDownloadUnsigned}
        onSubmitSignedTx={(signedTxHash: File) =>
          handleSubmitSignedTxFile(signedTxHash, walletApi)
        }
        fileToDownload={txnModalState.fileToDownload}
        currentNetwork={enabledNetwork}
        error={txnModalState.error}
        disableDownload={userActionState.disableDownload}
        disableSigning={userActionState.disableSigning}
        txHash={txnModalState.txHash}
        txType={txnModalState.type}
        isLoading={isLoading}
      />
    </CardanoContext.Provider>
  );
}

function useCardano() {
  const context = useContext(CardanoContext);

  if (context === undefined) {
    throw new Error('errors.useCardano');
  }

  return context;
}

export { CardanoProvider, useCardano };
