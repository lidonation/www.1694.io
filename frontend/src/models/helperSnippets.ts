import { getNetworkFlag } from '@/lib/helpers';
import { Networks } from './enums';

type HelperSnippetTypes =
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
];
