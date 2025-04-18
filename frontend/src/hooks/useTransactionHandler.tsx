import { Utxos } from '@/context/cardanoContext';
import {
  BodyAfterSign,
  BodyToSign,
  CardanoApiWallet,
  MessageBodyAfterSign,
  Protocol,
  TxBody,
} from '@/models/wallet';
import {
  Address,
  BigNum,
  Certificate,
  CertificatesBuilder,
  ChangeConfig,
  LinearFee,
  Transaction,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionHash,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionWitnessSet,
  Value,
  VotingBuilder,
} from '@emurgo/cardano-serialization-lib-asmjs';
import { useCallback, useState } from 'react';
import { useGetNodeStatusQuery } from './useGetNodeStatusQuery';
import { getItemFromLocalStorage } from '@/lib';
import { getAddressUtxos } from '@/services/requests/getAddressUtxos';

interface GetUtxosOptions {
  address?: string;
  external?: boolean;
}
export type TxnTypes =
  | 'loginViaMessageSigning'
  | 'loginViaExpiredTxnSigning'
  | 'delegationTxn'
  | 'submitMetadataTxn';

export type ObjectToSignType = 'transaction' | 'message';

interface TxnModalState {
  isOpen: boolean;
  currentWalletApi?: CardanoApiWallet;
  isPrepping: boolean;
  fileToDownload?: string;
  pendingTx: PendingTransaction | null;
  txHash?: string;
  resolve: ((value: any) => void) | null;
  reject: ((reason?: any) => void) | null;
  type: TxnTypes;
  error?: string;
}

interface HandleTransactionParams {
  [key: string]: any;
  signingKey?: string;
  txBuilder?: TransactionBuilder;
  certBuilder?: Certificate | VotingBuilder;
}

interface PendingTransaction {
  type: TxnTypes;
  txBuilder?: any;
  certBuilder?: any;
  signingKey?: string;
  transaction?: Transaction;
  message?: string;
  objectToSign?: ObjectToSignType;
}

interface TransactionHandlerProps {
  walletState: {
    changeAddress: undefined | string;
    usedAddress: undefined | string;
    balance: number | undefined;
  }
}

export interface TransactionHandler {
  txnModalState: TxnModalState;
  userActionState: {
    disableDownload: boolean;
    disableSigning: boolean;
  };
  isLoading: boolean;
  handleTransaction: (
    walletApi: CardanoApiWallet,
    type: TxnTypes,
    params?: HandleTransactionParams,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
      objectToSign?: ObjectToSignType;
      message?: string;
    },
  ) => Promise<any>;
  handleWalletSign: (walletApi: CardanoApiWallet) => Promise<any>;
  handleDownloadUnsigned: () => Promise<any>;
  handleSubmitSignedTxFile: (
    signedTxFile: File,
    walletApi: CardanoApiWallet,
  ) => Promise<any>;
  closeTxnModal: () => void;
  getUtxos: (
    enabledApi: CardanoApiWallet,
    options?: GetUtxosOptions,
  ) => Promise<Utxos | undefined>;
  getTxUnspentOutputs: (utxos: Utxos) => Promise<TransactionUnspentOutputs>;
  prepExpiredTxn: (
    txBuilder: TransactionBuilder,
    walletApi: CardanoApiWallet,
  ) => Promise<{ transaction: Transaction }>;
  buildFinalTx: (
    walletApi: CardanoApiWallet,
    certBuilder?: Certificate | VotingBuilder,
    options?: { deriveUtxosFrom?: string },
  ) => Promise<{ transaction: Transaction }>;
  prepareTxBody: (
    pendingTx: PendingTransaction,
    walletApi: CardanoApiWallet,
    options?: { deriveUtxosFrom?: string },
  ) => Promise<{
    transaction?: Transaction;
    signingKey?: string;
    message?: string;
  }>;
  filterUtxosByTokenType: (
    utxos: TransactionUnspentOutputs,
  ) => TransactionUnspentOutputs; 
}

export const DEFAULT_TXN_TTL = 60 * 60; // 60 minutes
export function useTransactionHandler({
  walletState,
}: TransactionHandlerProps) {
  const [txnModalState, setTxnModalState] = useState<TxnModalState>({
    isOpen: false,
    isPrepping: false,
    pendingTx: null,
    txHash: '',
    resolve: null,
    reject: null,
    type: 'submitMetadataTxn',
    currentWalletApi: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userActionState, setUserActionState] = useState({
    disableDownload: false,
    disableSigning: false,
  });

  const { refetch } = useGetNodeStatusQuery({ disablePolling: true });

  const getUtxos = async (
    enabledApi?: CardanoApiWallet,
    options?: GetUtxosOptions,
  ): Promise<Utxos | undefined> => {
    let rawUtxos;

    try {
      if (options?.external && options?.address) {
        const blockfrostUtxos = await getAddressUtxos(options.address);

        rawUtxos = blockfrostUtxos.map((utxo) => {
          const transactionInput = TransactionInput.new(
            TransactionHash.from_bytes(
              new Uint8Array(Buffer.from(utxo.tx_hash, 'hex')),
            ),
            utxo.output_index,
          );

          const outputAddress = Address.from_bech32(utxo.address);
          const outputAmount = Value.new(
            BigNum.from_str(
              utxo.amount.find((a) => a.unit === 'lovelace')?.quantity || '0',
            ),
          );

          const output = TransactionOutput.new(outputAddress, outputAmount);

          const bytes = TransactionUnspentOutput.new(
            transactionInput,
            output,
          ).to_bytes();
          return Buffer.from(bytes).toString('hex');
        });
      } else {
        if (!enabledApi) {
          throw new Error('No wallet API provided to get UTXOs');
        }
        // Get UTXOs from connected wallet
        rawUtxos = await enabledApi.getUtxos();
      }

      let Utxos = [];
      for (const rawUtxo of rawUtxos) {
        const utxo = TransactionUnspentOutput.from_bytes(
          Buffer.from(rawUtxo, 'hex') as any,
        );
        const input = utxo.input();
        const txid = Buffer.from(input.transaction_id().to_bytes()).toString(
          'hex',
        );
        const txindx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str();
        const multiasset = output.amount().multiasset();
        let multiAssetStr = '';

        if (multiasset) {
          const keys = multiasset.keys();
          const N = keys.len();

          for (let i = 0; i < N; i++) {
            const policyId = keys.get(i);
            const policyIdHex = Buffer.from(policyId.to_bytes()).toString(
              'hex',
            );
            const assets = multiasset.get(policyId);
            if (assets) {
              const assetNames = assets.keys();
              const K = assetNames.len();

              for (let j = 0; j < K; j++) {
                const assetName = assetNames.get(j);
                const assetNameString = Buffer.from(
                  assetName.name(),
                ).toString();
                const assetNameHex = Buffer.from(assetName.name()).toString(
                  'hex',
                );
                const multiassetAmt = multiasset.get_asset(policyId, assetName);
                multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
              }
            }
          }
        }

        const obj = {
          txid,
          txindx,
          amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr,
          TransactionUnspentOutput: utxo,
        };
        Utxos.push(obj);
      }
      return Utxos;
    } catch (err) {
      console.error('Error getting UTXOs:', err);
      throw err;
    }
  };

  const getTxUnspentOutputs = useCallback(async (utxos: Utxos) => {
    let txOutputs = TransactionUnspentOutputs.new();
    for (const utxo of utxos) {
      txOutputs.add(utxo.TransactionUnspentOutput);
    }
    return txOutputs;
  }, []);

  const prepExpiredTxn = async (
    txBuilder: TransactionBuilder,
    walletApi: CardanoApiWallet,
  ) => {
    try {
      const shelleyOutputAddress = Address.from_bech32(walletState.usedAddress);
      const shelleyChangeAddress = Address.from_bech32(
        walletState.changeAddress,
      );

      txBuilder.add_output(
        TransactionOutput.new(
          shelleyOutputAddress,
          Value.new(BigNum.from_str('1000000')),
        ),
      );

      const utxos = await getUtxos(walletApi);
      if (!utxos?.length) {
        throw new Error('No UTXOs found in wallet');
      }

      const txUnspentOutputs = await getTxUnspentOutputs(utxos);
      txBuilder.add_inputs_from(txUnspentOutputs, 1);
      txBuilder.add_change_if_needed(shelleyChangeAddress);

      txBuilder.set_ttl_bignum(BigNum.from_str('1'));

      const txBody = txBuilder.build();
      const transactionWitnessSet = TransactionWitnessSet.new();

      const transaction = Transaction.new(
        txBody,
        TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes()),
      );

      return { transaction };
    } catch (error) {
      console.error('Prepping expired txn error:', error);
      throw new Error(`Prepping expired txn failed: ${error.message || error}`);
    }
  };

  const filterUtxosByTokenType = (
    utxos: TransactionUnspentOutputs,
  ): TransactionUnspentOutputs => {
    const utxosArray = Array.from({ length: utxos.len() }, (_, i) =>
      utxos.get(i),
    );

    // Filter UTXOs to only include those without any native tokens/NFTs
    const nativeTokenUtxos = utxosArray.filter((utxo) => {
      const value = utxo.output().amount();
      const multiAsset = value.multiasset();

      // If no multiasset (only ADA), include it
      if (!multiAsset) return true;

      // If has any tokens, exclude it
      return false;
    });

    const result = TransactionUnspentOutputs.new();
    nativeTokenUtxos.forEach((utxo) => result.add(utxo));
    return result;
  };

  const buildFinalTx = async (
    walletApi: CardanoApiWallet,
    certBuilder?: any,
    options?: { deriveUtxosFrom?: string },
  ) => {
    try {
      if (!walletState.usedAddress || !walletState.changeAddress) {
        throw new Error('Wallet addresses not available');
      }

      const protocolParams = getItemFromLocalStorage(
        'protocolParams',
      ) as Protocol;
      if (!protocolParams) throw new Error('No protocol params found');

      const shelleyChangeAddress = Address.from_bech32(
        options?.deriveUtxosFrom || walletState.changeAddress,
      );

      const utxos = await getUtxos(walletApi, {
        address: options?.deriveUtxosFrom,
        external: Boolean(options?.deriveUtxosFrom),
      });
      if (!utxos?.length) throw new Error('No UTXOs available');

      const txUnspentOutputs = await getTxUnspentOutputs(utxos);
      const { data } = await refetch();
      let currentNodeStatus = data;
      const currentSlot = parseInt(
        Number(currentNodeStatus?.behindBy) > 100
          ? currentNodeStatus.comparedLatestSlotNo?.toString()
          : currentNodeStatus?.slot_no,
      );
      const ttl = currentSlot + DEFAULT_TXN_TTL;

      const finalTxBuilder = TransactionBuilder.new(
        TransactionBuilderConfigBuilder.new()
          .fee_algo(
            LinearFee.new(
              BigNum.from_str(String(protocolParams.min_fee_a)),
              BigNum.from_str(String(protocolParams.min_fee_b)),
            ),
          )
          .pool_deposit(BigNum.from_str(protocolParams.pool_deposit))
          .key_deposit(BigNum.from_str(protocolParams.key_deposit))
          .coins_per_utxo_byte(
            BigNum.from_str(String(protocolParams.coins_per_utxo_size)),
          )
          .max_value_size(protocolParams.max_val_size)
          .max_tx_size(protocolParams.max_tx_size)
          .prefer_pure_change(true)
          .build(),
      );

      if (certBuilder) {
        let newCertBuilder;
        switch (true) {
          case certBuilder instanceof Certificate:
            certBuilder = (() => {
              const builder = CertificatesBuilder.new();
              builder.add(certBuilder);
              return builder;
            })();
            break;
          case certBuilder instanceof VotingBuilder:
            finalTxBuilder.set_voting_builder(certBuilder);
            break;
          default:
            newCertBuilder = certBuilder;
        }
        if (newCertBuilder) {
          finalTxBuilder.set_certs_builder(newCertBuilder);
        }
      }
      finalTxBuilder.set_ttl_bignum(BigNum.from_str(ttl.toString()));

      //attempt to use only ADA UTXOs for building the transaction
      const nativeTokenUtxos = filterUtxosByTokenType(txUnspentOutputs);
      const changeConfig = ChangeConfig.new(shelleyChangeAddress);
      // Use UTxO selection strategy 3
      try {
        finalTxBuilder.add_inputs_from_and_change(
          nativeTokenUtxos,
          3,
          changeConfig,
        );
      } catch (e) {
        console.error(e);
        // Use UTxO selection strategy 2 if strategy 3 fails
        finalTxBuilder.add_inputs_from_and_change(
          nativeTokenUtxos,
          2,
          changeConfig,
        );
      }

      const finalTx = finalTxBuilder.build_tx();
      const transactionWitnessSet = TransactionWitnessSet.new();
      const transaction = Transaction.new(
        finalTx.body(),
        TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes()),
      );

      return { transaction };
    } catch (error) {
      console.error('Error building final transaction:', error);
      throw error;
    }
  };

  const prepareTxBody = async (
    pendingTx: PendingTransaction,
    walletApi: CardanoApiWallet,
    options?: { deriveUtxosFrom?: string },
  ): Promise<{
    transaction?: Transaction;
    signingKey?: string;
    message?: string;
  }> => {
    try {
      if (pendingTx.type === 'loginViaMessageSigning')
        return {
          signingKey: pendingTx?.signingKey,
          message: pendingTx?.message,
        };
      if (pendingTx.type === 'loginViaExpiredTxnSigning') {
        if (!pendingTx.txBuilder || !walletApi)
          throw new Error('Arguments not ready');
        return prepExpiredTxn(pendingTx.txBuilder, walletApi);
      }

      if (
        pendingTx.type === 'delegationTxn' ||
        pendingTx.type === 'submitMetadataTxn'
      ) {
        const { transaction } = await buildFinalTx(
          walletApi,
          pendingTx.certBuilder,
          options,
        );

        return { transaction };
      }

      return null;
    } catch (error) {
      console.error('Error preparing transaction:', error);
      throw error;
    }
  };

  const openTxnModal = async (
    pendingTx: PendingTransaction,
    walletApi: CardanoApiWallet,
    options?: { deriveUtxosFrom?: string },
  ): Promise<any> => {
    try {
      setTxnModalState((prev) => ({
        ...prev,
        isOpen: true,
        isPrepping: true,
        pendingTx,
        type: pendingTx.type,
        currentWalletApi: walletApi,
      }));

      const preparedTx = await prepareTxBody(pendingTx, walletApi, options);

      return new Promise((resolve, reject) => {
        setTxnModalState((prev) => ({
          ...prev,
          isPrepping: false,
          pendingTx: { ...pendingTx, ...preparedTx },
          resolve,
          reject,
        }));
      });
    } catch (error) {
      setTxnModalState((prev) => ({
        ...prev,
        isPrepping: false,
        error: error.message,
      }));
      console.error('Error opening transaction modal:', error);
      throw error;
    }
  };

  const closeTxnModal = () => {
    if (txnModalState.reject) {
      txnModalState.reject(new Error('Transaction cancelled'));
    }
    setTxnModalState({
      isOpen: false,
      isPrepping: false,
      pendingTx: null,
      txHash: '',
      resolve: null,
      reject: null,
      type: 'submitMetadataTxn',
    });
    setIsLoading(false);
  };

  const handleWalletSign = async (walletApi: any) => {
    setIsLoading(true);
    try {
      const { pendingTx } = txnModalState;

      if (pendingTx.type === 'loginViaMessageSigning') {
        const messageToSign = pendingTx.message || `Verify DRep`;
        const payloadBuffer = Buffer.from(messageToSign).toString('hex');

        const signResult = await walletApi.signData(
          pendingTx.signingKey,
          payloadBuffer,
        );
        const result = { signature: signResult.signature, key: signResult.key };

        if (txnModalState.resolve) {
          txnModalState.resolve(result);
        }

        closeTxnModal();
        return result;
      }

      if (!pendingTx?.transaction) {
        throw new Error('Transaction not prepared');
      }

      try {
        const transactionWitnessSet = TransactionWitnessSet.new();
        const txHex = pendingTx.transaction.to_hex();
        const txVkeyWitnessesHex = await walletApi.signTx(txHex, true);
        const txVkeyWitnesses = TransactionWitnessSet.from_bytes(
          Buffer.from(txVkeyWitnessesHex, 'hex') as any,
        );

        if (!txVkeyWitnesses.vkeys()) {
          throw new Error('No vkey witnesses returned from wallet');
        }

        transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

        const signedTx = Transaction.new(
          pendingTx.transaction.body(),
          transactionWitnessSet,
        );
        if (pendingTx.type === 'loginViaExpiredTxnSigning') {
          const { signature, vkey } = JSON.parse(
            signedTx.witness_set().vkeys().get(0).to_json(),
          );

          if (txnModalState.resolve) {
            txnModalState.resolve({ signature, vkey });
          }
          closeTxnModal();
          return { signature, vkey };
        }

        if (
          pendingTx.type === 'delegationTxn' ||
          pendingTx.type === 'submitMetadataTxn'
        ) {
          //submit transaction after signing
          const txHash = await walletApi.submitTx(signedTx.to_hex());
          if (txnModalState.resolve) {
            txnModalState.resolve({ resultHash: txHash });
          }
          closeTxnModal();
          return { resultHash: txHash };
        }
      } catch (error) {
        console.error('Wallet signing failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Wallet signing failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadUnsigned = async () => {
    setIsLoading(true);
    try {
      const { pendingTx } = txnModalState;
      let cborHex = '';
      let cliFormat: BodyToSign;

      switch (pendingTx.objectToSign) {
        case 'message':
          if (!pendingTx?.message) {
            throw new Error('Message not prepared');
          }
          cborHex = Buffer.from(pendingTx.message).toString('hex');
          cliFormat = cborHex;
          break;
        case 'transaction':
          if (!pendingTx?.transaction) {
            throw new Error('Transaction not prepared');
          }
          cborHex = pendingTx.transaction.to_hex();
          cliFormat = {
            type: 'Unwitnessed Tx ConwayEra',
            description: 'Ledger Cddl Format',
            cborHex,
          };
          break;
        default:
          throw new Error('Invalid object to sign');
      }

      const txJson = pendingTx.transaction
        ? pendingTx.transaction.to_json()
        : null;

      const blob = new Blob([JSON.stringify(cliFormat, null, 2)], {
        type:
          pendingTx.objectToSign === 'message'
            ? 'text/plain'
            : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const fileName =
        pendingTx?.objectToSign === 'message'
          ? `tx${Date.now()}.txt`
          : `tx${Date.now()}.draft`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setTxnModalState((prev) => ({
        ...prev,
        fileToDownload: fileName,
        txHash: pendingTx?.transaction ? pendingTx.transaction.to_hex() : '',
      }));

      return txJson;
    } catch (error) {
      console.error('Download unsigned transaction failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSignedTxFile = async (
    signedTxFile: File,
    walletApi: any,
  ) => {
    setIsLoading(true);
    try {
      const {
        pendingTx: { objectToSign },
      } = txnModalState;
      const fileContent = await signedTxFile.text();
      const content = JSON.parse(fileContent) as BodyAfterSign;
      let signedTx: Transaction;

      if (objectToSign === 'transaction') {
        signedTx = Transaction.from_hex(
          Buffer.from((content as TxBody).cborHex, 'hex').toString('hex'),
        );
      }

      if (txnModalState.resolve) {
        switch (txnModalState.type) {
          case 'loginViaMessageSigning':
            switch (objectToSign) {
              case 'message':
                const { COSE_Sign1_hex, COSE_Key_hex } =
                  content as MessageBodyAfterSign;
                txnModalState.resolve({
                  signature: COSE_Sign1_hex,
                  key: COSE_Key_hex,
                });
                break;
              case 'transaction':
                const { signature, vkey } =
                  signedTx.to_js_value().witness_set.vkeys[0];
                txnModalState.resolve({ signature, key: vkey });
                break;
              default:
                throw new Error('Invalid object to sign');
            }
            break;
          case 'loginViaExpiredTxnSigning':
            txnModalState.resolve(signedTx.to_js_value().witness_set.vkeys[0]);
            break;
          case 'delegationTxn':
          case 'submitMetadataTxn':
            try {
              const txHash = await walletApi.submitTx(signedTx.to_hex());
              txnModalState.resolve({ resultHash: txHash });
            } catch (error) {
              console.error('Submit signed transaction failed:', error);
              // Handle missing signatures error
              if (error.message?.includes('Some signatures are missing')) {
                const { missingSignatories } = JSON.parse(
                  error.message.split('Data: ')[1],
                );
                throw new Error(
                  `Transaction is missing signatures from: ${missingSignatories
                    .map((sig) => sig.slice(0, 8))
                    .join(', ')}`,
                );
              }
              if (
                error?.message.includes(
                  'The transaction references an unknown delegate representative',
                )
              ) {
                throw new Error(
                  'You most likely used a wrong DRep signature when signing the transaction',
                );
              }
              if (
                error.message?.includes(
                  'transaction is outside of its validity interval',
                )
              ) {
                throw new Error('Expired transaction');
              }
              throw error;
            }
            break;
          default:
            txnModalState.resolve(signedTx);
            break;
        }
      }

      closeTxnModal();
      return signedTx;
    } catch (error) {
      console.error('Submit signed transaction failed:', error);
      // Add error state to modal
      setTxnModalState((prev) => ({
        ...prev,
        error: error?.message || error,
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (
    walletApi: CardanoApiWallet,
    type: TxnTypes,
    params?: HandleTransactionParams,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
      objectToSign?: ObjectToSignType;
      message?: string;
    },
  ) => {
    try {
      setUserActionState({
        disableSigning: options?.disableSigning ?? false,
        disableDownload: options?.disableDownload ?? false,
      });

      const objectToSign = options?.objectToSign || 'transaction';

      const result = await openTxnModal(
        {
          type,
          objectToSign,
          message: options?.message,
          ...params,
        },
        walletApi,
        { deriveUtxosFrom: options?.deriveUtxosFrom },
      );
      return result;
    } catch (error) {
      console.error(`${type} transaction failed:`, error);
      throw error;
    }
  };

  return {
    txnModalState,
    userActionState,
    isLoading,
    handleTransaction,
    handleWalletSign,
    handleDownloadUnsigned,
    handleSubmitSignedTxFile,
    closeTxnModal,
  } as TransactionHandler;
}
