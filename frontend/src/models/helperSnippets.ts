import { getNetworkFlag } from '@/lib/helpers';
import { Networks } from './enums';
import { RequiredSigningKeyType } from '@/hooks/useTransactionHandler';

type HelperSnippetTypes =
  | 'messageSigning'
  | 'signDelegationTxn'
  | 'signUpdateMetadataTxn'
  | 'signExpiredTxn';

type ErrorHelperSnippetTypes = 'inadequateSignatures';

interface HelperSnippet {
  type: HelperSnippetTypes | ErrorHelperSnippetTypes;
  snippetToCopy: (
    networkType: Networks.mainnet | Networks.testnet,
    fileToDownload?: string,
    keyTypeForSigning?: RequiredSigningKeyType,
  ) => string;
  extraText?: string;
}

export const helperSnippets: HelperSnippet[] = [
  {
    snippetToCopy: (networkType, fileToDownload = 'tx.raw') => {
      return `cardano-cli latest transaction sign \\
                --tx-body-file ${fileToDownload} \\
                --signing-key-file /path/to/your/payment.skey \\
                --signing-key-file /path/to/your/stake.skey \\
                ${getNetworkFlag(networkType)} \\
                --out-file tx.signed`;
    },
    type: 'signDelegationTxn',
    extraText: 'Copy the below command to sign the delegation transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload = 'tx.raw') => {
      return `cardano-cli latest transaction sign \\
                --tx-body-file ${fileToDownload} \\
                --signing-key-file payment.skey \\
                --signing-key-file drep.skey \\
                ${getNetworkFlag(networkType)} \\
                --out-file tx.signed`;
    },
    type: 'signUpdateMetadataTxn',
    extraText: 'Copy the below command to sign the update metadata transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload = 'tx.raw', keyTypeForSigning = 'payment') => {
      return `cardano-cli latest transaction sign \\
                --tx-body-file ${fileToDownload} \\
                --signing-key-file ${keyTypeForSigning}.skey \\
                ${getNetworkFlag(networkType)} \\
                --out-file tx.signed`;
    },
    type: 'signExpiredTxn',
    extraText: 'Copy the below command to sign the expired transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload = 'tx.raw') => {
      return `cardano-cli latest transaction sign \\
                --tx-body-file ${fileToDownload} \\
                --signing-key-file payment.skey \\
                --signing-key-file drep.skey \\
                ${getNetworkFlag(networkType)} \\
                --out-file tx.signed`;
    },
    type: 'inadequateSignatures',
    extraText:
      'Updating DRep metadata requires both payment and DRep keys to sign the transaction',
  },
  {
    snippetToCopy: (networkType, fileToDownload = 'tx.raw', keyTypeForSigning = 'stake') => {
      return `cardano-signer sign --cip30 \\
                --data-file ${fileToDownload} \\
                --out-file tx.signed \\
                --secret-key ${keyTypeForSigning}.skey \\
                --address ${keyTypeForSigning}.addr \\
                ${getNetworkFlag(networkType)} \\
                --json`;
    },
    type: 'messageSigning',
    extraText:
      'Copy this command to sign the message with the required key using the cardano-signer CLI',
  },
];
