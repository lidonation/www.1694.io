export const WALLET_LS_KEY = 'wallet_data';
export const LOGIN_FILE_LS_KEY = 'login_file_data';
export const ACTIVE_PROVIDER_LS_KEY = 'active_provider';
export const DREP_CLAIM_LS_KEY = 'drep_claim_data';
export const DREP_ID_CLAIM_LS_KEY = 'drep_id_claim_data';
export const DREP_FILTERS_LS_KEY = 'drep_filters';
export const DREP_SORT_LS_KEY = 'drep_sort';
export const DREP_LAST_TAB_LS_KEY = 'drep_last_tab';
export const LAST_DREP_ID_LS_KEY = 'last_drep_id';
export const PROPOSAL_FILTERS_LS_KEY = 'proposal_filters';
export const PROPOSAL_SORT_LS_KEY = 'proposal_sort';

export function getItemFromLocalStorage(key: string) {
  const item = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

export function setItemToLocalStorage(key: string, data: any) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

export function removeItemFromLocalStorage(key: string) {
  window.localStorage.removeItem(key);
}
