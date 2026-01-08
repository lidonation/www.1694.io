import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, ILike } from 'typeorm';
import { bech32 } from 'bech32';
import { Drep as VoltaireDrep } from 'src/entities/drep.entity';
import { Signature } from 'src/entities/signatures.entity';
import { Drep } from 'src/entities/governance/drep.entity';
import { DrepDelegator } from 'src/entities/governance/drep-delegator.entity';
import { DrepTimelineEvent } from 'src/entities/governance/drep-timeline-event.entity';
import { Proposal } from 'src/entities/governance/proposal.entity';
import { ProposalVote } from 'src/entities/governance/proposal-vote.entity';
import { ProposalMetadata } from 'src/entities/governance/proposal-metadata.entity';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';

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
export class DRepRepository extends Repository<VoltaireDrep> {
  constructor(
    @InjectDataSource('default')
    private readonly voltaireDb: DataSource,
    private readonly blockfrostService: BlockfrostService,
  ) {
    super(VoltaireDrep, voltaireDb.createEntityManager());
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
      .where('signature.drep_bech32 ILIKE :drepVoterId', { drepVoterId })
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

    const queryBuilder = this.voltaireDb
      .getRepository(Drep)
      .createQueryBuilder('drep')
      // Join delegators where the DRep ID *or* Hex matches any alias of this DRep (same hex suffix)
      // This ensures we count delegations regardless of whether they used the Legacy or CIP-129 ID
      .leftJoin(
        'drep_delegators',
        'delegator',
        `(delegator.drep_id IN (SELECT d2.drep_id FROM dreps d2 WHERE LOWER(RIGHT(d2.hex, 56)) = LOWER(RIGHT(drep.hex, 56))) 
         OR delegator.drep_id IN (SELECT d3.hex FROM dreps d3 WHERE LOWER(RIGHT(d3.hex, 56)) = LOWER(RIGHT(drep.hex, 56))))`,
      )

      .addSelect(
        'COUNT(DISTINCT delegator.stake_address)',
        'live_delegation_count',
      )
      .addSelect('SUM(delegator.amount_lovelace)', 'live_stake_lovelace')

      // Aggregate votes from ALL aliases of this DRep
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(pv.id)', 'vote_count')
          .from(ProposalVote, 'pv')
          .where(
            `pv.voter IN (SELECT d_alias.drep_id FROM dreps d_alias WHERE LOWER(RIGHT(d_alias.hex, 56)) = LOWER(RIGHT(drep.hex, 56)))`,
          );
      }, 'computed_vote_count')

      .groupBy('drep.drep_id')
      .addGroupBy('drep.hex');

    // Consolidate duplicates: Filter to keep only the latest (priority by length, then createdAt)
    // We group by the last 56 chars of hex (removing potential 2-char prefix like '22' or '23')
    queryBuilder.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('DISTINCT ON (LOWER(RIGHT(d.hex, 56))) d.drep_id')
        .from(Drep, 'd')
        .orderBy('LOWER(RIGHT(d.hex, 56))')
        .addOrderBy('LENGTH(d.hex)', 'DESC') // Prioritize CIP-129 (longer)
        .addOrderBy('d.created_at', 'DESC')
        .getQuery();
      return 'drep.drep_id IN ' + subQuery;
    });

    // Apply search filter
    if (query) {
      queryBuilder.andWhere(
        "(drep.drepId ILIKE :search OR drep.metadata->'json_metadata'->'body'->>'givenName' ILIKE :search OR drep.hex ILIKE :search OR drep.metadata->'json_metadata'->'body'->>'paymentAddress' ILIKE :search)",
        { search: `%${query}%` },
      );
    }

    // Apply status filters
    if (onChainStatus === 'active') {
      queryBuilder.andWhere('drep.active = :active', { active: true });
    } else if (onChainStatus === 'inactive') {
      queryBuilder.andWhere('drep.active = :active', { active: false });
    }

    if (!includeRetired) {
      queryBuilder.andWhere('drep.retired = :retired', { retired: false });
    }

    // Apply campaign status (claimed/unclaimed)
    if (dRepViews && dRepViews.length > 0) {
      if (campaignStatus === 'claimed') {
        queryBuilder.andWhere('drep.drepId IN (:...views)', {
          views: dRepViews,
        });
      } else if (campaignStatus === 'unclaimed') {
        queryBuilder.andWhere('drep.drepId NOT IN (:...views)', {
          views: dRepViews,
        });
      }
    }

    // Apply type filter
    if (type === 'has_script') {
      queryBuilder.andWhere('drep.hasScript = :hasScript', { hasScript: true });
    }

    // Apply sorting
    const sortColumnMap = {
      delegation_vote_count: 'drep.delegationVoteCount',
      live_stake: 'drep.votingPowerAda',
      voting_power: 'drep.votingPowerAda',
      governance_vote_count: 'computed_vote_count',
    };

    const dbSortColumn = sortColumnMap[sortColumn] || 'drep.votingPowerAda';
    const dbSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(
      dbSortColumn,
      dbSortOrder,
      sortOrder === 'DESC' ? 'NULLS LAST' : 'NULLS FIRST',
    );

    // Get total count for pagination
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const offset = (currentPage - 1) * itemsPerPage;
    queryBuilder.skip(offset).take(itemsPerPage);

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    // Transform to expected format
    const transformedData = entities.map((drep) => {
      const rawResult = raw.find((r) => r.drep_drep_id === drep.drepId);
      const liveCount = parseInt(rawResult?.live_delegation_count || '0');
      const liveStakeLovelace = rawResult?.live_stake_lovelace || '0';
      const liveStakeAda = parseInt(liveStakeLovelace) / 1000000;
      const voteCount = parseInt(rawResult?.computed_vote_count || '0');

      let givenName = drep.metadata?.json_metadata?.body?.givenName || null;
      // Handle doubly-encoded JSON or JSON string in givenName field
      if (
        givenName &&
        typeof givenName === 'string' &&
        givenName.trim().startsWith('{')
      ) {
        try {
          const parsed = JSON.parse(givenName);
          // Try to extract name from parsed object if it has likely keys, or use parsed itself if it turned out to be a simple string (less likely)
          if (parsed.givenName) givenName = parsed.givenName;
        } catch (e) {
          // If parse fails, keep original string
        }
      }

      let imageUrl =
        drep.metadata?.json_metadata?.body?.image?.contentUrl || null;
      if (imageUrl && imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return {
        chain_id: drep.hex,
        view: drep.drepId,
        url: drep.metadata?.url || null,
        voting_power: drep.votingPowerAda || '0',
        has_script: drep.hasScript,
        active: drep.active,
        retired: drep.retired,
        tx_hash: null,
        last_register_time: drep.updatedAt,
        given_name: givenName,
        image_url: imageUrl,
        delegation_vote_count: liveCount,
        delegatorsCount: liveCount,
        live_stake: liveStakeAda.toString(),
        governance_vote_count: voteCount,
        format: drep.hex.length === 58 ? 'cip129' : 'legacy',
      };
    });

    return {
      data: transformedData,
      totalItems,
    };
  }

  async getDrepDetails(drepVoterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: drepVoterId } });

    if (!drepData) return null;

    return {
      view: drepData.drepId,
      chain_id: drepData.hex,
      has_script: drepData.hasScript,
      active: drepData.active,
      retired: drepData.retired,
      voting_power: drepData.votingPowerAda,
      delegation_vote_count: drepData.delegationVoteCount,
      governance_vote_count: drepData.governanceVoteCount,
      given_name: drepData.metadata?.json_metadata?.body?.givenName || null,
      image_url:
        drepData.metadata?.json_metadata?.body?.image?.contentUrl || null,
      metadata_url: drepData.metadata?.url || null,
      payment_address:
        drepData.metadata?.json_metadata?.body?.paymentAddress || null,
      objectives: drepData.metadata?.json_metadata?.body?.objectives || null,
      motivations: drepData.metadata?.json_metadata?.body?.motivations || null,
      qualifications:
        drepData.metadata?.json_metadata?.body?.qualifications || null,
    };
  }

  async getDrepDateOfRegistration(drepVoterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: drepVoterId } });

    return [
      {
        drep_hash_id: 0,
        reg_tx_hash: '',
        date_of_registration: drepData?.createdAt || null,
        epoch_of_registration: 0,
      },
    ];
  }

  async getEpochs(startingTime: Date, endingTime: Date) {
    return [];
  }

  async getDrepVotingActivity(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ) {
    const votingEvents = await this.voltaireDb
      .getRepository(DrepTimelineEvent)
      .createQueryBuilder('event')
      .where('event.drepId = :drepId', { drepId: drepVoterId })
      .andWhere('event.eventType = :eventType', { eventType: 'vote' })
      .andWhere('event.timestamp >= :startTime', { startTime: startingTime })
      .andWhere('event.timestamp <= :endTime', { endTime: endingTime })
      .orderBy('event.timestamp', 'DESC')
      .getMany();

    return votingEvents.map((event) => ({
      view: drepVoterId,
      gov_action_proposal_id:
        event.metadata?.gov_action_proposal_id ||
        event.metadata?.proposalId ||
        'unknown',
      prop_inception: event.timestamp,
      type: 'voting_activity',
      description: event.metadata?.description || 'Voting activity',
      voting_anchor_id: event.metadata?.voting_anchor_id || 'unknown',
      vote: event.metadata?.vote || 'unknown',
      metadata: event.metadata || {},
      time_voted: event.timestamp,
      proposal_epoch: event.epoch,
      voting_epoch: event.epoch,
      url: event.metadata?.url || null,
    }));
  }

  async getEpochParams() {
    try {
      const epochParams = await this.blockfrostService.getEpochParameters();
      return epochParams;
    } catch (error) {
      console.error('Error fetching epoch parameters from Blockfrost:', error);
      return [];
    }
  }

  async getDrepDelegatorsWithVotingPower(
    drepVoterId: string,
    currentPage: number,
    itemsPerPage: number,
    sort?: string,
    order?: string,
  ) {
    // First verify the DRep exists and get its canonical ID
    const drepRecord = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: drepVoterId } });

    if (!drepRecord) {
      return {
        data: [],
        totalItems: 0,
        currentPage,
        itemsPerPage,
        totalPages: 0,
      };
    }

    // Use raw query to check what's actually in the database
    const rawDelegatorCheck = await this.voltaireDb.query(
      `
      SELECT COUNT(*) as count 
      FROM drep_delegators dd 
      WHERE dd.drep_id = $1
    `,
      [drepVoterId],
    );

    const rawCount = parseInt(rawDelegatorCheck[0]?.count || '0');

    if (rawCount === 0) {
      // Try with hex format if bech32 didn't work
      const hexDelegatorCheck = await this.voltaireDb.query(
        `
        SELECT COUNT(*) as count 
        FROM drep_delegators dd 
        WHERE dd.drep_id = $1
      `,
        [drepRecord.hex],
      );

      const hexCount = parseInt(hexDelegatorCheck[0]?.count || '0');

      if (hexCount > 0) {
        // Use hex format for the main query
        const queryBuilder = this.voltaireDb
          .getRepository(DrepDelegator)
          .createQueryBuilder('delegator')
          .where('delegator.drepId = :drepId', { drepId: drepRecord.hex });
      } else {
        // No delegators found with either format
        return {
          data: [],
          totalItems: 0,
          currentPage,
          itemsPerPage,
          totalPages: 0,
        };
      }
    }

    const queryBuilder = this.voltaireDb
      .getRepository(DrepDelegator)
      .createQueryBuilder('delegator')
      .where('delegator.drepId = :drepId', {
        drepId: rawCount > 0 ? drepVoterId : drepRecord.hex,
      });

    // Apply sorting
    const sortColumn =
      sort === 'power'
        ? 'delegator.votingPowerLovelace'
        : 'delegator.updatedAt';
    const sortOrder = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Get total count
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Apply pagination
    const offset = (currentPage - 1) * itemsPerPage;
    queryBuilder.skip(offset).take(itemsPerPage);

    const delegators = await queryBuilder.getMany();

    return {
      data: delegators.map((delegator) => ({
        stakeAddress: delegator.stakeAddress,
        delegationEpoch: null,
        votingPower: delegator.votingPowerLovelace
          ? (parseInt(delegator.votingPowerLovelace) / 1_000_000).toString()
          : '0',
      })),
      totalItems,
      currentPage,
      itemsPerPage,
      totalPages,
    };
  }

  async getDrepStats(drepVoterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: drepVoterId } });

    if (!drepData) {
      return {
        delegators: 0,
        votes: 0,
        votingPower: 0,
      };
    }

    // Use raw query to get accurate delegator count
    const rawDelegatorCheck = await this.voltaireDb.query(
      `
      SELECT COUNT(*) as count 
      FROM drep_delegators dd 
      WHERE dd.drep_id = $1 OR dd.drep_id = $2
    `,
      [drepVoterId, drepData.hex],
    );

    const drepDelegatorsCount = parseInt(rawDelegatorCheck[0]?.count || '0');

    const drepVotesCount = await this.voltaireDb
      .getRepository(ProposalVote)
      .count({ where: { voter: drepVoterId } });

    const votingPower = drepData.votingPowerAda
      ? parseFloat(drepData.votingPowerAda)
      : 0;

    return {
      delegators: drepDelegatorsCount,
      votes: drepVotesCount,
      votingPower,
    };
  }

  async getDrepDelegators(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ) {
    const timelineEvents = await this.voltaireDb
      .createQueryBuilder()
      .select('*')
      .from('timeline_delegations_enriched', 'tle')
      .where('tle.target_drep = :drepId', { drepId: drepVoterId })
      .andWhere('tle.timestamp >= :startTime', { startTime: startingTime })
      .andWhere('tle.timestamp <= :endTime', { endTime: endingTime })
      .orderBy('tle.timestamp', 'DESC')
      .getRawMany();

    return timelineEvents.map((event) => ({
      stake_address: event.stake_address,
      target_drep: event.target_drep,
      current_drep: event.current_drep,
      previous_drep: event.previous_drep,
      timestamp: event.timestamp,
      delegation_epoch: event.delegation_epoch || event.epoch,
      tx_hash: event.tx_hash,
      type: 'delegation' as const,
      total_stake: event.best_stake_lovelace || '0',
      total_stake_ada: parseFloat(event.best_stake_ada) || 0,
      voting_power_lovelace: event.current_voting_power_lovelace || '0',
      voting_power_ada: parseFloat(event.current_voting_power_ada) || 0,
      added_power: event.added_power,
      delegation_status: event.delegation_status,
      current_delegated_drep: event.current_delegated_drep,
      epochNo: event.epoch,
      epoch: event.epoch,
      slot: event.slot,
    }));
  }

  async isDrepRegistered(voterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: voterId } });

    return {
      registered: drepData && !drepData.retired,
      deposit: null,
      view: voterId,
    };
  }

  async getDrepMetadata(voterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: voterId } });

    if (!drepData) return [];

    return [
      {
        given_name: drepData.metadata?.json_metadata?.body?.givenName || null,
        image_url:
          drepData.metadata?.json_metadata?.body?.image?.contentUrl || null,
        metadata_url: drepData.metadata?.url || null,
        objectives: drepData.metadata?.json_metadata?.body?.objectives || null,
        motivations:
          drepData.metadata?.json_metadata?.body?.motivations || null,
        qualifications:
          drepData.metadata?.json_metadata?.body?.qualifications || null,
        metadata: drepData.metadata,
      },
    ];
  }

  async getDrepMetadataUrl(voterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: voterId } });

    return [{ metadata_url: drepData?.metadata?.url || null }];
  }

  async getVoterProfileData(stakeKey: string) {
    return { delegation: null, registration: null };
  }

  async getGovernanceParticipation(voterId: string) {
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: voterId } });

    if (drepData) {
      return {
        governance_vote_count: drepData.governanceVoteCount || 0,
        delegation_vote_count: drepData.delegationVoteCount || 0,
      };
    }

    // Fallback: count directly from proposal_votes and drep_delegators tables
    const [governanceVoteCount, delegationVoteCount] = await Promise.all([
      this.voltaireDb
        .getRepository(ProposalVote)
        .count({ where: { voter: voterId } }),
      this.voltaireDb
        .getRepository(DrepDelegator)
        .count({ where: { drepId: voterId } }),
    ]);

    return {
      governance_vote_count: governanceVoteCount,
      delegation_vote_count: delegationVoteCount,
    };
  }

  async getDRepVotedGovActions(
    voterId: string,
    currentPage: number,
    itemsPerPage: number,
  ) {
    const queryBuilder = this.voltaireDb
      .getRepository(ProposalVote)
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.proposal', 'proposal')
      .leftJoinAndSelect('proposal.metadata', 'meta')
      .where('vote.voter = :voterId', { voterId })
      .orderBy('vote.createdAt', 'DESC');

    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const offset = (currentPage - 1) * itemsPerPage;
    const votes = await queryBuilder.skip(offset).take(itemsPerPage).getMany();

    return {
      data: votes.map((vote) => ({
        tx_hash: vote.txHash,
        vote: vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1),
        proposal_id: vote.proposalId,
        gov_action_proposal_id: vote.proposalId,
        time_voted: vote.createdAt?.toISOString() || new Date().toISOString(),
        type: (vote as any).proposal?.governanceType || 'InfoAction',
        description: {
          tag: (vote as any).proposal?.governanceType || 'InfoAction',
        },
        proposal: {
          title:
            (vote as any).proposal?.metadata?.jsonMetadata?.body?.title || null,
          abstract:
            (vote as any).proposal?.metadata?.jsonMetadata?.body?.abstract ||
            null,
          rationale:
            (vote as any).proposal?.metadata?.jsonMetadata?.body?.rationale ||
            null,
          type: (vote as any).proposal?.governanceType || null,
        },
      })),
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

  async getSingleDrepViaVoterIDOptimized(drepVoterId: string) {
    // Get from enhanced dreps table
    // Get from enhanced dreps table
    let drepData = await this.voltaireDb.getRepository(Drep).findOne({
      where: { drepId: ILike(drepVoterId.trim()) },
    });

    if (!drepData) {
        // Fallback: Check for ID format mismatch (CIP-105 vs CIP-129)
        // The DB might store the Long ID (CIP-129, with '22' prefix), while we received the Short ID (CIP-105)
        try {
            const decoded = bech32.decode(drepVoterId);
            const data = bech32.fromWords(decoded.words);
            const hex = Buffer.from(data).toString('hex');

            // validation: ensure hex is at least 56 chars
            if (hex.length >= 56) {
                 drepData = await this.voltaireDb.getRepository(Drep).createQueryBuilder('drep')
                .where('LOWER(RIGHT(drep.hex, 56)) = LOWER(RIGHT(:hex, 56))', { hex })
                .getOne();
            }
        } catch (e) {
            // Ignore decoding errors
        }
    }

    if (!drepData) {
      throw new NotFoundException('DRep not found in database!');
    }

    // Get voltaire drep data (claimed profile info)
    const voltaireDrep = await this.getByVoterIdWithSignature(drepVoterId);

    // Combine data from both sources
    const combinedResult = {
      // From enhanced dreps table
      view: drepData.drepId,
      chain_id: drepData.hex,
      delegation_vote_count: drepData.delegationVoteCount,
      voting_power: drepData.votingPowerAda,
      live_stake: drepData.votingPowerAda,
      epoch_no: drepData.snapshotEpochNo,
      retired: drepData.retired,
      active: drepData.active,
      metadata: drepData.metadata,
      metadata_url: drepData.metadata?.url || null,
      has_script: drepData.hasScript,
      given_name: drepData.metadata?.json_metadata?.body?.givenName || null,
      image_url:
        drepData.metadata?.json_metadata?.body?.image?.contentUrl || null,
      payment_address:
        drepData.metadata?.json_metadata?.body?.paymentAddress || null,
      objectives: drepData.metadata?.json_metadata?.body?.objectives || null,
      motivations: drepData.metadata?.json_metadata?.body?.motivations || null,
      qualifications:
        drepData.metadata?.json_metadata?.body?.qualifications || null,
      governance_vote_count: drepData.governanceVoteCount,
      // Set defaults for missing fields
      deposit: null,
      active_until: null,
      is_registered_as_sole_voter: false,
      stake_address: null,
      reg_address: null,
      // From voltaire drep (claimed profile)
      ...(voltaireDrep?.[0] || {}),
    };

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

  async getSingleDrepViaVoterID(drepVoterId: string) {
    return await this.getSingleDrepViaVoterIDOptimized(drepVoterId);
  }
}
