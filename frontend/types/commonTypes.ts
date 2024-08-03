export interface StakeKeys {
  stakeKey?: string;
  stakeKeyBech32?: string;
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [property: string]: JSONValue }
  | JSONValue[];
export enum MetadataStandard {
  CIP100 = 'CIP100',
}
