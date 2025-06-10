export class createDrepDto {
  stake_addr?: string;
  voter_id?: string;
  drep_bech32?: string;
  signatures: {
    signature: string;
    key: string;
    type: 'drep' | 'signer'
  }[];
}
