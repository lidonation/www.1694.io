export interface drepInput {
  stake_addr: string;
  voter_id: string;
  signatures: {
    signature: string;
    key: string;
    type: string
  }[];
  drep_bech32: string;
}