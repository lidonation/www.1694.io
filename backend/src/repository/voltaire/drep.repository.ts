import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Drep } from 'src/entities/drep.entity';
import { Signature } from 'src/entities/signatures.entity';
import { getAllDRepsQuery, getTotalResultsQuery } from 'src/queries/getDReps';
import {
  getDRepDelegatorsCountQuery,
  getDRepVotesCountQuery,
  getDRepVotingPowerQuery,
} from 'src/queries/drepStats';
import { getEpochParams } from 'src/queries/getEpochParams';
import { getDRepDelegatorsHistory } from 'src/queries/drepDelegatorsHistory';
import { getDrepCexplorerDetailsQuery } from 'src/queries/drepCexplorerDetails';
import {
  getDrepDelegatorsCountQuery as getDRepDelegatorsCountQueryVP,
  getDrepDelegatorsWithVotingPowerQuery,
} from 'src/queries/drepDelegatorsWithVotingPower';
import { drepRegistrationQuery } from 'src/queries/drepRegistration';
import { getDRepMetadataQuery } from 'src/queries/drepMetadata';
import { getDrepDateOfRegistrationQuery } from 'src/queries/drepDateOfRegistration';
import { getDrepVotingActivityQuery } from 'src/queries/drepVotingActivity';
import { getCurrentDelegationQuery } from 'src/queries/currentDelegation';
import { getDRepParticipationQuery } from 'src/queries/drepParticipation';
import {
  getDRepVotedGovActionsCountQuery,
  getDRepVotedGovActionsQuery,
} from 'src/queries/drepVotes';

interface GetAllDRepsParams {
  query?: string;
  currentPage?: number;
  itemsPerPage?: number;
  sortColumn?: string;
  sortOrder?: string;
  onChainStatus?: 'active' | 'inactive';
  campaignStatus?: 'claimed' | 'unclaimed';
  includeRetired?: boolean;
  dRepViews?: string[];
  type?: 'has_script';
}

@Injectable()
export class DRepRepository extends Repository<Drep> {
  constructor(
    @InjectDataSource('default')
    private readonly voltaireDb: DataSource,
    @InjectDataSource('dbsync')
    private readonly cardanoDb: DataSource,
  ) {
    super(Drep, voltaireDb.createEntityManager());
  }

  async createDrep(drepData: any) {
    return this.insert(drepData);
  }

  async updateDrep(id: number, updateData: any) {
    return this.update(id, updateData);
  }

  async findById(id: number) {
    return this.createQueryBuilder('drep')
      .where('drep.id = :id', { id })
      .getRawMany();
  }

  async insertMany(dreps: any[]) {
    return this.insert(dreps);
  }

  async getAllWithSignatures() {
    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .getRawMany();
  }

  async getByViews(views: string[]) {
    if (views.length === 0) return [];

    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('drep.signatures', 'signature')
      .where('signature.drep_bech32 IN (:...views)', { views })
      .getRawMany();
  }

  async getByIdWithSignature(drepId: number) {
    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('drep.id = :drepId', { drepId })
      .getRawMany();
  }

  async getByVoterIdWithSignature(drepVoterId: string) {
    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('signature.drep_bech32 = :drepVoterId', { drepVoterId })
      .getRawMany();
  }

  async getVoltaireDRepViaVoterID(drepVoterId: string) {
    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('signature.drep_bech32 = :drepVoterId', { drepVoterId })
      .getRawOne();
  }

  async verifyOwnership(voterId: string, drepId: string): Promise<Signature[]> {
    return this.voltaireDb.getRepository(Signature).find({
      where: { voterId, drep_bech32: drepId },
    }) as Promise<Signature[]>;
  }

  async checkDRepClaimStatus(stakeKey: string) {
    return this.createQueryBuilder('drep')
      .leftJoinAndSelect('drep.signatures', 'signature')
      .where('signature.stakeKey = :stakeKey', { stakeKey })
      .getOne();
  }

  async getClaimedProfiles(voterId: string) {
    const claimedProfiles = await this.voltaireDb
      .getRepository(Signature)
      .find({
        where: { voterId },
        relations: {
          drep: true,
        },
      });

    if (!claimedProfiles || claimedProfiles.length === 0) {
      return [];
    }

    return claimedProfiles.map((profile) => ({
      voterDRepBech32: profile.voterId,
      voterStakeKey: profile.stakeKey,
      claimedDRepId: profile.drep.id,
      claimedDRepBech32: profile.drep_bech32,
      voterSignatureKey: profile.signatureKey,
      voterSignature: profile.signature,
      voterSignatureType: profile.type,
      claimMethod:
        profile.voterId == profile.drep_bech32 ? 'hot_wallet' : 'login_file',
    }));
  }

  async getAllDReps(params: GetAllDRepsParams) {
    const {
      query,
      currentPage = 1,
      itemsPerPage = 20,
      sortColumn,
      sortOrder,
      onChainStatus,
      campaignStatus,
      includeRetired,
      dRepViews,
      type,
    } = params;

    const offset = (currentPage - 1) * itemsPerPage;

    const sanitizedSearch = query ? query.replace(/'/g, "''") : '';
    let sanitizedSearchCondition = '';
    if (sanitizedSearch && sanitizedSearch.length > 0) {
      sanitizedSearchCondition = `
        AND (
          COALESCE('${sanitizedSearch}', '') = '' OR
          (CASE WHEN LENGTH('${sanitizedSearch}') % 2 = 0 AND '${sanitizedSearch}' ~ '^[0-9a-fA-F]+$' THEN dh.raw = decode('${sanitizedSearch}', 'hex') ELSE false END) OR
          dh.view ILIKE '%${sanitizedSearch}%' OR
          off_chain_vote_drep_data.given_name ILIKE '%${sanitizedSearch}%' OR
          off_chain_vote_drep_data.payment_address ILIKE '%${sanitizedSearch}%'
        )
      `;
    }

    let chainStatusCondition = '';
    if (onChainStatus === 'active') {
      chainStatusCondition = `AND (DRepActivity.epoch_no - coalesce(block.epoch_no, block_first_register.epoch_no)) <=
                  DRepActivity.drep_activity`;
    } else if (onChainStatus === 'inactive') {
      chainStatusCondition = `AND (DRepActivity.epoch_no - coalesce(block.epoch_no, block_first_register.epoch_no)) >
                  DRepActivity.drep_activity`;
    }

    if (!includeRetired) {
      chainStatusCondition += ` AND (dr_voting_anchor.deposit IS NULL OR dr_voting_anchor.deposit >= 0) `;
    }

    let campaignStatusCondition = '';
    if (dRepViews && dRepViews.length > 0) {
      if (campaignStatus === 'claimed') {
        campaignStatusCondition = `AND dh.view IN (${dRepViews.map((v) => `'${v}'`).join(', ')})`;
      } else if (campaignStatus === 'unclaimed') {
        campaignStatusCondition = `AND dh.view NOT IN (${dRepViews.map((v) => `'${v}'`).join(', ')})`;
      }
    }

    let typeCondition = '';
    if (type === 'has_script') {
      typeCondition = `AND dh.has_script = true`;
    }

    let orderByClause = '';
    if (sortColumn && sortOrder) {
      const validSortColumns = [
        'delegation_vote_count',
        'live_stake',
        'voting_power',
        'governance_vote_count',
      ];
      const validSortOrders = ['ASC', 'DESC'];

      if (
        validSortColumns.includes(sortColumn) &&
        validSortOrders.includes(sortOrder)
      ) {
        if (sortOrder === 'DESC') {
          orderByClause = `ORDER BY ${sortColumn} ${sortOrder} NULLS LAST`;
        } else if (sortOrder === 'ASC') {
          orderByClause = `ORDER BY ${sortColumn} ${sortOrder} NULLS FIRST`;
        }
      }
    }

    const drepList = await this.cardanoDb.manager.query(
      getAllDRepsQuery(
        sanitizedSearchCondition,
        campaignStatusCondition,
        chainStatusCondition,
        orderByClause,
        itemsPerPage,
        offset,
        typeCondition,
      ),
    );

    const totalResults = await this.cardanoDb.manager.query(
      getTotalResultsQuery(
        sanitizedSearchCondition,
        campaignStatusCondition,
        chainStatusCondition,
        typeCondition,
      ),
    );

    return {
      data: drepList,
      totalItems: parseInt(totalResults[0].total, 10),
    };
  }

  async getDrepDetails(drepVoterId: string) {
    const result = await this.cardanoDb.manager.query(
      getDrepCexplorerDetailsQuery,
      [drepVoterId],
    );
    return result[0];
  }

  async getDrepDateOfRegistration(drepVoterId: string) {
    return this.cardanoDb.manager.query(getDrepDateOfRegistrationQuery, [
      drepVoterId,
    ]);
  }

  async getEpochs(startingTime: Date, endingTime: Date) {
    const query = `
      SELECT start_time, end_time, no
      FROM epoch
      WHERE epoch.start_time::DATE BETWEEN $1::DATE AND $2::DATE
      ORDER BY start_time DESC
    `;

    return this.cardanoDb.manager.query(query, [startingTime, endingTime]);
  }

  async getDrepVotingActivity(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ) {
    return this.cardanoDb.manager.query(getDrepVotingActivityQuery, [
      drepVoterId,
      startingTime,
      endingTime,
    ]);
  }

  async getEpochParams() {
    return this.cardanoDb.manager.query(getEpochParams);
  }

  async getDrepDelegatorsWithVotingPower(
    drepVoterId: string,
    currentPage: number,
    itemsPerPage: number,
    sort?: string,
    order?: string,
  ) {
    const offset = (currentPage - 1) * itemsPerPage;

    const sortColumns = {
      power: 'voting_power',
      epoch: 'delegation_epoch',
    };

    const sortColumn = sort ? sortColumns[sort] : 'delegation_epoch';
    const sortOrder = order?.toUpperCase() || 'DESC';

    const orderByClause =
      sortColumn && ['ASC', 'DESC'].includes(sortOrder)
        ? `ORDER BY ${sortColumn} ${sortOrder} NULLS ${sortOrder === 'DESC' ? 'LAST' : 'FIRST'}`
        : 'ORDER BY delegation_epoch DESC NULLS LAST';

    const delegatorsWithVotingPower = await this.cardanoDb.manager.query(
      getDrepDelegatorsWithVotingPowerQuery(
        itemsPerPage,
        offset,
        orderByClause,
      ),
      [drepVoterId],
    );

    const totalResults = await this.cardanoDb.manager.query(
      getDRepDelegatorsCountQueryVP(),
      [drepVoterId],
    );

    const totalItems = parseInt(totalResults[0].total, 10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: delegatorsWithVotingPower.map((delegator) => ({
        stakeAddress: delegator?.stake_address,
        delegationEpoch: delegator?.delegation_epoch,
        votingPower: delegator?.voting_power,
      })),
      totalItems,
      currentPage,
      itemsPerPage,
      totalPages,
    };
  }

  async getDrepStats(drepVoterId: string) {
    const drepDelegatorsCountResult = await this.cardanoDb.manager.query(
      getDRepDelegatorsCountQuery,
      [drepVoterId],
    );

    const drepDelegatorsCount = Number(
      drepDelegatorsCountResult[0]?.delegators_count || 0,
    );

    const drepVotesCountResult = await this.cardanoDb.manager.query(
      getDRepVotesCountQuery,
      [drepVoterId],
    );
    const drepVotesCount = Number(drepVotesCountResult[0]?.vote_count || 0);

    const drepVotingPowerResult = await this.cardanoDb.manager.query(
      getDRepVotingPowerQuery,
      [drepVoterId],
    );

    const drepVotingPower = Number(drepVotingPowerResult[0]?.voting_power) || 0;

    return {
      delegators: drepDelegatorsCount,
      votes: drepVotesCount,
      votingPower: drepVotingPower,
    };
  }

  async getDrepDelegators(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ) {
    const drepHashQuery = `
      SELECT id, view FROM drep_hash WHERE view = $1
    `;

    const drepHashResult = await this.cardanoDb.manager.query(drepHashQuery, [
      drepVoterId,
    ]);
    const drepHashId = drepHashResult[0]?.id;

    if (!drepHashId) {
      throw new Error(`No DRep found with the view: ${drepVoterId}`);
    }

    const addrIdsQuery = `
      SELECT DISTINCT addr_id FROM delegation_vote WHERE drep_hash_id = $1
    `;

    const addrIdsResult = await this.cardanoDb.manager.query(addrIdsQuery, [
      drepHashId,
    ]);
    const addrIds = addrIdsResult.map((row) => row.addr_id);

    return this.cardanoDb.manager.query(getDRepDelegatorsHistory(addrIds), [
      drepHashId,
      drepVoterId,
      startingTime,
      endingTime,
    ]);
  }

  async isDrepRegistered(voterId: string) {
    const latestRegistration = await this.cardanoDb.manager.query(
      drepRegistrationQuery,
      [voterId],
    );

    const regDeposit = latestRegistration[0]?.deposit;
    return {
      registered: regDeposit === null || regDeposit > 0,
      ...latestRegistration?.[0],
    };
  }

  async getDrepMetadata(voterId: string) {
    return this.cardanoDb.manager.query(getDRepMetadataQuery, [voterId]);
  }

  async getDrepMetadataUrl(voterId: string) {
    return this.cardanoDb.manager.query(
      `SELECT
        va.url AS metadata_url
        FROM
        drep_registration AS dr
        LEFT JOIN
        voting_anchor AS va ON dr.voting_anchor_id = va.id
        JOIN
        drep_hash dh ON dr.drep_hash_id = dh.id
        WHERE dh.view = $1
        AND dr.tx_id = (SELECT MAX(tx_id) FROM drep_registration WHERE drep_hash_id = dr.drep_hash_id);`,
      [voterId],
    );
  }

  async getVoterProfileData(stakeKey: string) {
    // Get current delegation information
    const delegations = await this.cardanoDb.manager.query(
      getCurrentDelegationQuery,
      [stakeKey],
    );

    const delegation = delegations[0];

    if (!delegation) {
      return { delegation: null, registration: null };
    }

    // Get DRep registration information
    const registrations = await this.cardanoDb.manager.query(
      drepRegistrationQuery,
      [delegation.drep_view],
    );

    const registration = registrations[0];

    return {
      delegation,
      registration: registration || null,
    };
  }

  async getGovernanceParticipation(voterId: string) {
    const participation = await this.cardanoDb.manager.query(
      getDRepParticipationQuery,
      [voterId],
    );

    return participation?.[0] || null;
  }

  async getDRepVotedGovActions(
    voterId: string,
    currentPage: number,
    itemsPerPage: number,
  ) {
    const offset = (currentPage - 1) * itemsPerPage;
    const govActions = await this.cardanoDb.manager.query(
      getDRepVotedGovActionsQuery(itemsPerPage, offset),
      [voterId],
    );

    const totalResults = await this.cardanoDb.manager.query(
      getDRepVotedGovActionsCountQuery,
      [voterId],
    );

    const totalItems = parseInt(totalResults[0]?.total, 10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: govActions,
      totalItems,
      currentPage,
      itemsPerPage,
      totalPages,
    };
  }

  async getSingleDrepViaID(drepId: number) {
    const drep = await this.getByIdWithSignature(drepId);
    let drepVoterId;
    if (drep.length > 0) drepVoterId = drep[0].signature_drep_bech32;
    const drepCexplorer = await this.getDrepDetails(drepVoterId);

    const combinedResult = {
      ...drep[0],
      ...drepCexplorer,
    };

    if ((!drep || drep.length === 0) && (!drepCexplorer || !drepCexplorer)) {
      throw new NotFoundException('Drep not found!');
    }

    // Account for voting options
    if (
      combinedResult?.view?.includes('drep_always_abstain') ||
      combinedResult?.view?.includes('drep_always_no_confidence')
    ) {
      combinedResult['type'] = 'voting_option';
    } else {
      combinedResult['type'] = 'drep';
    }

    return combinedResult;
  }

  async getSingleDrepViaVoterID(drepVoterId: string) {
    const drep = await this.getByVoterIdWithSignature(drepVoterId);
    const drepCexplorer = await this.getDrepDetails(drepVoterId);

    const combinedResult = {
      ...drep[0],
      ...drepCexplorer,
    };

    if ((!drep || drep.length === 0) && (!drepCexplorer || !drepCexplorer)) {
      throw new NotFoundException('Drep not found!');
    }

    // Account for voting options
    if (
      combinedResult?.view?.includes('drep_always_abstain') ||
      combinedResult?.view?.includes('drep_always_no_confidence')
    ) {
      combinedResult['type'] = 'voting_option';
    } else if (!!combinedResult.has_script) {
      combinedResult['type'] = 'scripted';
    } else {
      combinedResult['type'] = 'drep';
    }

    return combinedResult;
  }
}
