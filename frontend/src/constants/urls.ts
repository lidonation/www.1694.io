export const CONFIGURED_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);

export const urls = {
  baseProdUrl: '',
  baseServerUrl: process.env.BASE_URL_API || '',
  govToolUrl: process.env.BASE_URL_GOVTOOL || '',
  cexplorerUrl: process.env.BASE_URL_EXPLORER || '',
};
