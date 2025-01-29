export interface DbSyncUTXO {
  id: string;
  tx_id: string;
  index: number;
  address: string;
  address_has_script: boolean;
  payment_cred: string;
  stake_address_id: string;
  value: string;
  data_hash: null | string;
  inline_datum_id: null | string;
  reference_script_id: null | string;
  consumed_by_tx_id: null | string;
  hash: string;
  block_id: string;
  block_index: number;
  out_sum: string;
  fee: string;
  deposit: string;
  size: number;
  invalid_before: null | string;
  invalid_hereafter: null | string;
  valid_contract: boolean;
  script_size: number;
  treasury_donation: string;
}

export interface BlockfrostUTXO {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
}

export interface StandardizedUTXO extends BlockfrostUTXO {}
