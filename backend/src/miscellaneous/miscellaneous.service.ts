import { HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { Currency } from 'src/common/enums';
import { BlockfrostBlockRes, Metrics, NodeBlockRes } from 'src/common/types';
import { getLatestBlock } from 'src/queries/getLatestBlock';
import {
  getActiveDRepsQuery,
  getTotalDelegatorsQuery,
  getTotalDrepsAndVotingPower,
  getTotalGovernanceActionsQuery,
} from 'src/queries/getMetricsQueries';
import { DataSource } from 'typeorm';
import { BlockfrostUTXO, DbSyncUTXO, StandardizedUTXO } from './misc.types';
import { getAddrUtxosQuery } from 'src/queries/getAddressUtxos';

@Injectable()
export class MiscellaneousService {
  constructor(
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
    private blockfrostService: BlockfrostService,
  ) {}
  async getFirstEpoch() {
    const epoch = await this.cexplorerService.manager.query(
      `SELECT * 
        FROM "epoch" 
        ORDER BY "start_time" ASC 
        LIMIT 1;`,
    );
    return epoch[0];
  }

  async checkTxExists(hash: string) {
    const tx = await this.cexplorerService.manager.query(
      `SELECT id, SUBSTRING(CAST(tx.hash AS TEXT) FROM 3) AS tx_hash 
       FROM "tx" 
       WHERE "hash" = decode($1, 'hex');`,
      [hash],
    );

    return tx[0]?.tx_hash ? true : false;
  }
  async getNodeStatus() {
    try {
      const nodeLatestBlock: [NodeBlockRes] =
        await this.cexplorerService.manager.query(getLatestBlock);
      //compare with the latest block from a blockfrost API or any other API
      const confirmationLatestBlock: BlockfrostBlockRes =
        await this.blockfrostService.getLatestBlock();
      //compare the block number
      return {
        ...nodeLatestBlock[0],
        behindBy: confirmationLatestBlock.height - nodeLatestBlock[0].block_no,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to get the node sync tip status', 500);
    }
  }
  async getMetrics(): Promise<Metrics> {
    try {
      const [
        drepMetricsForAllDReps,
        totalActiveDReps,
        totalDelegators,
        totalGovernanceActions,
      ] = await Promise.all([
        this.cexplorerService.manager.query(getTotalDrepsAndVotingPower),
        this.cexplorerService.manager.query(getActiveDRepsQuery),
        this.cexplorerService.manager.query(getTotalDelegatorsQuery),
        this.cexplorerService.manager.query(getTotalGovernanceActionsQuery),
      ]);

      const metrics: Metrics = {
        totalRegisteredDReps: parseInt(drepMetricsForAllDReps[0].total_dreps),
        totalActiveDReps: parseInt(totalActiveDReps[0].total_active_dreps),
        totalGovernanceActions: parseInt(totalGovernanceActions[0].count),
        totalVotingPower:
          parseInt(drepMetricsForAllDReps[0].total_active_power) /
          Currency.LOVELACETOADA, // convert to ADA
        totalRegisteredStakeAddresses: parseInt(
          totalDelegators[0].total_delegators,
        ),
      };

      return metrics;
    } catch (error) {
      throw new HttpException(
        error?.message || error || 'An error occured',
        500,
      );
    }
  }

  transformDbSyncUtxos(dbUtxos: DbSyncUTXO[]): BlockfrostUTXO[] {
    return dbUtxos.map((utxo) => {
      // Convert Buffer hash to hex string
      const txHash = utxo.hash;

      return {
        address: utxo.address,
        tx_hash: txHash,
        output_index: utxo.index,
        amount: [
          {
            unit: 'lovelace',
            quantity: utxo.value,
          },
        ],
        block: utxo.block_id.toString(),
        data_hash: utxo.data_hash,
        inline_datum: null,
        reference_script_hash: null,
      };
    });
  }

  async getAddressUtxos(address: string): Promise<StandardizedUTXO[]> {
    try {
      // First query blockfrost to get the utxos
      const utxos = await this.blockfrostService.getAddressUtxos(address);
      return utxos;
    } catch (error) {
      // Try fetching from the local database
      try {
        const dbUtxos = (await this.cexplorerService.manager.query(
          getAddrUtxosQuery,
          [address],
        )) as DbSyncUTXO[];

        // Transform db response to match Blockfrost format
        return this.transformDbSyncUtxos(dbUtxos);
      } catch (dbError) {
        console.log(dbError);
        throw new HttpException(
          dbError?.message || dbError || 'An error occurred',
          500,
        );
      }
    }
  }
}
