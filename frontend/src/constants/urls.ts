export const CONFIGURED_NETWORK_ID = Number(process.env.NETWORK_ID);

export const urls = {
  baseServerUrl: process.env.NEXT_PUBLIC_BASE_URL_API || '',
  govToolUrl: process.env.NEXT_PUBLIC_BASE_URL_GOVTOOL || '',
  cexplorerUrl: process.env.NEXT_PUBLIC_BASE_URL_EXPLORER || '',
};
console.log(urls);
