import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { BlockfrostBlockRes, Metrics } from 'src/common/types';

import {
  BlockfrostUTXO,
  DbSyncUTXO,
  StandardizedUTXO,
} from './misc.types';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { IpfsService } from 'src/ipfs/ipfs.service';
@Injectable()
export class MiscellaneousService {
  private readonly IPFS_GATEWAYS = ['ipfs.io', 'dweb.link'];
  constructor(
    @InjectDataSource('default')
    private readonly voltaireDb: DataSource,
    private blockfrostService: BlockfrostService,
    private ipfsService: IpfsService,
    private httpService: HttpService,
  ) { }
  async getFirstEpoch() {
    try {
      return await this.blockfrostService.getLatestEpoch();
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to get first epoch data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkTxExists(hash: string) {
    try {
      await this.blockfrostService.getTransaction(hash);
      return true;
    } catch (error) {
      return false;
    }
  }



  async getProposalMetadataByHash(hash: string) {
    // Use Blockfrost to get proposal metadata
    try {
      const proposals = await this.blockfrostService.getAllProposals();
      const proposal = proposals.find((p) => p.tx_hash === hash);

      if (!proposal) {
        return null;
      }

      // Try to get metadata for the specific proposal
      const metadata = await this.blockfrostService.getProposalMetadata(
        proposal.tx_hash,
        proposal.cert_index,
      );
      return metadata;
    } catch (error) {
      console.log(error);
      throw new HttpException('Failed to get the proposal metadata', 500);
    }
  }

  async fetchExternalMetadata(url: string) {
    try {
      const urlProtocol = this.getUrlProtocol(url);

      switch (urlProtocol) {
        case 'ipfs':
          const ipfsHash = url.replace('ipfs://', '');
          return await this.ipfsService.getIPFSContent(ipfsHash);

        case 'http':
        case 'https':
          const { isIPFS, hash } = this.isIPFSUrl(url);
          if (isIPFS && hash) {
            return this.fetchWithIPFSFallback(url);
          }
          const { data } = await firstValueFrom(
            this.httpService.get(url).pipe(
              catchError((err) => {
                console.log(err);
                throw new HttpException('Failed to fetch  metadata', 500);
              }),
            ),
          );
          return data;

        default:
          throw new HttpException(
            `Unsupported URL protocol: ${urlProtocol}`,
            400,
          );
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.message || error || 'An error occurred',
        500,
      );
    }
  }

  private async tryIPFSGateways(hash: string, res: Response): Promise<any> {
    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
    ];

    const requests = gateways.map((url) =>
      this.httpService.axiosRef
        .get(url, {
          responseType: 'stream',
          timeout: 3000,
        })
        .catch((e) => e),
    );

    const responses = await Promise.all(requests);
    const successfulResponse = responses.find((r) => !(r instanceof Error));

    if (successfulResponse) {
      res.setHeader('Content-Type', successfulResponse.headers['content-type']);
      return successfulResponse.data.pipe(res);
    }

    throw new HttpException('All IPFS gateways failed', HttpStatus.BAD_GATEWAY);
  }

  async getMedia(res: Response, assetUrl?: string) {
    if (!assetUrl) {
      throw new HttpException('Asset URL is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { isIPFS, hash } = this.isIPFSUrl(assetUrl);

      if (isIPFS && hash) {
        return await this.tryIPFSGateways(hash, res);
      }

      // If not IPFS, proceed with original direct fetch
      const response = await this.httpService.axiosRef.get(assetUrl, {
        responseType: 'stream',
      });
      res.setHeader('Content-Type', response.headers['content-type']);
      return response.data.pipe(res);
    } catch (error) {
      console.error('Error fetching media:', error);
      throw new HttpException(
        'Failed to fetch media',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private isIPFSUrl(url: string): { isIPFS: boolean; hash?: string } {
    try {
      // Check ipfs:// protocol
      if (url.startsWith('ipfs://')) {
        const hash = url.replace('ipfs://', '').split('/')[0];
        return { isIPFS: true, hash };
      }

      const urlObj = new URL(url);

      // Check for ipfs.io and dweb.link gateways
      if (this.IPFS_GATEWAYS.includes(urlObj.hostname)) {
        const pathParts = urlObj.pathname.split('/');
        const ipfsIndex = pathParts.findIndex((part) => part === 'ipfs');
        if (ipfsIndex !== -1 && pathParts[ipfsIndex + 1]) {
          return { isIPFS: true, hash: pathParts[ipfsIndex + 1] };
        }
      }

      return { isIPFS: false };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return { isIPFS: false };
    }
  }

  async fetchWithIPFSFallback(url: string): Promise<any> {
    const { isIPFS, hash } = this.isIPFSUrl(url);

    if (isIPFS && hash) {
      const gatewayUrls = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
      ];

      const requests = gatewayUrls.map((gatewayUrl) =>
        firstValueFrom(
          this.httpService.get(gatewayUrl, { timeout: 3000 }).pipe(
            catchError((error) => {
              throw new Error(
                `Failed to fetch from ${gatewayUrl}: ${error.message}`,
              );
            }),
          ),
        ),
      );

      try {
        const results = await Promise.allSettled(requests);

        const firstSuccess = results.find(
          (result) => result.status === 'fulfilled',
        );

        if (firstSuccess && firstSuccess.status === 'fulfilled') {
          return firstSuccess.value.data;
        }

        const errors = results
          .filter((result) => result.status === 'rejected')
          .map((result) => (result as PromiseRejectedResult).reason.message);

        throw new Error(`All IPFS gateways failed: ${errors.join(', ')}`);
      } catch (error) {
        throw new Error('All IPFS gateways failed');
      }
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
      // Use enhanced dreps table and other local tables for metrics
      const [
        totalRegisteredDReps,
        totalActiveDReps,
        totalVotingPower,
        totalDelegators,
        totalProposals,
      ] = await Promise.all([
        this.voltaireDb.query('SELECT COUNT(*) as count FROM dreps'),
        this.voltaireDb.query(
          'SELECT COUNT(*) as count FROM dreps WHERE active = true AND retired = false',
        ),
        this.voltaireDb.query(
          'SELECT SUM(COALESCE(voting_power_ada::numeric, 0)) as total FROM dreps WHERE active = true',
        ),
        this.voltaireDb.query(
          'SELECT COUNT(DISTINCT stake_address) as count FROM drep_delegators',
        ),
        this.voltaireDb.query('SELECT COUNT(*) as count FROM proposals'),
      ]);

      const metrics: Metrics = {
        totalRegisteredDReps: parseInt(totalRegisteredDReps[0]?.count || '0'),
        totalActiveDReps: parseInt(totalActiveDReps[0]?.count || '0'),
        totalLiveStake: parseFloat(totalVotingPower[0]?.total || '0'), // Already in ADA from enhanced table
        totalProposals: parseInt(totalProposals[0]?.count || '0'),
        totalVotingPower: parseFloat(totalVotingPower[0]?.total || '0'), // Already in ADA from enhanced table
        totalRegisteredStakeAddresses: parseInt(
          totalDelegators[0]?.count || '0',
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
      // Use Blockfrost to get the utxos
      const utxos = await this.blockfrostService.getAddressUtxos(address);
      return utxos;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.message || error || 'Failed to fetch UTXOs',
        500,
      );
    }
  }

  async getAddressesRelatedToStakeAddress(
    stakeAddress: string,
  ): Promise<string[]> {
    try {
      const addresses =
        await this.blockfrostService.getAddressesRelatedToStakeAddress(
          stakeAddress,
        );
      return Array.isArray(addresses)
        ? addresses.map((address) => address.address)
        : [];
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.message || error || 'An error occurred',
        500,
      );
    }
  }
  async submitTx(txCbor: string) {
    try {
      const txHash = await this.blockfrostService.submitTransaction(txCbor);
      return txHash;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.message || error || 'An error occurred',
        500,
      );
    }
  }
}
