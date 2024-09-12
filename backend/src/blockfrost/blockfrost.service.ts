import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BlockfrostService {
  blockfrostAPIURL: string;
  blockfrostAPIProjectID: string;
  blockfrostIPFSURL: string;
  blockfrostIPFSProjectID: string;
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    //use the external blockfrost API to fetch data(fallback) before the local blockfrost API is ready
    this.blockfrostAPIURL =
      this.configService.get<string>('BLOCKFROST_NETWORK_URL_FALLBACK') ||
      this.configService.get<string>('BLOCKFROST_NETWORK_URL');
    this.blockfrostAPIProjectID =
      this.configService.get<string>(
        'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK',
      ) || this.configService.get<string>('BLOCKFROST_NETWORK_PROJECT_ID');
    this.blockfrostIPFSURL =
      this.configService.get<string>('BLOCKFROST_IPFS_URL_FALLBACK') ||
      this.configService.get<string>('BLOCKFROST_IPFS_URL');
    this.blockfrostIPFSProjectID =
      this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID_FALLBACK') ||
      this.configService.get<string>('BLOCKFROST_IPFS_PROJECT_ID');
  }
  async getLatestBlock() {
    try {
      //fetch the latest block from blockfrost API
      const apiUrl = `${this.blockfrostAPIURL}/api/v0/blocks/latest`;
      const response = await axios.get(apiUrl, {
        headers: {
          project_id: this.blockfrostAPIProjectID,
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

  async getLatestEpoch() {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/api/v0/epochs/latest`;
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
  async getEpochParameters() {
    try {
      const apiUrl = `${this.blockfrostAPIURL}/api/v0/epochs/latest/parameters`;
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
}
