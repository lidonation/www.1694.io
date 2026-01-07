export enum Queues {
  DREP_CLAIM = 'drep-claim',
  STAKE_SYNC = 'stake-sync',
  GOVERNANCE_SYNC = 'governance-sync',
  DREP_VOTES_SYNC = 'drep-votes-sync',
  PROPOSALS_SYNC = 'proposals-sync',
}

export enum JobTypes {
  DREP_CLAIM = 'drep-claim-job',
  STAKE_SYNC = 'stake-sync-job',
  GOVERNANCE_SYNC = 'governance-sync-job',
  DREP_VOTES_SYNC = 'drep-votes-sync-job',
  PROPOSALS_SYNC = 'proposals-sync-job',
}

export type DRepClaimJobData = {
  stakeKey: string;
  signature: string;
  signatureKey: string;
};

export type DRepClaimJobResponse ={
  success: boolean;
  message: string;
  isRegistered?: boolean;
  stakeKey?: string;
  signature?: string;
  signatureKey?: string;
  view?: string;
  deposit?: string;
  retired?: boolean;
}

export interface QueueJob<T> {
  name: string;
  data: T
}

export interface TestJobData {
  test: string;
}

export type StakeSyncJobData = {
  epochNo?: number;
};

export type StakeSyncJobResponse = {
  success: boolean;
  message: string;
  updatedDRepsCount?: number;
  updatedDelegatorsCount?: number;
  epochNo?: number;
};

export type GovernanceSyncJobData = {
  forceRefresh?: boolean;
};

export type GovernanceSyncJobResponse = {
  success: boolean;
  message: string;
  drepsCount?: number;
  proposalsCount?: number;
  votesCount?: number;
  delegatorsCount?: number;
};

export type DrepVotesSyncJobData = {
  forceRefresh?: boolean;
};

export type DrepVotesSyncJobResponse = {
  success: boolean;
  message: string;
  drepVotesCount?: number;
  processedDreps?: number;
};

export type ProposalsSyncJobData = {
  forceRefresh?: boolean;
};

export type ProposalsSyncJobResponse = {
  success: boolean;
  message: string;
  proposalsCount?: number;
  metadataCount?: number;
};
