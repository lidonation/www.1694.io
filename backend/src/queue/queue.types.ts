export enum Queues {
  DREP_CLAIM = 'drep-claim',
}

export enum JobTypes {
  DREP_CLAIM = 'drep-claim-job',
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