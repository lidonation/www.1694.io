import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Delegation, VoterData } from 'src/common/types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';

@Injectable()
export class VoterService {
  constructor(
    @InjectDataSource('default')
    private readonly voltaireDb: DataSource,
    private readonly blockfrostService: BlockfrostService,
  ) { }
  async getVoter(voterIdentity: string): Promise<VoterData> {
    try {
      let voterData: any;
      let delegationHistory: any[] = [];

      if (voterIdentity.includes('drep')) {
        // Get DRep data from enhanced dreps table
        const drepData = await this.voltaireDb.query(
          'SELECT * FROM dreps WHERE drep_id = $1',
          [voterIdentity]
        );



        if (!drepData || drepData.length === 0) {
          // Fallback: try to fetch from Blockfrost
          try {
            const blockfrostDrep = await this.blockfrostService.getDRepInfo(voterIdentity);
            if (!blockfrostDrep) {
              throw new HttpException('DRep not found!', HttpStatus.NOT_FOUND);
            }

            // Get metadata if available
            let metadata = null;
            try {
              metadata = await this.blockfrostService.getDRepMetadata(voterIdentity);
            } catch (metadataError) {
              // Metadata is optional, continue without it
            }

            // Return DRep data from Blockfrost
            voterData = {
              address: metadata?.json_metadata?.body?.paymentAddress || null,
              total_stake: parseFloat(blockfrostDrep.amount || '0') / 1000000, // Convert from lovelace
              drep_id: blockfrostDrep.drep_id,
              stake_address: metadata?.json_metadata?.body?.paymentAddress || null,
              given_name: metadata?.json_metadata?.body?.givenName || null,
              active: blockfrostDrep.active,
              retired: blockfrostDrep.retired,
            };

            // No delegation history available for non-synced DReps
            delegationHistory = [];

            return {
              ...voterData,
              delegationHistory,
              isDelegated: false,
            };

          } catch (blockfrostError) {
            throw new HttpException('DRep not found!', HttpStatus.NOT_FOUND);
          }
        }

        const drep = drepData[0];

        // Get delegators for this DRep
        const delegators = await this.voltaireDb.query(
          'SELECT stake_address, amount_lovelace, updated_at FROM drep_delegators WHERE drep_id = $1 ORDER BY updated_at DESC',
          [voterIdentity]
        );

        voterData = {
          address: drep.metadata?.json_metadata?.body?.paymentAddress || null,
          total_stake: parseFloat(drep.voting_power_ada || '0'),
          drep_id: drep.drep_id,
          stake_address: drep.metadata?.json_metadata?.body?.paymentAddress || null,
          given_name: drep.metadata?.json_metadata?.body?.givenName || null,
          active: drep.active,
          retired: drep.retired,
        };

        delegationHistory = delegators.map(d => ({
          stake_address: d.stake_address,
          amount: d.amount_lovelace,
          timestamp: d.updated_at,
          type: 'delegation'
        }));

      } else if (voterIdentity.includes('stake')) {
        // Get stake address info from Blockfrost
        try {
          const stakeInfo = await this.blockfrostService.getStakeAddressInfo(voterIdentity);

          // Get delegation info from the timeline to get full history
          const delegationData = await this.voltaireDb.query(
            `SELECT tle.target_drep as drep_id, tle.current_voting_power_lovelace as amount_lovelace, tle.timestamp as updated_at, d.metadata->'json_metadata'->'body'->>'givenName' as given_name
             FROM timeline_delegations_enriched tle
             LEFT JOIN dreps d ON d.drep_id = tle.target_drep
             WHERE tle.stake_address = $1
             ORDER BY tle.timestamp DESC`,
            [voterIdentity]
          );

          voterData = {
            address: voterIdentity,
            total_stake: parseFloat(stakeInfo?.controlled_amount || '0') / 1000000, // Convert from lovelace
            drep_id: delegationData[0]?.drep_id || null, // Most recent delegation
            stake_address: voterIdentity,
          };

          delegationHistory = delegationData.map((d: any) => ({
            drep_id: d.drep_id,
            drep_name: d.given_name,
            amount: d.amount_lovelace,
            timestamp: d.updated_at,
            type: 'delegation'
          }));

        } catch (blockfrostError) {
          console.error('Blockfrost error:', blockfrostError);
          return null;
        }

      } else {
        // For regular addresses, try to get related stake addresses
        try {
          const relatedAddresses = await this.blockfrostService.getAddressesRelatedToStakeAddress(voterIdentity);

          if (relatedAddresses && relatedAddresses.length > 0) {
            // Use the first related stake address
            const stakeAddress = relatedAddresses[0].address;
            return this.getVoter(stakeAddress);
          }

          return null;
        } catch (blockfrostError) {
          console.error('Blockfrost error for address:', blockfrostError);
          return null;
        }
      }

      return {
        ...voterData,
        delegationHistory,
        isDelegated: delegationHistory.length > 0,
      };

    } catch (error) {
      console.error('Error getting voter data:', error);
      throw new HttpException(
        'Failed to fetch voter data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getAdaHolderCurrentDelegation(stakeKey: string): Promise<Delegation> {
    if (!stakeKey) return null;

    try {

      const delegationData = await this.voltaireDb.query(
        `SELECT dd.drep_id, d.metadata->'json_metadata'->'body'->>'givenName' as given_name, d.voting_power_ada, d.has_script
         FROM drep_delegators dd
         LEFT JOIN dreps d ON d.drep_id = dd.drep_id
         WHERE dd.stake_address = $1
         ORDER BY dd.updated_at DESC
         LIMIT 1`,
        [stakeKey]
      );

      if (!delegationData || delegationData.length === 0) {
        return null;
      }

      const delegation = delegationData[0];
      return {
        drep_view: delegation.drep_id,
        drep_raw: delegation.drep_id,
        voting_power: delegation.voting_power_ada,
        has_script: delegation.has_script || false,
        stake_address_id: stakeKey,
      } as Delegation;
    } catch (error) {
      console.error('Error getting current delegation:', error);
      return null;
    }
  }

  async getGovActions(
    voterIdentity: string,
    currentPage: number,
    itemsPerPage: number,
  ) {
    try {
      const offset = (currentPage - 1) * itemsPerPage;

      const queryBuilder = this.voltaireDb
        .getRepository('Proposal')
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.votes', 'pv')
        .leftJoinAndSelect('p.metadata', 'pm');

      if (voterIdentity.startsWith('stake')) { // Stake Key
        queryBuilder
          .innerJoin('drep_delegators', 'dd', 'dd.drep_id = pv.voter')
          .where('dd.stake_address = :identity', { identity: voterIdentity });
      } else if (voterIdentity.startsWith('drep')) { // DRep ID
        queryBuilder
          .where('pv.voter = :identity', { identity: voterIdentity });
      } else {
        queryBuilder
          .innerJoin('drep_delegators', 'dd', 'dd.drep_id = pv.voter')
          .where('dd.stake_address = (SELECT stake_address FROM drep_delegators WHERE drep_id = :identity LIMIT 1)', { identity: voterIdentity });
      }

      queryBuilder
        .orderBy('p.createdAt', 'DESC')
        .skip(offset)
        .take(itemsPerPage);

      const [proposals, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / itemsPerPage);

      const formattedActions = proposals.map(p => {
        const vote = p.votes[0];
        return {
          gov_action_proposal_id: p.id,
          gov_action_proposal_index: p.certIndex,
          type: p.governanceType,
          description: { tag: p.governanceType },
          vote: vote?.vote ? vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1) : null,
          url: p.metadata?.url || null,
          metadata: p.metadata?.jsonMetadata || null,
          epoch_no: null, // Not directly on proposal, would need block info
          time_voted: vote?.createdAt,
          vote_tx_hash: vote?.txHash,
          drep_id: vote?.voter,
          view: vote?.voter,
          vote_rationale: null, // Vote rationale not on proposal, would need extended vote entity if it exists
          proposal: {
            title: p.metadata?.jsonMetadata?.body?.title || null,
            abstract: p.metadata?.jsonMetadata?.body?.abstract || null,
            rationale: p.metadata?.jsonMetadata?.body?.rationale || null,
            type: p.governanceType
          }
        };
      });

      return {
        data: formattedActions,
        totalItems: total,
        currentPage,
        itemsPerPage,
        totalPages,
      };

    } catch (error) {
      console.error('Error getting governance actions:', error);
      throw new HttpException(
        'Failed to fetch governance actions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
