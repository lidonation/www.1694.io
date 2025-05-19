import { CardanoApiWallet } from "@/models/wallet";
import {Ed25519KeyHash} from "@emurgo/cardano-serialization-lib-asmjs";

export interface AuthResult {
  success: boolean;
  accountInfo?: AccountInfo;
  walletApi?:CardanoApiWallet
  error?: string;
}

export interface AccountInfo {
  address: string;
  addressBech32: string;
  stakeKey?: string;
  stakeKeyBech32?: string;
  registeredStakeKeysListState?: string[];
  balance?: string;
  dRepInfo?: {
    isDRep: boolean;
    dRepId: string | null;
    dRepIdBech32?: string | null;
    dRepKeyHash?: Ed25519KeyHash | null;
    votingPower?: string;
    delegatedTo?: string;
    delegatedToVotingPower?: string;
  };
}

export interface SignatureData {
  signature: string;
  key: string;
}

export interface AuthenticationProvider {
  connect(params?: any): Promise<AuthResult>;
  reconnect?(): Promise<AuthResult>;
  disconnect(): Promise<void>;

  getAccountInfo(): Promise<AccountInfo | null>;
  isConnected(): boolean;
  supportsMessageSigning?: boolean;
  supportsColdWallet?: boolean;
}

export enum AuthMethod {
  HOT_WALLET = 'hot_wallet',
  COLD_WALLET = 'cold_wallet',
  LOGIN_FILE = 'login_file',
}


export type LoginPayload = {
  expiry: number;
  drepId?: string;
  voterId?: string;
  drep_bech32: string;
  stakeKey: string;
  signatures: {
    signature: string;
    key: string;
    type: 'drep' | 'signer'
  }[];
};

