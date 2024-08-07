export const networkIds = {
  MAINNET: 1,
  SANCHONET: 0, 
  PREVIEW: 0,
};
export const CONFIGURED_NETWORK_ID = Number(process.env.NEXT_PUBLIC_NETWORK_ID);
function getBaseServerUrl() {
  if (CONFIGURED_NETWORK_ID === networkIds.MAINNET) {
    return process.env.NEXT_PUBLIC_BASE_SERVER_MAINNET_URL;
  }
  if (CONFIGURED_NETWORK_ID === networkIds.PREVIEW) {
    return process.env.NEXT_PUBLIC_BASE_SERVER_PREVIEW_URL;
  }
  if (CONFIGURED_NETWORK_ID === networkIds.SANCHONET) {
    return process.env.NEXT_PUBLIC_BASE_SERVER_SANCHO_URL;
  }
}
function getBaseExplorer() {
  if (CONFIGURED_NETWORK_ID === networkIds.MAINNET) {
    return 'https://cexplorer.io/';
  }
  if (CONFIGURED_NETWORK_ID === networkIds.PREVIEW) {
    return 'https://preview.cexplorer.io/';
  }
  if (CONFIGURED_NETWORK_ID === networkIds.SANCHONET) {
    return 'https://sancho.cexplorer.io';
  }
}
function getBaseGovTool() {
  if (CONFIGURED_NETWORK_ID === networkIds.MAINNET) {
    return 'https://govtool.io/'; // coming soon
  }
  if (CONFIGURED_NETWORK_ID === networkIds.PREVIEW) {
    return 'https://preview.gov.tools';
  }
  if (CONFIGURED_NETWORK_ID === networkIds.SANCHONET) {
    return 'https://sanchogov.tools';
  }
}
export const urls = {
  baseProdUrl: '',
  baseServerUrl: getBaseServerUrl(),
  govToolUrl: getBaseGovTool(),
  cexplorerUrl: getBaseExplorer(),
};
