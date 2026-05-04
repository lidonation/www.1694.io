import { AuthMethod } from "./auth";

export type currentDelegation = {
  drep_raw: string | null;
  drep_view: string | null;
  tx_hash: string | null;
  has_script: boolean | null;
} | null;

export type Delegator = {
  stakeAddress: string | null;
  delegationEpoch: number | null;
  votingPower: number | null;
};

export type Delegators = {
  data: Delegator[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
};

export type GovAction = {
  gov_action_proposal_id: string | null;
  gov_action_proposal_index: string | null;
  type: string | null;
  description: {
    tag: string;
    contents: string | null;
  } | null;
  vote: string | null;
  url: string | null;
  metadata: string | null;
  epoch_no: number | null;
  time_voted: string | null;
  vote_tx_hash: string | null;
  drep_id: string | null;
  view: string | null;
  vote_rationale: string | null;
  enacted_epoch: number | null;
  expiration_epoch: number | null;
  txHash?: string;
  tx_hash?: string;
};

export type VoterGovActions = {
  data: GovAction[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
};

export type ClaimedProfile = {
  voterDRepBech32: string;
  voterStakeKey: string;
  claimedDRepId: string;
  claimedDRepBech32: string;
  voterSignatureType: string;
  voterSignatureKey: string;
  voterSignature: string;
  claimMethod: AuthMethod
};

export type SingleDRep = {
  drep_deletedAt?: string | null;
  drep_id?: number | null;
  drep_createdAt?: string | null;
  drep_updatedAt?: string | null;
  drep_name?: string | null;
  drep_bio?: string | null;
  drep_metadata?: string | null;
  drep_social?: string | null;
  drep_platform_statement?: string | null;
  drep_expertise?: string | null;
  drep_perspective?: string | null;
  attachment_deletedAt?: string | null;
  attachment_id?: number | null;
  attachment_createdAt?: string | null;
  attachment_updatedAt?: string | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
  attachment_parententity?: string | null;
  attachment_parentid?: number | null;
  attachment_attachmentType?: string | null;
  attachment_noteId?: number | null;
  attachment_drepId?: number | null;
  attachment_commentId?: number | null;
  signature_id?: number | null;
  signature_voterId?: string | null;
  signature_stakeKey?: string | null;
  signature_signature?: string | null;
  signature_signatureKey?: string | null;
  signature_drepId?: number | null;
  drep_hash_id: string | null;
  view: string | null;
  delegation_vote_count: string | null;
  is_registered_as_sole_voter: boolean;
  stake_address: string | null;
  voting_power: string | null;
  live_stake: string | null;
  epoch_no: number | null;
  active_until: number | null;
  deposit: string | null;
  metadata_url: string | null;
  has_script: string | null;
  reg_address: string | null;
  type: string | null;
  retired: boolean;
  active: boolean;
  chain_id?: string | null;
  metadata?: any | null;
};

export type DRepStats = {
  delegators: number;
  votes: number;
  votingPower: number;
};

export type DelegationData = {
  stake_address: string;
  target_drep: string;
  current_drep: string;
  current_chain_id: string | null;
  current_drep_has_script: boolean;
  previous_drep: string | null;
  previous_chain_id: string | null;
  previous_drep_has_script: boolean;
  timestamp: string;
  delegation_epoch: number;
  tx_hash: string;
  type: string;
  total_stake: string;
  added_power: boolean;
};
export interface VoterData {
  address: string;
  total_stake: number;
  drep_id: string;
  stake_address: string;
  delegationHistory: any[];
  isDelegated: boolean;
}
export interface BlockfrostUTXO {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
}

export interface StandardizedUTXO extends BlockfrostUTXO {}

export interface CxProposalsMetrics {
  proposals: number;
  funded_proposals: number;
  completed_proposals: number;
  outstanding_proposals: number;
}

export interface DRepParticipation {
  participation: number,
  total_actions: number,
  non_participation: number
}
