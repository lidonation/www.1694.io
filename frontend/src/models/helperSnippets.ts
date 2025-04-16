import { getNetworkFlag } from '@/lib/helpers';
import { Networks } from './enums';

type HelperSnippetTypes =
  | 'messageSigning'
  | 'signDelegationTxn'
  | 'signUpdateMetadataTxn'
  | 'signExpiredTxn';

type ErrorHelperSnippetTypes = 'inadequateSignatures';

interface HelperSnippet {
  type: HelperSnippetTypes | ErrorHelperSnippetTypes;
  snippetToCopy: (networkType: Networks.mainnet | Networks.testnet, fileToDownload?:string) => string;
  extraText?: string;
}

export const helperSnippets: HelperSnippet[] = [
  {
    snippetToCopy: (networkType, fileToDownload ='tx.raw') => {
      return `
    cardano-cli latest transaction sign \n
        --tx-body-file ${fileToDownload} \n
        --signing-key-file /path/to/your/payment.skey \n
        --signing-key-file /path/to/your/stake.skey \n
        ${getNetworkFlag(networkType)} \n
        --out-file tx.signed 
    `;
    },
    type: 'signDelegationTxn',
    extraText: 'Copy the below command to sign the delegation transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload ='tx.raw') => {
      return `
    cardano-cli latest transaction sign \n
        --tx-body-file ${fileToDownload} \n
        --signing-key-file payment.skey \n
        --signing-key-file drep.skey \n
        ${getNetworkFlag(networkType)} \n
        --out-file tx.signed 
    `;
    },
    type: 'signUpdateMetadataTxn',
    extraText: 'Copy the below command to sign the update metadata transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload ='tx.raw') => {
      return `
    cardano-cli latest transaction sign \n
        --tx-body-file ${fileToDownload} \n
        --signing-key-file payment.skey \n
        ${getNetworkFlag(networkType)} \n
        --out-file tx.signed 
    `;
    },
    type: 'signExpiredTxn',
    extraText: 'Copy the below command to sign the expired transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload ='tx.raw') => {
      return `
    cardano-cli latest transaction sign \n
        --tx-body-file ${fileToDownload} \n
        --signing-key-file payment.skey \n
        --signing-key-file drep.skey \n
        ${getNetworkFlag(networkType)} \n
        --out-file tx.signed 
    `;
    },
    type: 'inadequateSignatures',
    extraText:
      'Updating DRep metadata requires both payment and DRep keys to sign the transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload ='tx.raw') => {
      return `
    cardano-signer sign --cip30 \n
     --data-file ${fileToDownload} \n
     --out-file tx.signed \n
     --secret-key stake.skey \n
     --address stake.addr \n
     ${getNetworkFlag(networkType)} \n
     --json
    `;
    },
    type: 'messageSigning',
    extraText:
      'Copy this command to sign the message with your stake key using the cardano-signer CLI',
  }
];
