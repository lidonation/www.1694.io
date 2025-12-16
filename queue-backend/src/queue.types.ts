export enum Queues {
  DREP_CLAIM = "drep-claim",
}

export type DRepClaimJobData = {
  stakeKey: string;
  signature: string;
  signatureKey: string;
};

export type DRepClaimJobResponse = {
  success: boolean;
  message: string;
  isRegistered?: boolean;
  stakeKey?: string;
  signature?: string;
  signatureKey?: string;
  view?: string;
  deposit?: string;
  retired?: boolean;
};

export class createDrepDto {
  stake_addr?: string;
  voter_id?: string;
  drep_bech32?: string;
  signatures: {
    signature: string;
    key: string;
    type: "drep" | "signer";
  }[];
}
