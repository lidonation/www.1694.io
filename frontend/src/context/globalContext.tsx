import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './authContext';
import { AuthMethod } from '../../types/auth';
import {
  BigNum,
  Certificate,
  Credential,
  DRep,
  DRepDeregistration,
  DRepUpdate,
  Ed25519KeyHash,
  GovernanceActionId,
  LinearFee,
  ScriptHash,
  StakeRegistration,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionHash,
  VoteDelegation,
  Voter,
  VotingBuilder,
  VotingProcedure,
} from '@emurgo/cardano-serialization-lib-asmjs';
import {
  TxnTypes,
  useTransactionHandler,
  TxnModalState,
  TransactionHandler,
  RequiredSigningKey,
} from '@/hooks/useTransactionHandler';
import { CardanoApiWallet, Protocol } from '@/models/wallet';
import {
  compareDRepIDs,
  DREP_ID_CLAIM_LS_KEY,
  dRepPhraseProcessor,
  fromBech32ToHex,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setEpochParams,
  setItemToLocalStorage,
} from '@/lib';
import { AutomatedVotingOptionDelegationId } from '@/models/enums';
import { generateAnchor } from '@/lib/generateAnchor';
import getEpochParams from '@/services/requests/getEpochParams';
import getFirstEpoch from '@/services/requests/getFIrstEpoch';
import { getItemFromIndexedDB } from '@/lib/indexedDb';
import { ProfileWorkflowStepKey } from '@/lib/enums';
import { ChooseWalletModal } from '@/components/organisms';
import { UserLoginModal } from '@/components/organisms/UserLoginModal';
import {
  ActionModal,
  ActionModalProps,
} from '@/components/organisms/ActionModal';
import GovToolUserNameModal from '@/components/organisms/GovtoolUserNameModal';
import CardanoTxModal from '@/components/atoms/TxnModal';
import { CONFIGURED_NETWORK_ID } from '@/constants';
import { getDRepRegStatus } from '@/services/requests/getDRepRegStatus';
import { getDRepMetadata } from '@/services/requests/getDRepMetadata';
import { blake2bHex } from 'blakejs';
import { usePathname } from 'next/navigation';
import { useGetVoterClaimedProfilesQuery } from '@/hooks/useGetVoterClaimedProfilesQuery';
import { ClaimedProfile, SingleDRep } from '../../types/api';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';

export type StepStatus = 'success' | 'active' | 'pending' | 'update';

type ClaimOption = 'yes' | 'no';

interface WalletState {
  address: string | null;
  addressBech32: string | null;
  stakeKey: string | null;
  stakeKeyBech32: string | null;
  registeredStakeKeysListState: string[] | null;
  isConnected: boolean;
  balance: string | null;
  isDRep: boolean;
  dRepId: string | null;
  dRepKeyHash: Ed25519KeyHash | null;
  dRepIdBech32: string | null;
  dRepDelegatedTo?: string | null;
  dRepDelegatedToVotingPower?: string | null;
  walletBeingConnected?: string | null;
  isConnecting: boolean;
  error: string | null;
}

interface UserInfo {
  signatureData: Partial<{
    currentSignatureId: string;
  }>; //TODO: define the type
  dRepProfilesClaimed: ClaimedProfile[] | null;
  drepMetadata: {
    jsonLd: any; //TODO: define the type
    jsonLdHash: string;
  }; //TODO: define the type
  dRepClaimInfo: Partial<{
    dRepIDToClaimBech32: string;
    dRepEntityToClaim: SingleDRep | null;
    isCurrentlyClaiming: ClaimOption;
    isCurrentOwnerOfDRepToClaim: boolean;
    isDRepTobeClaimedRegistered: boolean;
    isFetchingMetadataForClaim: boolean;
    dRepToBeClaimedJsonLd: any;
    dRepToBeClaimedJsonLdHash: string;
  }>;
  dRepClaimProgress: Partial<{
    [ProfileWorkflowStepKey.PROFILE]: StepStatus;
    [ProfileWorkflowStepKey.REVIEW]: StepStatus;
    [ProfileWorkflowStepKey.SIGNATURES]: StepStatus;
    [ProfileWorkflowStepKey.SOCIALS]: StepStatus;
    currentRegistrationStep: number;
  }>;
}

interface WalletContextType {
  wallet: WalletState;
  user: UserInfo;
  setUserInfo: (userInfo: Partial<UserInfo>) => void;
  currentLocale: string | null;
  setCurrentLocale: (locale: string) => void;
  latestEpoch?: number;
  firstEpoch?: number;
  walletApi?: CardanoApiWallet;
  activeWallet: AuthMethod | null;
  connectWallet: (
    method: string,
    params?: any,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signMessage: (
    message: string,
    signingKey?: string,
    disableDownloadOption?: boolean,
    disableSignatureOption?: boolean,
    requiredSigningKeys?: RequiredSigningKey[],
  ) => Promise<any>;
  loginSignTransaction: (
    drepToVerify?: string,
    requiredSigningKeys?: RequiredSigningKey[],
  ) => Promise<any>;
  loginHardwareWalletTransaction: (options?: {
    disableSigning?: boolean;
    disableDownload?: boolean;
    autoLogin?: boolean;
  }) => Promise<any>;
  initTransactionBuilder: () => Promise<TransactionBuilder>;
  buildCredentialFromBech32Key: (key: string) => Promise<Credential>;
  buildVote: (
    voteChoice: string,
    txHash: string,
    index: number,
    voterId: string,
    cip95MetadataURL?: string,
    cip95MetadataHash?: string,
  ) => Promise<VotingBuilder>;
  buildStakeKeyRegCert: () => Promise<Certificate>;
  buildVoteDelegationCert: (target: string) => Promise<Certificate>;
  buildDRepRetirementCert: (voterDeposit: string) => Promise<Certificate>;
  buildDRepUpdateCert: (
    drepToUpdate: string,
    cip95MetadataURL?: string,
    cip95MetadataHash?: string,
  ) => Promise<Certificate>;
  signAndSubmitTransaction: (
    type: TxnTypes,
    certBuilder?: Certificate | VotingBuilder,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
    },
  ) => Promise<any>;
  handleRefreshUserJsonLd: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export enum ModalType {
  WALLET_LIST = 'walletList',
  LOGIN = 'login',
  USERNAME = 'username',
  DREP_ERROR = 'drepError',
  ACTION = 'action',
  TRANSACTION = 'transaction',
}

export type ModalProps = {
  [ModalType.WALLET_LIST]: {
    hideCloseButton?: boolean;
  };
  [ModalType.LOGIN]: {
    hideCloseButton?: boolean;
  };
  [ModalType.USERNAME]: {
    hideCloseButton?: boolean;
  };
  [ModalType.DREP_ERROR]: {
    //no props
  };
  [ModalType.ACTION]: ActionModalProps;
  [ModalType.TRANSACTION]: TxnModalState;
};

interface ModalContextState {
  walletListModal: {
    isOpen: boolean;
    hideCloseButton: boolean;
  };

  loginModal: {
    isOpen: boolean;
    hideCloseButton: boolean;
  };

  usernameModal: {
    isOpen: boolean;
    hideCloseButton: boolean;
  };

  drepErrorModal: {
    isOpen: boolean;
  };

  actionModal: {
    isOpen: boolean;
    props: ActionModalProps | null;
  };

  txnModal: Partial<TransactionHandler>;
}

interface ModalContextActions {
  openModal: <T extends ModalType>(type: T, props?: ModalProps[T]) => void;
  closeModal: (type: ModalType) => void;
  updateTxnModalState: (options: Partial<TransactionHandler>) => void;
  setTxnLoading: (isLoading: boolean) => void;
}

interface ModalContextType extends ModalContextState, ModalContextActions {}

const defaultModalState: ModalContextState = {
  walletListModal: {
    isOpen: false,
    hideCloseButton: false,
  },
  loginModal: {
    isOpen: false,
    hideCloseButton: false,
  },
  usernameModal: {
    isOpen: false,
    hideCloseButton: true,
  },
  drepErrorModal: {
    isOpen: false,
  },
  actionModal: {
    isOpen: false,
    props: null,
  },
  txnModal: {
    isLoading: false,
    txnModalState: {
      isOpen: false,
      pendingTx: null,
      resolve: null,
      reject: null,
      isPrepping: false,
      currentWalletApi: null,
      fileToDownload: null,
      error: null,
      txHash: null,
      type: null,
    },
    userActionState: {
      disableDownload: false,
      disableSigning: false,
    },
  },
};

type GlobalContextType = ModalContextType & WalletContextType;
interface GlobalProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo>({
    dRepClaimInfo: {
      dRepIDToClaimBech32: null,
      isCurrentlyClaiming: 'no',
      isCurrentOwnerOfDRepToClaim: false,
      isDRepTobeClaimedRegistered: false,
      dRepToBeClaimedJsonLd: null,
      isFetchingMetadataForClaim: false,
      dRepToBeClaimedJsonLdHash: null,
    },
    drepMetadata: {
      jsonLd: null,
      jsonLdHash: null,
    },
    signatureData: {
      currentSignatureId: null,
    },
    dRepProfilesClaimed: [],
    dRepClaimProgress: {
      currentRegistrationStep: 0,
      [ProfileWorkflowStepKey.PROFILE]: 'pending',
      [ProfileWorkflowStepKey.SIGNATURES]: 'pending',
      [ProfileWorkflowStepKey.SOCIALS]: 'pending',
      [ProfileWorkflowStepKey.REVIEW]: 'pending',
    },
  } as UserInfo);
  const drepIdBeingClaimedRef = useRef<string | null>(null);
  const hasInitializedUpdateDataRef = useRef(false);
  //for fns that nned quick access to the wallet state
  const walletRef = useRef<WalletState>({
    address: null,
    addressBech32: null,
    stakeKey: null,
    stakeKeyBech32: null,
    isConnected: false,
    balance: null,
    isDRep: false,
    dRepId: null,
    dRepKeyHash: null,
    dRepIdBech32: null,
    dRepDelegatedTo: null,
    dRepDelegatedToVotingPower: null,
    registeredStakeKeysListState: null,
    isConnecting: false,
    error: null,
  });
  const { claimedProfiles, isClaimedProfilesLoading } =
    useGetVoterClaimedProfilesQuery(walletRef.current?.dRepIdBech32);
  const [currentLocale, setCurrentLocale] = useState<string | null>('en');
  const [latestEpoch, setLatestEpoch] = useState<number | undefined>(undefined);
  const [firstEpoch, setFirstEpoch] = useState<number | undefined>(undefined);
  const [modalState, setModalState] =
    useState<ModalContextState>(defaultModalState);

  const {
    accountInfo,
    isAuthenticated,
    isAuthenticating,
    authError,
    logout,
    authenticate,
    activeProvider,
    walletApi,
    walletBeingConnected,
  } = useAuth();

  const updateTxnModalState = useCallback(
    (options: Partial<TransactionHandler>) => {
      setModalState((prev) => ({
        ...prev,
        txnModal: {
          ...prev.txnModal,
          ...options,
        },
      }));
    },
    [],
  );

  const { handleTransaction } = useTransactionHandler({
    walletState: {
      usedAddress: accountInfo?.addressBech32,
      changeAddress: accountInfo?.addressBech32,
      balance: Number(accountInfo?.balance),
    },
    updateTxnModalState,
  });

  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    addressBech32: null,
    stakeKey: null,
    stakeKeyBech32: null,
    isConnected: false,
    balance: null,
    isDRep: false,
    dRepId: null,
    registeredStakeKeysListState: null,
    dRepIdBech32: null,
    dRepKeyHash: null,
    dRepDelegatedTo: null,
    dRepDelegatedToVotingPower: null,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    if (isAuthenticated && !isAuthenticating && accountInfo) {
      let walletState: WalletState = {
        address: accountInfo.address,
        addressBech32: accountInfo.addressBech32,
        stakeKey: accountInfo.stakeKey || null,
        stakeKeyBech32: accountInfo.stakeKeyBech32 || null,
        isConnected: true,
        balance: accountInfo.balance || null,
        isDRep: accountInfo.dRepInfo?.isDRep || false,
        dRepId: accountInfo.dRepInfo?.dRepId || null,
        dRepIdBech32: accountInfo.dRepInfo?.dRepIdBech32 || null,
        dRepKeyHash: accountInfo.dRepInfo?.dRepKeyHash || null,
        dRepDelegatedTo: accountInfo.dRepInfo?.delegatedTo || null,
        dRepDelegatedToVotingPower: accountInfo.dRepInfo?.votingPower || null,
        isConnecting: false,
        error: null,
        registeredStakeKeysListState: accountInfo.registeredStakeKeysListState,
        walletBeingConnected: null,
      };
      walletRef.current = walletState;
      setWallet(walletState);
    } else {
      setWallet((prevWallet) => ({
        ...prevWallet,
        isConnecting: isAuthenticating,
        isConnected: isAuthenticated,
        walletBeingConnected,
      }));
    }
  }, [
    isAuthenticated,
    accountInfo,
    isAuthenticating,
    authError,
    walletBeingConnected,
  ]);

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
    //auto set the drep to be claimed from local storage
    if (hasInitializedUpdateDataRef.current) return;
    const dRepIdToClaimBech32 = getItemFromLocalStorage(
      DREP_ID_CLAIM_LS_KEY,
    ) as string;
    const isOnUpdatePage = pathname.includes(
      `/${currentLocale}/dreps/workflow/profile/update`,
    );
    if (
      dRepIdToClaimBech32 &&
      getItemFromLocalStorage('isUpdating') &&
      isOnUpdatePage &&
      walletRef.current.isConnected
    ) {
      drepIdBeingClaimedRef.current = dRepIdToClaimBech32;
      setUserInfo({
        dRepClaimInfo: {
          dRepIDToClaimBech32: dRepIdToClaimBech32,
          isCurrentlyClaiming: 'yes',
        },
      });
      hasInitializedUpdateDataRef.current = true;
    }
  }, [pathname, walletRef.current.isConnected]);

  useEffect(() => {
    if (claimedProfiles && !isClaimedProfilesLoading) {
      setUser((prevUser) => ({
        ...prevUser,
        dRepProfilesClaimed: claimedProfiles,
      }));
    }
  }, [claimedProfiles, isClaimedProfilesLoading]);

  /**
   * Connect wallet using a specific method
   * @param method Authentication method
   * @param params Optional parameters for the method
   * @returns Success status
   */
  const connectWallet = async (
    method: string,
    params?: any,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      return await authenticate(method, params);
    } catch (error) {
      console.error('Error connecting wallet:', error);
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
  };

  const handleRefreshUserJsonLd = async () => {
    const locallySavedJsonld = await getItemFromIndexedDB('metadataJsonLd');
    const locallySavedHash = await getItemFromIndexedDB('metadataJsonHash');
    if (locallySavedHash) {
      setUser((prevUser) => ({
        ...prevUser,
        drepMetadata: {
          ...prevUser.drepMetadata,
          jsonLdHash: locallySavedHash,
        },
      }));
    }
    if (locallySavedJsonld) {
      setUser((prevUser) => ({
        ...prevUser,
        drepMetadata: {
          ...prevUser.drepMetadata,
          jsonLd: locallySavedJsonld,
        },
      }));
    }
  };

  const signMessage = async (
    message: string,
    signingKey?: string,
    disableDownloadOption: boolean = false,
    disableSignatureOption: boolean = false,
    requiredSigningKeys?: RequiredSigningKey[],
  ) => {
    try {
      const res = handleTransaction(
        walletApi,
        'loginViaMessageSigning',
        {
          signingKey: signingKey ? signingKey : wallet.stakeKey,
          requiredSigningKeys,
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

  const loginSignTransaction = async (
    drepToVerify?: string,
    requiredSigningKeys?: RequiredSigningKey[],
  ) => {
    try {
      return await signMessage(
        `Verify DRep ${drepToVerify || wallet.dRepIdBech32}`,
        wallet.dRepId,
        activeProvider === AuthMethod.HOT_WALLET,
        activeProvider === AuthMethod.LOGIN_FILE,
        requiredSigningKeys,
      );
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

  const getAddressToDeriveUtxosFrom = () => {
    switch (true) {
      //claiming own drep via login file
      case user.dRepClaimInfo.isCurrentOwnerOfDRepToClaim &&
        activeProvider !== AuthMethod.HOT_WALLET:
        return wallet.addressBech32;
      //assumed to claim drep via hot wallet or login file
      case !user.dRepClaimInfo.isCurrentOwnerOfDRepToClaim &&
        activeProvider === AuthMethod.HOT_WALLET:
      case !user.dRepClaimInfo.isCurrentOwnerOfDRepToClaim &&
        activeProvider === AuthMethod.LOGIN_FILE:
        return user.dRepClaimInfo.dRepEntityToClaim?.reg_address;
      default:
        //use address from state
        return null;
    }
  };

  const loginHardwareWalletTransaction = async (
    options: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      autoLogin?: boolean;
    } = { autoLogin: true },
  ) => {
    if (!walletApi && activeProvider === AuthMethod.HOT_WALLET)
      throw new Error('Wallet not connected');

    try {
      const txBuilder = await initTransactionBuilder();
      const result = await handleTransaction(
        walletApi,
        'loginViaExpiredTxnSigning',
        { txBuilder },
        {
          ...options,
          deriveUtxosFrom: getAddressToDeriveUtxosFrom(),
        },
      );
      return result;
    } catch (error) {
      console.error('Hardware wallet transaction error:', error);
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
      if (!wallet.stakeKey) {
        throw new Error('No stake key selected');
      }
      const stakeKeyHash = Ed25519KeyHash.from_hex(
        wallet.stakeKey.substring(2),
      );
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
  }, [wallet.stakeKey]);

  const buildVoteDelegationCert = useCallback(
    async (target: string): Promise<Certificate> => {
      try {
        // Build Vote Delegation Certificate
        if (!wallet.stakeKey) {
          throw new Error('No stake key selected');
        }
        // Remove network tag from stake key hash
        const stakeKeyHash = Ed25519KeyHash.from_hex(
          wallet.stakeKey.substring(2),
        );
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
    [wallet.stakeKey],
  );

  const buildDRepRetirementCert = useCallback(
    async (voterDeposit: string): Promise<Certificate> => {
      try {
        // Get wallet's DRep key
        const dRepKeyHash = Ed25519KeyHash.from_hex(wallet.dRepId);
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
    [wallet.dRepId],
  );

  const buildDRepUpdateCert = async (
    drepToUpdate: string,
    cip95MetadataURL?: string,
    cip95MetadataHash?: string,
  ): Promise<Certificate> => {
    try {
      const dRepToUpdateKeyHash = Ed25519KeyHash.from_hex(
        dRepPhraseProcessor(drepToUpdate),
      );
      const dRepCred = Credential.from_keyhash(dRepToUpdateKeyHash);

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
  };

  const signAndSubmitTransaction = async (
    type: TxnTypes,
    certBuilder?: Certificate | VotingBuilder,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
    },
  ) => {
    if (!walletApi && activeProvider === AuthMethod.HOT_WALLET) {
      throw new Error('Wallet not connected');
    }
    try {
      const txBuilder = await initTransactionBuilder();
      const result = await handleTransaction(
        activeProvider === AuthMethod.HOT_WALLET ? walletApi : null,
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

  const disconnectWallet = async (): Promise<void> => {
    await logout();
    const nullWalletState: WalletState = {
      address: null,
      addressBech32: null,
      stakeKey: null,
      stakeKeyBech32: null,
      isConnected: false,
      balance: null,
      isDRep: false,
      dRepId: null,
      dRepKeyHash: null,
      dRepIdBech32: null,
      dRepDelegatedTo: null,
      dRepDelegatedToVotingPower: null,
      isConnecting: false,
      error: null,
      registeredStakeKeysListState: null,
    };
    setWallet(nullWalletState);
    walletRef.current = nullWalletState;
  };

  const handleFetchDRepMetadata = async (
    dRepBech32: string,
  ): Promise<{
    jsonLd: any;
    jsonLdHash: string;
  }> => {
    try {
      if (getItemFromLocalStorage('isUpdating')) {
        const metadata = await getItemFromIndexedDB('metadataJsonLd');
        const metadataHash = await getItemFromIndexedDB('metadataJsonHash');
        if (!metadata && !metadataHash) {
          const fetchedMetadata = await getDRepMetadata(dRepBech32);
          const fetchedMetadataHash = blake2bHex(
            JSON.stringify(fetchedMetadata),
            undefined,
            32,
          );
          return {
            jsonLd: fetchedMetadata,
            jsonLdHash: fetchedMetadataHash,
          };
        }
        return { jsonLd: metadata, jsonLdHash: metadataHash };
      } else {
        const metadata = await getDRepMetadata(dRepBech32);
        const metadataHash = blake2bHex(
          JSON.stringify(metadata),
          undefined,
          32,
        );
        return {
          jsonLd: metadata,
          jsonLdHash: metadataHash,
        };
      }
    } catch (error) {
      console.error('Error fetching DRep metadata:', error);
      return {
        jsonLd: null,
        jsonLdHash: null,
      };
    }
  };

  const setUserInfo = async (userInfo: Partial<UserInfo>) => {
    if (userInfo.dRepClaimInfo) {
      if (userInfo.dRepClaimInfo.isCurrentlyClaiming) {
        if (!walletRef.current.dRepIdBech32) {
          console.error(
            'Insufficient parameters, adding buffer time for wallet connection',
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        const { isCurrentlyClaiming } = userInfo.dRepClaimInfo;
        const dRepIDToClaimBech32 = drepIdBeingClaimedRef.current;
        switch (isCurrentlyClaiming) {
          case 'yes':
            setUser((prevUser) => ({
              ...prevUser,
              dRepClaimInfo: {
                ...prevUser.dRepClaimInfo,
                isFetchingMetadataForClaim: true,
              },
            }));
            const { jsonLd, jsonLdHash } =
              await handleFetchDRepMetadata(dRepIDToClaimBech32);
            const regData = await getDRepRegStatus(dRepIDToClaimBech32);
            const drepData = await getSingleDRepViaVoterId(dRepIDToClaimBech32);
            userInfo.dRepClaimInfo = {
              ...user.dRepClaimInfo,
              dRepIDToClaimBech32,
              isCurrentOwnerOfDRepToClaim: compareDRepIDs(
                dRepIDToClaimBech32,
                walletRef.current.dRepIdBech32,
              ),
              isCurrentlyClaiming,
              isDRepTobeClaimedRegistered: regData?.registered,
              dRepToBeClaimedJsonLd: jsonLd,
              dRepEntityToClaim: drepData,
              dRepToBeClaimedJsonLdHash: jsonLdHash,
              isFetchingMetadataForClaim: false,
            };
            break;
          case 'no':
            userInfo.dRepClaimInfo = {
              ...user.dRepClaimInfo,
              dRepIDToClaimBech32: null,
              isCurrentlyClaiming: 'no',
              dRepEntityToClaim: null,
              isCurrentOwnerOfDRepToClaim: false,
              isDRepTobeClaimedRegistered: false,
              dRepToBeClaimedJsonLd: null,
              dRepToBeClaimedJsonLdHash: null,
            };
            drepIdBeingClaimedRef.current = null;
            removeItemFromLocalStorage(DREP_ID_CLAIM_LS_KEY);
            break;
          default:
            console.log('unknown claiming status');
            break;
        }
      } else {
        //normal state update
        userInfo.dRepClaimInfo = {
          ...user.dRepClaimInfo,
          ...userInfo.dRepClaimInfo,
        };
        if (userInfo.dRepClaimInfo.dRepIDToClaimBech32) {
          drepIdBeingClaimedRef.current =
            userInfo.dRepClaimInfo.dRepIDToClaimBech32;
          setItemToLocalStorage(
            DREP_ID_CLAIM_LS_KEY,
            userInfo.dRepClaimInfo.dRepIDToClaimBech32,
          );
        }
      }
    }

    setUser((prevUser) => {
      const deepMerge = (target, source) => {
        if (!source) return target;

        const result = { ...target };

        for (const key in source) {
          if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

          if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
          ) {
            result[key] = deepMerge(target[key], source[key]);
          } else {
            result[key] = source[key];
          }
        }

        return result;
      };

      return deepMerge(prevUser, userInfo);
    });
  };

  const handleSetCurrentLocale = useCallback((locale: string) => {
    setCurrentLocale(locale);
  }, []);

  const openModal = useCallback(
    <T extends ModalType>(type: T, props?: ModalProps[T]) => {
      setModalState((prev) => {
        switch (type) {
          case ModalType.WALLET_LIST:
            return {
              ...prev,
              walletListModal: {
                isOpen: true,
                hideCloseButton:
                  (props as ModalProps[ModalType.WALLET_LIST])
                    ?.hideCloseButton || false,
              },
            };

          case ModalType.LOGIN:
            return {
              ...prev,
              loginModal: {
                isOpen: true,
                hideCloseButton:
                  (props as ModalProps[ModalType.LOGIN])?.hideCloseButton ||
                  false,
              },
            };

          case ModalType.USERNAME:
            return {
              ...prev,
              usernameModal: {
                isOpen: true,
                hideCloseButton:
                  (props as ModalProps[ModalType.USERNAME])?.hideCloseButton ??
                  true,
              },
            };

          case ModalType.DREP_ERROR:
            return {
              ...prev,
              drepErrorModal: {
                isOpen: true,
              },
            };

          case ModalType.ACTION:
            return {
              ...prev,
              actionModal: {
                isOpen: true,
                props: props as ActionModalProps,
              },
            };

          case ModalType.TRANSACTION: {
            const txnProps = props as ModalProps[ModalType.TRANSACTION];
            return {
              ...prev,
              txnModal: {
                ...prev.txnModal,
                props: {
                  ...prev.txnModal,
                  isOpen: true,
                  ...txnProps,
                },
              },
            };
          }

          default:
            return prev;
        }
      });
    },
    [],
  );

  const closeModal = useCallback((type: ModalType) => {
    setModalState((prev) => {
      switch (type) {
        case ModalType.WALLET_LIST:
          return {
            ...prev,
            walletListModal: {
              ...prev.walletListModal,
              isOpen: false,
            },
          };

        case ModalType.LOGIN:
          return {
            ...prev,
            loginModal: {
              ...prev.loginModal,
              isOpen: false,
            },
          };

        case ModalType.USERNAME:
          return {
            ...prev,
            usernameModal: {
              ...prev.usernameModal,
              isOpen: false,
            },
          };

        case ModalType.DREP_ERROR:
          return {
            ...prev,
            drepErrorModal: {
              isOpen: false,
            },
          };

        case ModalType.ACTION:
          return {
            ...prev,
            actionModal: {
              isOpen: false,
              props: null,
            },
          };

        case ModalType.TRANSACTION:
          return {
            ...prev,
            txnModal: {
              ...prev.txnModal,
              props: {
                ...prev.txnModal,
                isOpen: false,
              },
            },
          };

        default:
          return prev;
      }
    });
  }, []);

  const setTxnLoading = useCallback((isLoading: boolean) => {
    setModalState((prev) => ({
      ...prev,
      txnModal: {
        ...prev.txnModal,
        isLoading,
      },
    }));
  }, []);

  const modalContextValue: ModalContextType = useMemo(
    () => ({
      ...modalState,
      openModal,
      closeModal,
      updateTxnModalState,
      setTxnLoading,
    }),
    [modalState],
  );

  const walletContextValue = useMemo(
    () => ({
      wallet,
      connectWallet,
      disconnectWallet,
      activeWallet: activeProvider,
      walletApi,
      signMessage,
      loginSignTransaction,
      loginHardwareWalletTransaction,
      initTransactionBuilder,
      buildCredentialFromBech32Key,
      buildVote,
      buildStakeKeyRegCert,
      buildVoteDelegationCert,
      buildDRepRetirementCert,
      buildDRepUpdateCert,
      signAndSubmitTransaction,
      latestEpoch,
      firstEpoch,
      user,
      setUserInfo,
      currentLocale,
      setCurrentLocale: handleSetCurrentLocale,
      handleRefreshUserJsonLd,
    }),
    [wallet, user, latestEpoch, firstEpoch, currentLocale, walletApi],
  );

  return (
    <GlobalContext.Provider
      value={{ ...walletContextValue, ...modalContextValue }}
    >
      {children}
      {modalState.walletListModal.isOpen && (
        <div className="blur-container fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center">
          <ChooseWalletModal
            open={modalState.walletListModal.isOpen}
            hideCloseButton={modalState.walletListModal.hideCloseButton}
            onClose={() => closeModal(ModalType.WALLET_LIST)}
          />
        </div>
      )}

      {modalState.loginModal.isOpen && (
        <div className="blur-container fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center">
          <UserLoginModal
            hideCloseButton={modalState.loginModal.hideCloseButton}
            onClose={() => {
              closeModal(ModalType.LOGIN);
              if (modalState.walletListModal.isOpen) {
                closeModal(ModalType.WALLET_LIST);
              }
            }}
            handleHotWalletLogin={() => {
              openModal(ModalType.WALLET_LIST, {
                hideCloseButton: false,
              });
            }}
          />
        </div>
      )}

      {modalState.usernameModal.isOpen && (
        <div className="blur-container fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center">
          <GovToolUserNameModal
            hideCloseButton={modalState.usernameModal.hideCloseButton}
            onClose={() => closeModal(ModalType.USERNAME)}
          />
        </div>
      )}

      {modalState.actionModal.isOpen && modalState.actionModal.props && (
        <div className="blur-container fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center">
          <ActionModal
            {...modalState.actionModal.props}
            handleClose={() => closeModal(ModalType.ACTION)}
          />
        </div>
      )}

      {modalState.txnModal.txnModalState.isOpen && (
        <CardanoTxModal
          isPrepping={modalState.txnModal.txnModalState.isPrepping}
          onClose={modalState.txnModal.closeTxnModal}
          onWalletSign={() =>
            modalState.txnModal.handleWalletSign(
              modalState.txnModal.txnModalState.currentWalletApi,
            )
          }
          onDownloadUnsigned={modalState.txnModal.handleDownloadUnsigned}
          onSubmitSignedTx={(signedTxHash: File) =>
            modalState.txnModal.handleSubmitSignedTxFile(
              signedTxHash,
              modalState.txnModal.txnModalState.currentWalletApi,
            )
          }
          fileToDownload={modalState.txnModal.txnModalState.fileToDownload}
          currentNetwork={CONFIGURED_NETWORK_ID}
          error={modalState.txnModal.txnModalState.error}
          disableDownload={modalState.txnModal.userActionState.disableDownload}
          disableSigning={modalState.txnModal.userActionState.disableSigning}
          txHash={modalState.txnModal.txnModalState.txHash}
          txType={modalState.txnModal.txnModalState.type}
          isLoading={modalState.txnModal.isLoading}
          requiredSigningKey={
            Array.isArray(
              modalState.txnModal.txnModalState.pendingTx?.requiredSigningKeys,
            ) &&
            modalState.txnModal.txnModalState.pendingTx?.requiredSigningKeys
              .length > 0
              ? modalState.txnModal.txnModalState.pendingTx
                  ?.requiredSigningKeys[0].type
              : undefined
          }
        />
      )}
    </GlobalContext.Provider>
  );
};

/**
 * Hook to use the wallet context
 * @returns Wallet context
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(GlobalContext);

  if (context === undefined) {
    throw new Error('useWallet must be used within a GlobalProvider');
  }

  return context as WalletContextType;
};
export const useModals = () => {
  const context = useContext(GlobalContext);

  if (context === undefined) {
    throw new Error('useModals must be used within a GlobalProvider');
  }

  return context as ModalContextType;
};
