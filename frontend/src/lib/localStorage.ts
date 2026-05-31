export const WALLET_LS_KEY = 'wallet_data';
export const LOGIN_FILE_LS_KEY = 'login_file_data';
export const ACTIVE_PROVIDER_LS_KEY = 'active_provider';
export const DREP_CLAIM_LS_KEY = 'drep_claim_data';
export const DREP_ID_CLAIM_LS_KEY = 'drep_id_claim_data';
export const DREP_FILTERS_LS_KEY = 'drep_filters';
export const DREP_SORT_LS_KEY = 'drep_sort';
export const PROPOSAL_FILTERS_LS_KEY = 'proposal_filters';
export const PROPOSAL_SORT_LS_KEY = 'proposal_sort';

export function getItemFromLocalStorage(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting item from localStorage:', error);
    return null;
  }
}

export function setItemToLocalStorage(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting item in localStorage:', error);
  }
}

export function removeItemFromLocalStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item from localStorage:', error);
  }
}

export const getDrepLastTabKey = (drepId: string) => `DREP_LAST_TAB_${drepId}`;
