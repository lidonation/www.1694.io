export enum Queues {
  DREP_CLAIM = 'drep-claim',
}

export type DRepClaimJobData = {
  test: string;
};

export interface QueueJob<T> {
  name: string;
  data: T
}

export interface TestJobData {
  test: string;
}