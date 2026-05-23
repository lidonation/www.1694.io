import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, ILike, In } from 'typeorm';
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
    // First try to find registration event in timeline
    const regEvent = await this.voltaireDb.getRepository(DrepTimelineEvent).findOne({
      where: { drepId: drepVoterId, eventType: 'registration' },
      order: { timestamp: 'ASC' }
    });

    if (regEvent) {
      return [{
        drep_hash_id: 0,
        reg_tx_hash: regEvent.txHash,
        date_of_registration: regEvent.timestamp,
        epoch_of_registration: regEvent.epoch
      }];
    }

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

    if (votingEvents.length === 0) return [];

    // Batch-enrich with proposal lifecycle fields and DRep vote counts
    const proposalIds = [
      ...new Set(
        votingEvents
          .map((e) => e.metadata?.gov_action_proposal_id || e.metadata?.proposalId)
          .filter(Boolean),
      ),
    ];

    type ProposalRow = {
      id: string;
      governance_type: string | null;
      expiration_epoch: string | null;
      ratified_epoch: string | null;
      enacted_epoch: string | null;
      dropped_epoch: string | null;
      expired_epoch: string | null;
    };
    type VoteCountRow = {
      proposal_id: string;
      drep_yes_count: string;
      drep_no_count: string;
      drep_abstain_count: string;
    };

    const [proposalRows, voteCountRows] = await Promise.all([
      this.voltaireDb.query<ProposalRow[]>(
        `SELECT id, governance_type, expiration_epoch, ratified_epoch, enacted_epoch,
                dropped_epoch, expired_epoch
         FROM proposals WHERE id = ANY($1)`,
        [proposalIds],
      ),
      this.voltaireDb.query<VoteCountRow[]>(
        `SELECT proposal_id,
                COUNT(*) FILTER (WHERE LOWER(vote) = 'yes')     AS drep_yes_count,
                COUNT(*) FILTER (WHERE LOWER(vote) = 'no')      AS drep_no_count,
                COUNT(*) FILTER (WHERE LOWER(vote) = 'abstain') AS drep_abstain_count
         FROM proposal_votes
         WHERE LOWER(voter_role) = 'drep' AND proposal_id = ANY($1)
         GROUP BY proposal_id`,
        [proposalIds],
      ),
    ]);

    const proposalMap = new Map(proposalRows.map((p) => [p.id, p]));
    const voteMap = new Map(voteCountRows.map((v) => [v.proposal_id, v]));

    return votingEvents.map((event) => {
      const proposalId =
        event.metadata?.gov_action_proposal_id || event.metadata?.proposalId || 'unknown';
      const p = proposalMap.get(proposalId);
      const vc = voteMap.get(proposalId);
      return {
        view: drepVoterId,
        gov_action_proposal_id: proposalId,
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
        governance_type: p?.governance_type ?? null,
        expiration_epoch: p?.expiration_epoch != null ? Number(p.expiration_epoch) : null,
        ratified_epoch: p?.ratified_epoch != null ? Number(p.ratified_epoch) : null,
        enacted_epoch: p?.enacted_epoch != null ? Number(p.enacted_epoch) : null,
        dropped_epoch: p?.dropped_epoch != null ? Number(p.dropped_epoch) : null,
        expired_epoch: p?.expired_epoch != null ? Number(p.expired_epoch) : null,
        drep_yes_count: vc ? Number(vc.drep_yes_count) : 0,
        drep_no_count: vc ? Number(vc.drep_no_count) : 0,
        drep_abstain_count: vc ? Number(vc.drep_abstain_count) : 0,
      };
    });
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
    const canonicalId = await this.resolveDrepId(drepVoterId);

    if (!canonicalId) {
      return {
        data: [],
        totalItems: 0,
        currentPage,
        itemsPerPage,
        totalPages: 0,
      };
    }

    const drepRecord = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: canonicalId } });

    if (!drepRecord) {
      return {
        data: [],
        totalItems: 0,
        currentPage,
        itemsPerPage,
        totalPages: 0,
      };
    }

    // Use getAllDrepIds to find all aliases
    const canonicalIds = await this.getAllDrepIds(drepVoterId);

    // Also include HEX in the lookup if available, as some records might use it
    const searchIds = [...canonicalIds];
    if (drepRecord.hex) {
      searchIds.push(drepRecord.hex);
    }

    if (searchIds.length === 0) {
      return {
        data: [],
        totalItems: 0,
        currentPage,
        itemsPerPage,
        totalPages: 0,
      };
    }

    const queryBuilder = this.voltaireDb
      .getRepository(DrepDelegator)
      .createQueryBuilder('delegator')
      .where('delegator.drepId IN (:...ids)', { ids: searchIds });

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
    const canonicalId = await this.resolveDrepId(drepVoterId);

    if (!canonicalId) {
      return {
        delegators: 0,
        votes: 0,
        votingPower: 0,
      };
    }

    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: canonicalId } });

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

    const canonicalIds = await this.getAllDrepIds(drepVoterId);
    let drepVotesCount = 0;
    if (canonicalIds.length > 0) {
      drepVotesCount = await this.voltaireDb
        .getRepository(ProposalVote)
        .count({ where: { voter: In(canonicalIds) } });
    }

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
    const canonicalIds = await this.getAllDrepIds(drepVoterId);

    if (canonicalIds.length === 0) {
      return [];
    }

    const timelineEvents = await this.voltaireDb
      .createQueryBuilder()
      .select('*')
      .from('drep_timeline_event', 'dte')
      .where('dte.drep_id IN (:...drepIds)', { drepIds: canonicalIds })
      .andWhere("dte.event_type = 'delegation'")
      .andWhere('dte.timestamp >= :startTime', { startTime: startingTime })
      .andWhere('dte.timestamp <= :endTime', { endTime: endingTime })
      .orderBy('dte.timestamp', 'DESC')
      .getRawMany();

    return timelineEvents.map((event) => {
      const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
      return {
        stake_address: event.stake_address,
        target_drep: event.drep_id,
        current_drep: meta?.current_drep || event.drep_id,
        previous_drep: meta?.previous_drep || event.previous_drep,
        timestamp: event.timestamp,
        delegation_epoch: meta?.delegation_epoch || event.epoch,
        tx_hash: event.tx_hash,
        type: 'delegation' as const,
        total_stake: meta?.total_stake || '0',
        total_stake_ada: (parseFloat(meta?.total_stake) / 1_000_000) || 0,
        voting_power_lovelace: meta?.total_stake || '0',
        voting_power_ada: (parseFloat(meta?.total_stake) / 1_000_000) || 0,
        added_power: meta?.added_power,
        delegation_status: meta?.delegation_status,
        current_delegated_drep: meta?.current_drep,
        epochNo: event.epoch,
        epoch: event.epoch,
        slot: event.slot,
      };
    });
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
    const canonicalIds = await this.getAllDrepIds(voterId);

    // We still use lookupId to find delegationVoteCount if needed
    const lookupId = canonicalIds.length > 0 ? canonicalIds[canonicalIds.length - 1] : voterId;
    const drepData = await this.voltaireDb
      .getRepository(Drep)
      .findOne({ where: { drepId: lookupId }, select: ['delegationVoteCount'] });

    const totalProposals = await this.voltaireDb.getRepository(Proposal).count();

    if (canonicalIds.length === 0) {
      return {
        participation: 0,
        total_actions: totalProposals,
        non_participation: totalProposals,
        delegation_vote_count: drepData?.delegationVoteCount || 0,
      };
    }

    // specific handling for array parameters in raw query
    const placeholders = canonicalIds.map((_, index) => `$${index + 1}`).join(', ');

    // Calculate DISTINCT participation dynamically
    const countQuery = `
      SELECT COUNT(DISTINCT proposal_id) as count
      FROM proposal_votes
      WHERE voter IN (${placeholders})
    `;

    const countResult = await this.voltaireDb.query(countQuery, canonicalIds);
    const governanceVoteCount = parseInt(countResult[0]?.count || '0', 10);

    const delegationVoteCount = drepData?.delegationVoteCount || 0;

    return {
      participation: governanceVoteCount,
      total_actions: totalProposals,
      non_participation: totalProposals - governanceVoteCount,
      delegation_vote_count: delegationVoteCount,
    };
  }

  async getDRepVotedGovActions(
    voterId: string,
    currentPage: number,
    itemsPerPage: number,
  ) {
    const canonicalIds = await this.getAllDrepIds(voterId);

    if (canonicalIds.length === 0) {
      return {
        data: [],
        totalItems: 0,
        currentPage,
        itemsPerPage,
        totalPages: 0,
      };
    }

    // specific handling for array parameters in raw query
    // we manually construct the IN clause placeholders
    const placeholders = canonicalIds.map((_, index) => `$${index + 1}`).join(', ');

    // 1. Get total distinct items count
    const countQuery = `
      SELECT COUNT(DISTINCT proposal_id) as count
      FROM proposal_votes
      WHERE voter IN (${placeholders})
    `;

    const countResult = await this.voltaireDb.query(countQuery, canonicalIds);
    const totalItems = parseInt(countResult[0].count, 10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 2. Get paginated and deduplicated data
    const offset = (currentPage - 1) * itemsPerPage;

    // We add offset and limit to the params list
    const queryParams = [...canonicalIds, itemsPerPage, offset];
    const limitIndex = canonicalIds.length + 1;
    const offsetIndex = canonicalIds.length + 2;

    const dataQuery = `
      SELECT * FROM (
        SELECT
          v.tx_hash as vote_tx_hash,
          p.tx_hash as proposal_tx_hash,
          v.vote,
          v.proposal_id,
          v.block_time,
          v.created_at,
          p.governance_type,
          p.expiration_epoch,
          p.ratified_epoch,
          p.enacted_epoch,
          p.dropped_epoch,
          p.expired_epoch,
          m.json_metadata->'body'->>'title' as title,
          m.json_metadata->'body'->>'abstract' as abstract,
          m.json_metadata->'body'->>'rationale' as rationale,
          m.hash as proposal_anchor_hash,
          COALESCE(vc.drep_yes_count, 0) as drep_yes_count,
          COALESCE(vc.drep_no_count, 0) as drep_no_count,
          COALESCE(vc.drep_abstain_count, 0) as drep_abstain_count,
          ROW_NUMBER() OVER (
            PARTITION BY v.proposal_id
            ORDER BY v.block_time DESC NULLS LAST, v.created_at DESC
          ) as row_num
        FROM proposal_votes v
        LEFT JOIN proposals p ON v.proposal_id = p.id
        LEFT JOIN proposal_metadata m ON p.id = m.proposal_id
        LEFT JOIN (
          SELECT
            proposal_id,
            COUNT(*) FILTER (WHERE LOWER(vote) = 'yes')     AS drep_yes_count,
            COUNT(*) FILTER (WHERE LOWER(vote) = 'no')      AS drep_no_count,
            COUNT(*) FILTER (WHERE LOWER(vote) = 'abstain') AS drep_abstain_count
          FROM proposal_votes
          WHERE LOWER(voter_role) = 'drep'
          GROUP BY proposal_id
        ) vc ON p.id = vc.proposal_id
        WHERE v.voter IN (${placeholders})
      ) t
      WHERE row_num = 1
      ORDER BY COALESCE(block_time, created_at) DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rawVotes = await this.voltaireDb.query(dataQuery, queryParams);

    return {
      data: rawVotes.map((vote) => ({
        tx_hash: vote.proposal_tx_hash || vote.vote_tx_hash,
        vote_tx_hash: vote.vote_tx_hash,
        proposal_tx_hash: vote.proposal_tx_hash,
        vote: vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1),
        proposal_id: vote.proposal_id,
        gov_action_proposal_id: vote.proposal_id,
        gov_action_hash: vote.proposal_anchor_hash,
        time_voted: vote.block_time ? new Date(vote.block_time).toISOString() : (vote.created_at ? new Date(vote.created_at).toISOString() : new Date().toISOString()),
        type: vote.governance_type || 'InfoAction',
        governance_type: vote.governance_type || null,
        expiration_epoch: vote.expiration_epoch ? Number(vote.expiration_epoch) : null,
        ratified_epoch: vote.ratified_epoch ? Number(vote.ratified_epoch) : null,
        enacted_epoch: vote.enacted_epoch ? Number(vote.enacted_epoch) : null,
        dropped_epoch: vote.dropped_epoch ? Number(vote.dropped_epoch) : null,
        expired_epoch: vote.expired_epoch ? Number(vote.expired_epoch) : null,
        drep_yes_count: Number(vote.drep_yes_count) || 0,
        drep_no_count: Number(vote.drep_no_count) || 0,
        drep_abstain_count: Number(vote.drep_abstain_count) || 0,
        description: {
          tag: vote.governance_type || 'InfoAction',
        },
        proposal: {
          title: vote.title || null,
          abstract: vote.abstract || null,
          rationale: vote.rationale || null,
          type: vote.governance_type || null,
          anchorHash: vote.proposal_anchor_hash,
          txHash: vote.proposal_tx_hash,
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
    const canonicalId = await this.resolveDrepId(drepVoterId);

    if (!canonicalId) {
      throw new NotFoundException('DRep not found in database!');
    }

    // Get from enhanced dreps table
    const drepData = await this.voltaireDb.getRepository(Drep).findOne({
      where: { drepId: canonicalId },
    });

    if (!drepData) {
      throw new NotFoundException('DRep not found in database!');
    }

    // Get voltaire drep data (claimed profile info)
    const voltaireDrep = await this.getByVoterIdWithSignature(canonicalId);

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

  /**
   * Resolves a DRep ID to its canonical form in the database.
   * Handles CIP-105 (Short) to CIP-129 (Long) resolution via Hex fallback.
   */
  async resolveDrepId(voterId: string): Promise<string | null> {
    if (!voterId) return null;

    // 1. Try direct lookup
    const directMatch = await this.voltaireDb.getRepository(Drep).findOne({
      where: { drepId: ILike(voterId.trim()) },
      select: ['drepId']
    });
    if (directMatch) return directMatch.drepId;

    // 2. Try Hex Fallback
    try {
      const decoded = bech32.decode(voterId);
      const data = bech32.fromWords(decoded.words);
      const hex = Buffer.from(data).toString('hex');

      if (hex.length >= 56) {
        const hexMatch = await this.voltaireDb.getRepository(Drep).createQueryBuilder('drep')
          .where('LOWER(RIGHT(drep.hex, 56)) = LOWER(RIGHT(:hex, 56))', { hex })
          .getOne();

        if (hexMatch) return hexMatch.drepId;
      }
    } catch (e) {
      // Ignore decoding errors
    }

    return null;
  }

  /**
   * Returns ALL Drep IDs that match the given ID (direct or via Hex).
   * Useful for querying usage tables (votes, delegators) that might be keyed
   * by any of the valid aliases (CIP-105 or CIP-129).
   */
  async getAllDrepIds(voterId: string): Promise<string[]> {
    const ids = new Set<string>();

    // 1. Add input ID
    if (voterId) ids.add(voterId);

    // 2. Try to derive Hex
    try {
      const decoded = bech32.decode(voterId);
      const data = bech32.fromWords(decoded.words);
      const hex = Buffer.from(data).toString('hex');

      if (hex.length >= 56) {
        // Find ALL Dreps with this hex suffix
        const matches = await this.voltaireDb.getRepository(Drep).createQueryBuilder('drep')
          .where('LOWER(RIGHT(drep.hex, 56)) = LOWER(RIGHT(:hex, 56))', { hex })
          .select('drep.drepId')
          .getMany();

        matches.forEach(m => ids.add(m.drepId));
      }
    } catch (e) {
      // ignore
    }

    // 3. Also check if the input ID resolves to a canonical ID (reverse lookup)
    const canonical = await this.resolveDrepId(voterId);
    if (canonical) ids.add(canonical);

    return Array.from(ids);
  }
}
