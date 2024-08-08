export const networkIds = {
  MAINNET: 1,
  SANCHONET: 0, 
  PREVIEW: 0,
};

export const CONFIGURED_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);

export const urls = {
  baseProdUrl: '',
  baseServerUrl: process.env.NEXT_PUBLIC_BASE_URL_API || '',
  govToolUrl: process.env.NEXT_PUBLIC_BASE_URL_GOVTOOL || '',
  cexplorerUrl: process.env.NEXT_PUBLIC_BASE_URL_EXPLORER || '',
};
