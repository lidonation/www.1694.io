import { Utxos } from '@/context/walletContext';
import { CardanoApiWallet, Protocol, TxBody } from '@/models/wallet';
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
} from '@emurgo/cardano-serialization-lib-asmjs';
import { useCallback, useState } from 'react';
import { useGetNodeStatusQuery } from './useGetNodeStatusQuery';
import { getItemFromLocalStorage } from '@/lib';
import { getAddressUtxos } from '@/services/requests/getAddressUtxos';

interface GetUtxosOptions {
  address?: string;
  external?: boolean;
}
interface TxnModalState {
  isOpen: boolean;
  pendingTx: PendingTransaction | null;
  txHash?: string;
  resolve: ((value: any) => void) | null;
  reject: ((reason?: any) => void) | null;
  type: 'login' | 'hardwareWallet' | 'regular';
  error?: string;
}

interface PendingTransaction {
  type: 'login' | 'hardwareWallet' | 'regular';
  txBuilder?: any;
  certBuilder?: any;
  dRepId?: string;
  transaction?: Transaction;
}

interface TransactionHandlerProps {
  walletState: {
    changeAddress: undefined | string;
    usedAddress: undefined | string;
    balance: number | undefined;
  };
}
export const DEFAULT_TXN_TTL = 30 * 60; // 30 minutes
export function useTransactionHandler({
  walletState,
}: TransactionHandlerProps) {
  const [txnModalState, setTxnModalState] = useState<TxnModalState>({
    isOpen: false,
    pendingTx: null,
    txHash: '',
    resolve: null,
    reject: null,
    type: 'regular',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userActionState, setUserActionState] = useState({
    disableDownload: false,
    disableSigning: false,
  });

  const { refetch } = useGetNodeStatusQuery({ disablePolling: true });

  const getUtxos = async (
    enabledApi: CardanoApiWallet,
    options?: GetUtxosOptions,
  ): Promise<Utxos | undefined> => {
    let rawUtxos;

    try {
      if (options?.external && options?.address) {
        console.log('Fetching UTXOs from blockfrost');
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
        console.log('Fetching UTXOs from wallet');
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

  const buildDummyTx = async (
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

      const shelleyOutputAddress = Address.from_bech32(
        options?.deriveUtxosFrom || walletState.usedAddress,
      );
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
      const currentSlot = parseInt(currentNodeStatus?.slot_no);
      const ttl = currentSlot + DEFAULT_TXN_TTL;

      const dummyTxBuilder = TransactionBuilder.new(
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
        const newCertBuilder =
          certBuilder instanceof Certificate
            ? (() => {
                const builder = CertificatesBuilder.new();
                builder.add(certBuilder);
                return builder;
              })()
            : certBuilder;
        dummyTxBuilder.set_certs_builder(newCertBuilder);
      }
      
      dummyTxBuilder.set_ttl_bignum(BigNum.from_str(ttl.toString()));
      // dummyTxBuilder.add_output(
      //   TransactionOutput.new(
      //     shelleyOutputAddress,
      //     Value.new(BigNum.from_str('1000000')),
      //   ),
      // );
      // dummyTxBuilder.add_inputs_from(txUnspentOutputs, 1);
      // dummyTxBuilder.add_change_if_needed(shelleyChangeAddress);

      const changeConfig = ChangeConfig.new(shelleyChangeAddress);
      // Use UTxO selection strategy 3
      try {
        dummyTxBuilder.add_inputs_from_and_change(
          txUnspentOutputs,
          3,
          changeConfig,
        );
      } catch (e) {
        console.error(e);
        // Use UTxO selection strategy 2 if strategy 3 fails
        dummyTxBuilder.add_inputs_from_and_change(
          txUnspentOutputs,
          2,
          changeConfig,
        );
      }

      const dummyBody = dummyTxBuilder.build();
      const txSize = dummyBody.to_bytes().length;
      return { dummyBody, txSize };
    } catch (error) {
      console.error('Error building dummy transaction:', error);
      throw error;
    }
  };

  const buildFinalTx = async (
    walletApi: CardanoApiWallet,
    certBuilder?: any,
    // dummyTxSize?: number,
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

      // const shelleyOutputAddress = Address.from_bech32(
      //   options?.deriveUtxosFrom || walletState.usedAddress,
      // );
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
      const currentSlot = parseInt(currentNodeStatus?.slot_no);
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
        const newCertBuilder =
          certBuilder instanceof Certificate
            ? (() => {
                const builder = CertificatesBuilder.new();
                builder.add(certBuilder);
                return builder;
              })()
            : certBuilder;
        finalTxBuilder.set_certs_builder(newCertBuilder);
      }
      finalTxBuilder.set_ttl_bignum(BigNum.from_str(ttl.toString()));

      // finalTxBuilder.add_output(
      //   TransactionOutput.new(
      //     shelleyOutputAddress,
      //     Value.new(BigNum.from_str('1000000')),
      //   ),
      // );
      // const baseMinFee = BigNum.from_str(
      //   String(protocolParams.min_fee_a),
      // ).checked_mul(BigNum.from_str(dummyTxSize.toString()));
      // const constantFee = BigNum.from_str(String(protocolParams.min_fee_b));
      // const buffer = BigNum.from_str('10000');
      // const totalFee = baseMinFee.checked_add(constantFee).checked_add(buffer);
      // finalTxBuilder.set_fee(totalFee);
      // finalTxBuilder.add_inputs_from(txUnspentOutputs, 1);
      // finalTxBuilder.add_change_if_needed(shelleyChangeAddress);

      const changeConfig = ChangeConfig.new(shelleyChangeAddress);
      // Use UTxO selection strategy 3
      try {
        finalTxBuilder.add_inputs_from_and_change(
          txUnspentOutputs,
          3,
          changeConfig,
        );
      } catch (e) {
        console.error(e);
        // Use UTxO selection strategy 2 if strategy 3 fails
        finalTxBuilder.add_inputs_from_and_change(
          txUnspentOutputs,
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
  ): Promise<{ transaction?: Transaction; dRepId?: string }> => {
    try {
      if (pendingTx.type === 'login') return { dRepId: pendingTx.dRepId };
      if (pendingTx.type === 'hardwareWallet') {
        if (!pendingTx.txBuilder || !walletApi)
          throw new Error('Arguments not ready');
        return prepExpiredTxn(pendingTx.txBuilder, walletApi);
      }

      if (pendingTx.type === 'regular') {
        // a problem wirh fee calculation, resulted in this attempt to get the fee from the dummy transaction
        // const { txSize } = await buildDummyTx(
        //   walletApi,
        //   pendingTx.certBuilder,
        //   options,
        // );
        const { transaction } = await buildFinalTx(
          walletApi,
          pendingTx.certBuilder,
          // txSize,
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
      const preparedTx = await prepareTxBody(pendingTx, walletApi, options);

      return new Promise((resolve, reject) => {
        setTxnModalState((prev) => ({
          ...prev,
          isOpen: true,
          pendingTx: { ...pendingTx, ...preparedTx },
          resolve,
          reject,
          type: pendingTx.type,
        }));
      });
    } catch (error) {
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
      pendingTx: null,
      txHash: '',
      resolve: null,
      reject: null,
      type: 'regular',
    });
    setIsLoading(false);
  };

  const handleWalletSign = async (walletApi: any) => {
    setIsLoading(true);
    try {
      const { pendingTx } = txnModalState;

      if (pendingTx.type === 'login') {
        const payloadBuffer = Buffer.from(`Verify DRep`).toString('hex');
        const signResult = await walletApi.signData(
          pendingTx.dRepId,
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
        if (pendingTx.type === 'hardwareWallet') {
          const { signature, vkey } = JSON.parse(
            signedTx.witness_set().vkeys().get(0).to_json(),
          );

          if (txnModalState.resolve) {
            txnModalState.resolve({ signature, vkey });
          }
          closeTxnModal();
          return { signature, vkey };
        }

        if (pendingTx.type === 'regular') {
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

      if (!pendingTx?.transaction) {
        throw new Error('Transaction not prepared');
      }

      const txJson = pendingTx.transaction.to_json();

      const cliFormat: TxBody = {
        type: 'Unwitnessed Tx ConwayEra',
        description: 'Ledger Cddl Format',
        cborHex: pendingTx.transaction.to_hex(),
      };

      const blob = new Blob([JSON.stringify(cliFormat, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tx${Date.now()}.draft`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setTxnModalState((prev) => ({
        ...prev,
        txHash: pendingTx.transaction.to_hex(),
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
      const fileContent = await signedTxFile.text();
      const cborHex = (JSON.parse(fileContent) as TxBody).cborHex;
      const signedTx = Transaction.from_hex(
        Buffer.from(cborHex, 'hex').toString('hex'),
      );

      if (txnModalState.resolve) {
        switch (txnModalState.type) {
          case 'login':
            txnModalState.resolve(signedTx.to_json());
            break;
          case 'hardwareWallet':
            txnModalState.resolve(signedTx.to_js_value().witness_set.vkeys[0]);
            break;
          case 'regular':
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
    type: 'login' | 'hardwareWallet' | 'regular',
    params?: any,
    options?: {
      disableSigning?: boolean;
      disableDownload?: boolean;
      deriveUtxosFrom?: string;
    },
  ) => {
    try {
      setUserActionState({
        disableSigning: options?.disableSigning ?? false,
        disableDownload: options?.disableDownload ?? false,
      });

      setTxnModalState((prev) => ({
        ...prev,
        type,
      }));

      const result = await openTxnModal(
        {
          type,
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
  };
}
