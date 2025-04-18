export interface AuthResult {
  success: boolean;
  accountInfo?: AccountInfo;
  error?: string;
}

export interface AccountInfo {
  address: string;
  stakeKey?: string;
  stakeKeyBech32?: string;
  balance?: string;
  dRepInfo?: {
    id: string;
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
