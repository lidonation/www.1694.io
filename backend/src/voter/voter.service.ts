import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DrepService } from 'src/drep/drep.service';
import { getDrepAddrData } from 'src/queries/drepAddrData';
import { getAddrDataQuery } from 'src/queries/getAddrData';
import { getStakeKeyData } from 'src/queries/getStakeKeyData';
import { getVoterDelegationHistory } from 'src/queries/getVoterDelegationHistory';
import { DataSource } from 'typeorm';

@Injectable()
export class VoterService {
  constructor(
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
  ) {}
  async getVoter(voterIdentity: string) {
    let voterData;
    let delegationHistory;
    switch (true) {
      case voterIdentity.includes('drep'):
        voterData = await this.cexplorerService.manager.query(getDrepAddrData, [
          voterIdentity,
        ]);
        delegationHistory = await this.cexplorerService.manager.query(
          getVoterDelegationHistory,
          [voterData[0].stake_address],
        );
        break;
      case voterIdentity.includes('stake'):
        voterData = await this.cexplorerService.manager.query(getStakeKeyData, [
          voterIdentity,
        ]);
        delegationHistory = await this.cexplorerService.manager.query(
          getVoterDelegationHistory,
          [voterIdentity],
        );
        break;
      default:
        voterData = await this.cexplorerService.manager.query(
          getAddrDataQuery,
          [voterIdentity],
        );
        delegationHistory = await this.cexplorerService.manager.query(
          getVoterDelegationHistory,
          [voterData[0].stake_address],
        );
        break;
    }

    return Array.isArray(voterData) ? {
      ...voterData[0],
      delegationHistory,
      isDelegated: delegationHistory.length > 0,
    } : null;
  }
  async getAdaHolderCurrentDelegation(stakeKey: string) {
    const delegation = await this.cexplorerService.manager.query(
      `SELECT
          CASE
              WHEN drep_hash.raw IS NULL THEN NULL
              ELSE ENCODE(drep_hash.raw, 'hex')
          END AS drep_raw,
          drep_hash.view AS drep_view,
          ENCODE(tx.hash, 'hex')
      FROM
          delegation_vote
      JOIN
          tx ON tx.id = delegation_vote.tx_id
      JOIN
          drep_hash ON drep_hash.id = delegation_vote.drep_hash_id
      JOIN
          stake_address ON stake_address.id = delegation_vote.addr_id
      WHERE
          stake_address.hash_raw = DECODE('${stakeKey}', 'hex')
          AND NOT EXISTS (
              SELECT *
              FROM delegation_vote AS dv2
              WHERE dv2.addr_id = delegation_vote.addr_id
                AND dv2.tx_id > delegation_vote.tx_id
          )
      LIMIT 1;`,
    );
    return delegation[0];
  }
}
