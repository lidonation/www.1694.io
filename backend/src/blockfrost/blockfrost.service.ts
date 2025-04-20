import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';
import { BlockfrostUTXO } from 'src/miscellaneous/misc.types';

@Injectable()
export class BlockfrostService {
  blockfrostAPIURL: string;
  blockfrostAPIProjectID: string;
  blockfrostIPFSURL: string;
  blockfrostIPFSProjectID: string;
  blockfrostAPIFallbackURL: string;
  blockfrostAPIFallbackProjectID: string;
  blockfrostIPFSFallbackURL: string;
  blockfrostIPFSFallbackProjectID: string;
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    //use the external blockfrost API to fetch data(fallback) before the local blockfrost API is ready
    this.blockfrostAPIURL = this.configService.get<string>(
      'BLOCKFROST_NETWORK_URL',
    );
    this.blockfrostAPIFallbackURL = this.configService.get<string>(
      'BLOCKFROST_NETWORK_URL_FALLBACK',
    );
    this.blockfrostAPIFallbackProjectID = this.configService.get<string>(
      'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK',
    );
    this.blockfrostAPIProjectID = this.configService.get<string>(
      'BLOCKFROST_NETWORK_PROJECT_ID',
    );
    this.blockfrostIPFSFallbackURL = this.configService.get<string>(
      'BLOCKFROST_IPFS_URL_FALLBACK',
    );
    this.blockfrostIPFSURL = this.configService.get<string>(
      'BLOCKFROST_IPFS_URL',
    );
    this.blockfrostIPFSFallbackProjectID = this.configService.get<string>(
      'BLOCKFROST_IPFS_PROJECT_ID_FALLBACK',
    );
    this.blockfrostIPFSProjectID = this.configService.get<string>(
      'BLOCKFROST_IPFS_PROJECT_ID',
    );
  }
  async getLatestBlock() {
    try {
      //fetch the latest block from external blockfrost API
      const apiUrl = `${this.blockfrostAPIFallbackURL}/blocks/latest`; //use the fallback API
      const response = await axios.get(apiUrl, {
        headers: {
          project_id: this.blockfrostAPIFallbackProjectID, //use the fallback project ID
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || 500,
      );
    }
  }

  async getIPFSContent(ipfsHash: string) {
    try {
      // Try primary IPFS endpoint
      const primaryUrl = `${this.blockfrostIPFSURL}/ipfs/gateway/${ipfsHash}`;
      const primaryResponse = await lastValueFrom(
        this.httpService.get(primaryUrl, {
          headers: {
            project_id: this.blockfrostIPFSProjectID,
          },
        }),
      ).catch((primaryError) => {
        console.log(
          'Primary IPFS endpoint failed, trying fallback:',
          primaryError.message,
        );
        // If primary fails, try fallback
        const fallbackUrl = `${this.blockfrostIPFSFallbackURL}/ipfs/gateway/${ipfsHash}`;
        return lastValueFrom(
          this.httpService.get(fallbackUrl, {
            headers: {
              project_id: this.blockfrostIPFSFallbackProjectID,
            },
          }),
        );
      });

      return primaryResponse.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'Failed to fetch IPFS content',
        error?.response?.status || 500,
      );
    }
  }

  async getLatestEpoch() {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/epochs/latest`;
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            project_id: this.blockfrostAPIProjectID,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || 500,
      );
    }
  }

  async getAddressUtxos(address: string) {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/addresses/${address}/utxos`;
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            project_id: this.blockfrostAPIProjectID,
          },
        }),
      );
      return response.data as BlockfrostUTXO[];
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || 500,
      );
    }
  }
  async getEpochParameters() {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/epochs/latest/parameters`;
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            project_id: this.blockfrostAPIProjectID,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || 500,
      );
    }
  }

  async getStakeAddressInfo(stakeAddress: string) {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/accounts/${stakeAddress}`
      const response = await lastValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            project_id: this.blockfrostAPIProjectID,
          }
        })
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || 500,
      )
    }
  }
}
