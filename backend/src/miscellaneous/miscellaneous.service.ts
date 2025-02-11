import { HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { Currency } from 'src/common/enums';
import { BlockfrostBlockRes, Metrics, NodeBlockRes } from 'src/common/types';
import { getLatestBlock } from 'src/queries/getLatestBlock';
import {
  getActiveDRepsQuery,
  getLiveStakeQuery,
  getTotalDelegatorsQuery,
  getTotalDrepsAndVotingPower,
  getTotalGovernanceActionsQuery,
} from 'src/queries/getMetricsQueries';
import { DataSource } from 'typeorm';
import {
  BlockfrostUTXO,
  DbSyncUTXO,
  ProposalByHashDetails,
  StandardizedUTXO,
} from './misc.types';
import { getAddrUtxosQuery } from 'src/queries/getAddressUtxos';
import { proposalMetadataByHash } from 'src/queries/proposalMetadataByHash';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MiscellaneousService {
  constructor(
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
    private blockfrostService: BlockfrostService,
    private httpService: HttpService,
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
        comparedLatestSlotNo: confirmationLatestBlock.slot,
        behindBy: confirmationLatestBlock.height - nodeLatestBlock[0].block_no,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to get the node sync tip status', 500);
    }
  }

  async getProposalMetadataByHash(hash: string) {
    //assumption is that native dbsync has failed parsing the metadata, thus try fetching it ourselves
    try {
      const proposal = (await this.cexplorerService.manager.query(
        proposalMetadataByHash,
        [hash],
      )) as ProposalByHashDetails[];

      if (!proposal?.[0]) {
        return null;
      }
  
      const url = proposal[0].url;
      const urlProtocol = this.getUrlProtocol(url);
  
      switch (urlProtocol) {
        case 'ipfs': {
          const ipfsHash = url.replace('ipfs://', '');
          return await this.blockfrostService.getIPFSContent(ipfsHash);
        }
        
        case 'http':
        case 'https': {
          const { data } = await firstValueFrom(
            this.httpService.get(url).pipe(
              catchError(() => {
                throw new HttpException('Failed to fetch the proposal metadata', 500);
              }),
            ),
          );
          return data;
        }
  
        default:
          throw new HttpException(`Unsupported URL protocol: ${urlProtocol}`, 400);
      }
    } catch (error) {
      throw new HttpException(
        error?.message || error || 'An error occurred',
        500,
      );
    }
  }
  
  private getUrlProtocol(url: string): string {
    const protocolMatch = url.match(/^([a-zA-Z]+):\/\//);
    if (!protocolMatch) {
      throw new HttpException('Invalid URL format: no protocol specified', 400);
    }
    return protocolMatch[1].toLowerCase();
  }

  async getMetrics(): Promise<Metrics> {
    try {
      const [
        drepMetricsForAllDReps,
        totalActiveDReps,
        totalDelegators,
        totalGovernanceActions,
        totalLiveStake,
      ] = await Promise.all([
        this.cexplorerService.manager.query(getTotalDrepsAndVotingPower),
        this.cexplorerService.manager.query(getActiveDRepsQuery),
        this.cexplorerService.manager.query(getTotalDelegatorsQuery),
        this.cexplorerService.manager.query(getTotalGovernanceActionsQuery),
        this.cexplorerService.manager.query(getLiveStakeQuery),
      ]);

      const metrics: Metrics = {
        totalRegisteredDReps: parseInt(drepMetricsForAllDReps[0].total_dreps),
        totalActiveDReps: parseInt(totalActiveDReps[0].total_active_dreps),
        totalLiveStake:
          parseInt(totalLiveStake[0].total_live_stake) / Currency.LOVELACETOADA, // convert to ADA
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
      const txHash = utxo.hash;

      const amount = [
        {
          unit: 'lovelace',
          quantity: utxo.value,
        },
      ];

      if (utxo.tokens && utxo.tokens.length > 0) {
        const validTokens = utxo.tokens.filter((token) => token !== null);
        amount.push(...validTokens);
      }

      return {
        address: utxo.address,
        tx_hash: txHash,
        output_index: utxo.index,
        amount,
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
