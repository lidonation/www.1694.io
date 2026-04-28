export type Epoch = {
  id: string;
  start_time: string;
  end_time: string;
  no: number;
  type: 'epoch';
  timestamp: string;
};

export type DrepVote = {
  id: string | number;
  view: string;
  gov_action_proposal_id: string;
  gov_action_proposal_index: string;
  prop_inception: string;
  type: 'voting_activity';
  voting_anchor_id: string;
  vote: string;
  metadata: any;
  time_voted: string;
  proposal_epoch: number;
  voting_epoch: number;
  enacted_epoch: number;
  expiration_epoch: number;
  url: string;
  vote_rationale: string;
  timestamp: string;
  txHash?: string;
  tx_hash?: string;
  proposal?: {
    title: string | null;
    abstract: string | null;
    rationale: string | null;
    type: string | null;
  };
};

export type Delegation = {
  id: string | number;
  stake_address: string;
  target_drep: string;
  current_drep: string;
  current_chain_id: string;
  current_drep_has_script: boolean;
  previous_drep: string;
  previous_chain_id: string;
  previous_drep_has_script: boolean;
  timestamp: string;
  delegation_epoch: number;
  tx_hash: string;
  type: 'delegation';
  total_stake: string;
  added_power: boolean;
};

export type DRepNote = {
  id: string | number;
  note_deletedAt: null;
  note_id: number;
  note_createdAt: string;
  note_updatedAt: string;
  note_title: string;
  note_tag: string;
  note_content: string;
  note_visibility: string;
  note_drepId: number;
  note_authorId: number;
  drep_deletedAt: null;
  drep_id: number;
  drep_createdAt: string;
  drep_updatedAt: string;
  reactions: any[];
  comments: any[];
  type: 'note';
  timestamp: string;
};

export type DRepClaimProfile = {
  id: string | number;
  type: 'claimed_profile';
  timestamp: string;
  claimingId: number;
  claimedDRepId: string;
};
export type Registration = {
  id: string | number;
  type: 'registration';
  timestamp: string;
  tx_hash: string;
  epoch_no: number;
};

export type TimelineItem =
  | Epoch
  | DrepVote
  | Delegation
  | Registration
  | DRepNote
  | DRepClaimProfile;
