export type StakeKeys = {
  stakeKey: string;
  stakeKeyBech32: string;
} | null;

export type Delegation = {
  drep_raw: string | null;
  drep_view: string | null;
  encode: string | null;
} | null;


export enum MetadataStandard {
  CIP100 = 'CIP100'
}

export enum MetadataValidationStatus {
  URL_NOT_FOUND = 'URL_NOT_FOUND',
  INVALID_JSONLD = 'INVALID_JSONLD',
  INVALID_HASH = 'INVALID_HASH',
  INCORRECT_FORMAT = 'INCORRECT_FORMAT',
}
export enum LoggerMessage {
  METADATA_VALIDATION_ERROR = 'Metadata validation error',
  METADATA_DATA = 'Metadata data',
  CANNOT_GET_METADATA_URL = 'Cannot get metadata from URL',
  PARSED_METADATA_BODY = 'Parsed metadata body',
  CANNOT_PARSE_METADATA_BODY = 'Cannot parse metadata body',
}

export type ValidateMetadataResult = {
  status?: MetadataValidationStatus;
  valid: boolean;
  metadata?: any;
};
