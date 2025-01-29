export class createDrepDto extends FormData {
  name: string;
  platform_statement: string;
  bio: string;
  expertise: string;
  perspective: string;
  profileUrl?: string;
  stake_addr?: string;
  voter_id?: string;
  drep_bech32?: string;
  signatures: {
    signature: string;
    key: string;
    type
  }[];
}
