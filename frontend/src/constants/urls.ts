export const networkIds = {
  MAINNET: 1,
  SANCHONET: 0, 
  PREVIEW: 0,
};

export const CONFIGURED_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);

export const urls = {
  baseProdUrl: '',
  baseServerUrl: process.env.NEXT_PUBLIC_BASE_API_URL || '',
  govToolUrl: process.env.NEXT_PUBLIC_BASE_GOVTOOL_URL || '',
  cexplorerUrl: process.env.NEXT_PUBLIC_BASE_CEXPLORER_URL || '',
};
