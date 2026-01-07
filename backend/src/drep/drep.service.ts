import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createDrepDto, ValidateMetadataDTO } from 'src/dto';
import { faker } from '@faker-js/faker';
import * as blake from 'blakejs';
import { HttpService } from '@nestjs/axios';
import {
  catchError,
  firstValueFrom,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  scan,
  switchMap,
  timeout,
} from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  DRepDelegatorsHistoryResponse,
  DRepRegistrationData,
  DRepTimelineParams,
  EpochActivityResponse,
  IPFSResponse,
  LoggerMessage,
  MetadataStandard,
  MetadataValidationStatus,
  TimelineEntry,
  TimelineFilters,
  TimelineResponse,
  ValidateMetadataResult,
  VoterNoteResponse,
  VotingActivityHistory,
} from 'src/common/types';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { JsonLd } from 'jsonld/jsonld-spec';
import { Response } from 'express';
import { Currency } from 'src/common/enums';
import { Signature } from 'src/entities/signatures.entity';
import { MiscellaneousService } from 'src/miscellaneous/miscellaneous.service';
import { DRepRepository } from 'src/repository/voltaire/dRep.repository';
import { NoteRepository } from 'src/repository/voltaire/note.repository';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';
import { ReactionRepository } from 'src/repository/voltaire/reactions.repository';
import { CommentRepository } from 'src/repository/voltaire/comment.repository';
import { GovernanceService } from 'src/governance/governance.service';

@Injectable()
export class DrepService {
  constructor(
    private readonly drepRepository: DRepRepository,
    private readonly governanceService: GovernanceService,
    private readonly noteRepository: NoteRepository,
    private readonly reactionsRepository: ReactionRepository,
    private readonly commentRepository: CommentRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly httpService: HttpService,
    private readonly ipfsService: IpfsService,
    private readonly blockfrostService: BlockfrostService,
    private readonly miscService: MiscellaneousService,
  ) {}

  async getAllDReps(
    query?: string,
    currentPage?: number,
    itemsPerPage?: number,
    sort?: string,
    order?: string,
    onChainStatus?: 'active' | 'inactive',
    campaignStatus?: 'claimed' | 'unclaimed',
    includeRetired?: true | false,
    type?: 'has_script',
  ) {
    const result = await this.governanceService.getAllDReps(
      query || '',
      currentPage || 1,
      itemsPerPage || 24,
      sort,
      order as 'ASC' | 'DESC',
      onChainStatus,
      campaignStatus,
      includeRetired ?? false,
      type,
    );
      
    return {
      data: result.data,
      totalItems: result.pagination.total,
      currentPage: result.pagination.page,
      itemsPerPage: result.pagination.perPage,
      totalPages: result.pagination.totalPages,
    };
  }

  async getSingleDrepViaID(drepId: number) {
    return this.drepRepository.getSingleDrepViaID(drepId);
  }

  async getSingleDrepViaVoterID(drepVoterId: string) {
    try {
      return await this.drepRepository.getSingleDrepViaVoterID(drepVoterId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        try {
          const blockfrostDrep = await this.blockfrostService.getDRepInfo(drepVoterId);
          if (!blockfrostDrep) {
            throw new NotFoundException('DRep not found on onchain!');
          }
          
          let metadata = null;
          try {
            metadata = await this.blockfrostService.getDRepMetadata(drepVoterId);
          } catch (metadataError) {
            // Metadata is optional
          }
          return {
            view: blockfrostDrep.drep_id,
            chain_id: blockfrostDrep.hex,
            delegation_vote_count: 0,
            voting_power: (parseFloat(blockfrostDrep.amount || '0') / 1000000).toString(),
            live_stake: (parseFloat(blockfrostDrep.amount || '0') / 1000000).toString(),
            epoch_no: blockfrostDrep.active_epoch,
            retired: blockfrostDrep.retired,
            active: blockfrostDrep.active,
            metadata: metadata,
            metadata_url: metadata?.url || null,
            has_script: blockfrostDrep.has_script,
            given_name: metadata?.json_metadata?.body?.givenName || null,
            image_url: metadata?.json_metadata?.body?.image?.contentUrl || null,
            payment_address: metadata?.json_metadata?.body?.paymentAddress || null,
            objectives: metadata?.json_metadata?.body?.objectives || null,
            motivations: metadata?.json_metadata?.body?.motivations || null,
            qualifications: metadata?.json_metadata?.body?.qualifications || null,
            governance_vote_count: 0,
            deposit: null,
            active_until: null,
            is_registered_as_sole_voter: false,
            stake_address: null,
            reg_address: null,
            type: blockfrostDrep.has_script ? 'scripted' : 'drep'
          };
        } catch (blockfrostError) {
          throw new NotFoundException(blockfrostError,'DRep not found on onchain (fallback)!');
        }
      }
      throw error;
    }
  }

  async getDrepCexplorerDetails(drepVoterId: string) {
    return this.drepRepository.getDrepDetails(drepVoterId);
  }

  getDrepDateOfRegistration(
    drepVoterId: string,
  ): Observable<DRepRegistrationData | null> {
    return from(
      this.drepRepository.getDrepDateOfRegistration(drepVoterId),
    ).pipe(map((data) => data[0] || null));
  }

  private getFilters(filterValues?: string[] | undefined): TimelineFilters {
    const showAll = !filterValues || filterValues?.length === 0;

    return {
      includeVotingActivity: showAll || filterValues.includes('va'),
      includeDelegations: showAll || filterValues.includes('d'),
      includeNotes: showAll || filterValues.includes('n'),
      includeClaimedProfile: true,
      includeRegistration: true,
    };
  }

  async verifyOwnership(
    voterId: string,
    drepId: string,
  ): Promise<{ result: boolean; message: string; signatures?: Signature[] }> {
    try {
      if (!voterId || !drepId) {
        return {
          result: false,
          message: 'Too few arguments',
        };
      }

      const res = await this.drepRepository.verifyOwnership(voterId, drepId);

      if (voterId === drepId) {
        return {
          result: true,
          message: 'Ownership verified',
          signatures: res,
        };
      }

      if (!res) {
        return {
          result: false,
          message: 'No signature found for this voterId',
        };
      }

      if (!res.some((signature) => signature.drep_bech32 == drepId)) {
        return {
          result: false,
          message: 'Ownership verification failed',
          signatures: res,
        };
      }

      return {
        result: true,
        message: 'Ownership verified',
        signatures: Array.isArray(res) ? res : [res],
      };
    } catch (error) {
      throw new HttpException(
        'Failed to verify ownership',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getTimeRange(
    startTimeCursor?: number,
    endTimeCursor?: number,
  ): { startingTime: Date; endingTime: Date } {
    const endingTime = endTimeCursor
      ? new Date(Number(endTimeCursor))
      : new Date();
    const startingTime = startTimeCursor
      ? new Date(Number(startTimeCursor))
      : new Date(endingTime.getTime() - 432000000); // 5 days ago
    return { startingTime, endingTime };
  }

  private createTimelineEntries<T extends { [key: string]: any }>(
    data: T[],
    type: string,
    timestampField: keyof T,
  ): TimelineEntry[] {
    return data.map((item) => ({
      ...item,
      type,
      timestamp: item[timestampField],
    }));
  }

  private isWithinTimeRange(
    timestamp: string | Date,
    startTime: Date,
    endTime: Date,
  ): boolean {
    const time = new Date(timestamp).getTime();
    return startTime.getTime() < time && endTime.getTime() > time;
  }

  async getDrepTimelineOptimized(
    voterId: string,
    options: {
      startTimeCursor?: number;
      endTimeCursor?: number;
      filterValues?: string[];
      minItems?: number;
      loadDirection?: 'older' | 'newer';
    } = {},
  ) {
    const result = await this.governanceService.getDRepTimeline(voterId, options);
    return {
      appliedStartTime: options.startTimeCursor || Date.now() - 432000000, // 5 days ago default
      appliedEndTime: options.endTimeCursor || Date.now(),
      entries: result.events,
    };
  }

  getDrepTimelineWithMinItemsLegacy({
    dRep,
    voterId,
    stakeKeyBech32,
    delegation,
    endTimeCursor,
    startTimeCursor,
    filterValues,
    minItems = 10,
    recursionDepth = 0,
    maxRecursionDepth = 3,
    loadDirection = 'older',
  }): Observable<TimelineResponse> {
    const endTime = Number(endTimeCursor) || Date.now();
    const startTime = Number(startTimeCursor) || Date.now();

    return this.getDrepTimeline({
      dRep,
      voterId,
      stakeKeyBech32,
      delegation,
      startTimeCursor: startTime,
      endTimeCursor: endTime,
      filterValues,
    }).pipe(
      switchMap((timelineEntries) => {
        if (
          timelineEntries.length >= minItems ||
          recursionDepth >= maxRecursionDepth
        ) {
          return of({
            appliedStartTime: startTime,
            appliedEndTime: endTime,
            entries: timelineEntries,
          });
        }

        let newStartDate: number, newEndDate: number;
        const timeExtension =
          2 * 24 * 60 * 60 * 1000 * Math.pow(2, recursionDepth);

        if (loadDirection === 'older') {
          newEndDate = startTime - 1 * 24 * 60 * 60 * 1000;
          newStartDate = newEndDate - timeExtension;
        } else {
          // For 'newer' direction
          const currentTime = Date.now();
          newStartDate = endTime + 1 * 24 * 60 * 60 * 1000;

          if (newStartDate >= currentTime) {
            return of({
              appliedStartTime: startTime,
              appliedEndTime: endTime,
              entries: timelineEntries,
            });
          }
          newEndDate = Math.min(newStartDate + timeExtension, currentTime);
        }

        return this.getDrepTimelineWithMinItemsLegacy({
          dRep,
          voterId,
          stakeKeyBech32,
          delegation,
          startTimeCursor: newStartDate,
          endTimeCursor: newEndDate,
          filterValues,
          minItems: minItems - timelineEntries.length,
          recursionDepth: recursionDepth + 1,
          maxRecursionDepth,
          loadDirection,
        }).pipe(
          map((newResult) => {
            const allEntries = [...timelineEntries, ...newResult.entries];

            const uniqueEntries = Array.from(
              new Map(
                allEntries.map((entry) => [
                  `${new Date(entry.timestamp).getTime()}-${entry.type}`,
                  entry,
                ]),
              ).values(),
            );

            uniqueEntries.sort((a, b) => {
              return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
              );
            });

            return {
              appliedStartTime: Number(
                loadDirection === 'older'
                  ? newResult.appliedStartTime
                  : startTime,
              ),
              appliedEndTime: Number(
                loadDirection === 'newer' ? newResult.appliedEndTime : endTime,
              ),
              entries: uniqueEntries,
            };
          }),
        );
      }),
      catchError((error) => {
        console.error('Error in recursive timeline fetching:', error);
        throw new Error('Failed to fetch DRep timeline data recursively');
      }),
    );
  }

  getDrepTimelineWithMinItems({
    dRep,
    voterId,
    stakeKeyBech32,
    delegation,
    endTimeCursor,
    startTimeCursor,
    filterValues,
    minItems = 10,
    recursionDepth = 0,
    maxRecursionDepth = 3,
    loadDirection = 'older',
  }): Observable<TimelineResponse> {
    // Use governance indexer timeline with proper event type mapping
    return from(this.governanceService.getDRepTimeline(voterId, {
      startTimeCursor: Number(startTimeCursor),
      endTimeCursor: Number(endTimeCursor),
      filterValues,
      minItems,
      loadDirection: loadDirection as 'older' | 'newer'
    })).pipe(
      map(result => ({
        appliedStartTime: startTimeCursor || Date.now(),
        appliedEndTime: endTimeCursor || Date.now(),
        entries: result.events
      }))
    );
  }

  async getOptimizedDrepTimeline({
    voterId,
    startTimeCursor,
    endTimeCursor,
    filterValues,
    minItems = 10,
    loadDirection = 'older'
  }): Promise<TimelineResponse> {
    try {
      const timelineData = await this.governanceService.getDRepTimeline(voterId, {
        startTimeCursor,
        endTimeCursor,
        filterValues,
        minItems,
        loadDirection: loadDirection as 'older' | 'newer'
      });

      // Convert governance indexer timeline to expected format
      const entries = timelineData.events.map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        epochNo: event.epochNo,
        ...event.payload
      }));

      // Enrich delegation activities with current stake information
      const enrichedEntries = await this.enrichDelegationActivitiesWithStake(entries);

      return {
        appliedStartTime: startTimeCursor || Date.now(),
        appliedEndTime: endTimeCursor || Date.now(), 
        entries: enrichedEntries
      };
    } catch (error) {
      console.error('Error fetching optimized timeline:', error);
      // Fallback to legacy method
      return this.getLegacyDrepTimelineWithMinItems({
        voterId,
        startTimeCursor,
        endTimeCursor,
        filterValues,
        minItems,
        loadDirection
      });
    }
  }

  async getLegacyDrepTimelineWithMinItems({
    voterId,
    startTimeCursor,
    endTimeCursor,
    filterValues,
    minItems = 10,
    loadDirection = 'older'
  }): Promise<TimelineResponse> {
    // Simple fallback that returns empty timeline
    console.warn('Using legacy timeline fallback - returning empty timeline');
    return {
      appliedStartTime: startTimeCursor || Date.now(),
      appliedEndTime: endTimeCursor || Date.now(),
      entries: []
    };
  }

  getDrepTimeline({
    dRep,
    voterId,
    stakeKeyBech32,
    delegation,
    startTimeCursor,
    endTimeCursor,
    filterValues,
  }: DRepTimelineParams): Observable<TimelineEntry[]> {
    const filters = this.getFilters(filterValues);
    const { startingTime, endingTime } = this.getTimeRange(
      startTimeCursor,
      endTimeCursor,
    );
    const drepId = dRep?.drep_id;

    // Setting up observables for parallel data fetching
    const queries: Record<string, Observable<any>> = {
      epochs: this.getEpochs(startingTime, endingTime),
      regData: filters.includeRegistration
        ? this.getDrepDateOfRegistration(voterId)
        : of(null),
      votingHistory: filters.includeVotingActivity
        ? this.getDrepVotingActivity(voterId, startingTime, endingTime)
        : of<VotingActivityHistory[]>([]),
      delegatorsHistory: filters.includeDelegations
        ? this.getDrepDelegators(voterId, startingTime, endingTime)
        : of<DRepDelegatorsHistoryResponse>([]),
      notes:
        filters.includeNotes && drepId
          ? this.getDRepNotes(
              drepId,
              startingTime,
              endingTime,
              stakeKeyBech32,
              delegation,
            )
          : of<VoterNoteResponse>([]),
    };

    return from(Object.keys(queries)).pipe(
      mergeMap((key) => queries[key].pipe(map((result) => ({ key, result })))),
      scan(
        (acc, { key, result }) => {
          acc[key] = result;
          return acc;
        },
        {} as Record<string, any>,
      ),
      map((results) => {
        const timelineEntries: TimelineEntry[] = [];

        // Ensure epochs result exists before mapping
        if (results.epochs) {
          timelineEntries.push(
            ...this.createTimelineEntries(
              results.epochs,
              'epoch',
              'start_time',
            ),
          );
        }

        // Ensure votingHistory result exists before mapping
        if (results.votingHistory) {
          timelineEntries.push(
            ...this.createTimelineEntries(
              results.votingHistory,
              'voting_activity',
              'time_voted',
            ),
          );
        }

        // Ensure notes result exists before mapping
        if (results.notes) {
          timelineEntries.push(
            ...this.createTimelineEntries(
              results.notes,
              'note',
              'note_updatedAt',
            ),
          );
        }

        // Add delegators history directly
        if (results.delegatorsHistory) {
          timelineEntries.push(...results.delegatorsHistory);
        }

        // Process claimed profile
        if (
          filters.includeClaimedProfile &&
          drepId &&
          dRep?.drep_createdAt &&
          this.isWithinTimeRange(dRep.drep_createdAt, startingTime, endingTime)
        ) {
          timelineEntries.push({
            type: 'claimed_profile',
            timestamp: dRep.drep_createdAt,
            claimingId: drepId,
            claimedDRepId: voterId,
          });
        }

        // Process registration data
        const regDate = results.regData?.date_of_registration;
        if (
          filters.includeRegistration &&
          regDate &&
          this.isWithinTimeRange(regDate, startingTime, endingTime)
        ) {
          timelineEntries.push({
            type: 'registration',
            timestamp: regDate,
            tx_hash: results.regData.reg_tx_hash,
            epoch_no: results.regData.epoch_of_registration,
          });
        }

        // Remove duplicate timeline entries based on a unique identifier (e.g., timestamp and type)
        const uniqueEntries = Array.from(
          new Map(
            timelineEntries.map((entry) => [
              `${new Date(entry.timestamp).getTime()}-${entry.type}`,
              entry,
            ]),
          ).values(),
        );

        // Sort timeline entries by timestamp (latest first)
        uniqueEntries.sort((a, b) => {
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        return uniqueEntries;
      }),
      timeout(100000),
      catchError((error) => {
        console.error('Error fetching DRep timeline data:', error);
        throw new Error('Failed to fetch DRep timeline data');
      }),
    );
  }

  getEpochs(
    startingTime: Date,
    endingTime: Date,
  ): Observable<EpochActivityResponse[]> {
    return from(this.drepRepository.getEpochs(startingTime, endingTime)).pipe(
      map((epochs) =>
        epochs.map((epoch) => ({
          ...epoch,
          type: 'epoch',
          timestamp: epoch.start_time,
        })),
      ),
    );
  }

  getDrepVotingActivity(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ): Observable<VotingActivityHistory[]> {
    return from(
      this.drepRepository.getDrepVotingActivity(
        drepVoterId,
        startingTime,
        endingTime,
      ),
    );
  }

  getDRepNotes(
    drepId: number,
    startingTime: Date,
    endingTime: Date,
    stakeKeyBech32?: string,
    delegation?: any,
  ): Observable<VoterNoteResponse> {
    return from(
      this.noteRepository.getDRepNotesWithVisibility(
        drepId,
        startingTime,
        endingTime,
        stakeKeyBech32,
        delegation,
      ),
    ).pipe(
      switchMap((allNotes) => {
        if (allNotes.length === 0) {
          return of([]);
        }

        // Using forkJoin to run reactions and comments observables for all notes
        const noteObservables = allNotes.map((note) => {
          return forkJoin({
            reactions: from(
              this.reactionsRepository.findByParent(note.note_id, 'note'),
            ),
            comments: from(
              this.commentRepository.getCommentsWithReactionsAndReplies(
                note.note_id,
                'note',
              ),
            ),
          }).pipe(
            map((result) => ({
              ...note,
              reactions: result.reactions,
              comments: result.comments,
              type: 'note',
            })),
          );
        });

        return forkJoin(noteObservables);
      }),
      catchError((error) => {
        console.error('Error fetching DRep notes:', error);
        return of([]);
      }),
    );
  }

  async populateFakeDRepData() {
    const dreps = await this.drepRepository.getAllDReps({});
    // Seeding
    const modified = dreps.data.map((drep) => {
      return {
        ...drep,
        name: faker.person.fullName(),
        bio: faker.lorem.sentences(2),
      };
    });
    await this.drepRepository.insertMany(modified);
    return modified;
  }

  async registerDrep(drepDto: createDrepDto) {
    try {
      const insertedDrep = await this.drepRepository.createDrep(drepDto);
      const signatureDto = {
        drepId: insertedDrep.identifiers[0].id,
        voterId: drepDto?.voter_id,
        stakeKey: drepDto?.stake_addr,
        signatures: drepDto?.signatures,
        drep_bech32: drepDto?.drep_bech32,
      };
      await this.signatureRepository.linkSignaturesToDRepWithTransaction(
        signatureDto,
      );
      return { insertedDrep };
    } catch (error) {
      console.error('Error registering DRep:', error);
      throw new HttpException(
        'Failed to register DRep',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEpochParams() {
    try {
      return await this.blockfrostService.getEpochParameters();
    } catch (error) {
      console.error('Blockfrost API call failed:', error);
      try {
        // Fallback to drep repository
        const fallbackResponse = await this.drepRepository.getEpochParams();
        if (fallbackResponse) {
          const modifiedRes = {
            ...fallbackResponse[0],
            nonce: String(fallbackResponse[0]?.nonce).slice(2),
            hash: String(fallbackResponse[0]?.hash).slice(2),
          };
          return modifiedRes;
        }
        return null;
      } catch (fallbackError) {
        console.error('Fallback to drep repository failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async getDrepDelegatorsWithVotingPower(
    drepVoterId: string,
    currentPage: number,
    itemsPerPage: number,
    sort?: string,
    order?: string,
  ) {
    return this.drepRepository.getDrepDelegatorsWithVotingPower(
      drepVoterId,
      currentPage,
      itemsPerPage,
      sort,
      order,
    );
  }


  async updateDrepInfo(drepId: number, drep: createDrepDto) {
    const foundDrep = await this.drepRepository.findById(drepId);

    if (!foundDrep) {
      throw new NotFoundException('Drep to be updated not found!');
    }

    // Clean up the DTO
    delete drep.signatures;
    delete drep.stake_addr;
    delete drep.voter_id;
    delete drep.drep_bech32;

    const updatedDrep = Object.keys(drep).reduce((acc, key) => {
      let value = drep[key];
      try {
        value = JSON.parse(value);
      } catch (e) {
        // ignore
      }
      return { ...acc, [key]: value };
    }, {});

    return this.drepRepository.updateDrep(drepId, updatedDrep);
  }

  async validateMetadata({
    hash,
    url,
    standard = MetadataStandard.CIP100,
  }: ValidateMetadataDTO): Promise<
    Observable<AxiosResponse<ValidateMetadataResult, any>>
  > {
    let status: MetadataValidationStatus | undefined;
    let metadata: any = null;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url).pipe(
          catchError(() => {
            throw MetadataValidationStatus.URL_NOT_FOUND;
          }),
        ),
      );

      Logger.debug(LoggerMessage.METADATA_DATA, data);

      const hashedMetadata = blake.blake2bHex(
        JSON.stringify(data),
        undefined,
        32,
      );
      if (hashedMetadata !== hash) {
        throw MetadataValidationStatus.INVALID_HASH;
      }
      metadata = data;
    } catch (error) {
      Logger.error(LoggerMessage.METADATA_VALIDATION_ERROR, error);
      if (Object.values(MetadataValidationStatus).includes(error)) {
        status = error as MetadataValidationStatus;
      }
    }

    return { status, valid: !Boolean(status), metadata } as any;
  }

  async saveMetadata(metadata: any) {
    // Create a new metadata record in IPFS
    const { ipfs_hash, state } = await this.saveMetadataToIPFS(metadata);
    return { content: ipfs_hash, state };
  }

  async saveMetadataToIPFS(metadata: JsonLd): Promise<IPFSResponse> {
    try {
      // Save to IPFS via blockfrost
      const metadataStr = JSON.stringify(metadata);
      const binary = Buffer.from(metadataStr);

      // Prepare the FormData
      const formData = new FormData();
      formData.append('file', binary as any);
      return await this.ipfsService.uploadAttachmentToIPFS(formData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getMetadataFromIPFS(hash: string, res: Response): Promise<JsonLd> {
    try {
      return await this.ipfsService.getAttachmentFromIPFS(hash, res);
    } catch (error) {
      console.error(error);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStats(drepVoterId: string) {
    return this.drepRepository.getDrepStats(drepVoterId);
  }

  /**
   * Enriches delegation activity entries with current stake information
   * This adds voting power data where available from the current delegator table
   */
  private async enrichDelegationActivitiesWithStake(activities: any[]): Promise<any[]> {
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        if (activity.type === 'delegation' && activity.stake_address) {
          try {
            // Look up current stake info for this address using raw query
            const currentDelegation = await this.drepRepository.query(`
              SELECT drep_id, stake_address, amount_lovelace, voting_power_lovelace
              FROM drep_delegators 
              WHERE stake_address = $1
              LIMIT 1
            `, [activity.stake_address]);
            
            if (currentDelegation && currentDelegation.length > 0) {
              const delegation = currentDelegation[0];
              return {
                ...activity,
                // Add current stake information
                current_stake_lovelace: delegation.amount_lovelace,
                current_stake_ada: delegation.amount_lovelace 
                  ? (parseFloat(delegation.amount_lovelace) / 1_000_000).toFixed(6)
                  : '0',
                current_voting_power_lovelace: delegation.voting_power_lovelace,
                current_voting_power_ada: delegation.voting_power_lovelace 
                  ? (parseFloat(delegation.voting_power_lovelace) / 1_000_000).toFixed(6)
                  : '0',
                current_delegated_drep: delegation.drep_id,
                delegation_status: delegation.drep_id === activity.target_drep 
                  ? 'still_delegated' : 'delegated_elsewhere',
                has_current_stake_info: true
              };
            } else {
              return {
                ...activity,
                current_stake_ada: '0',
                current_voting_power_ada: '0',
                delegation_status: 'no_current_delegation',
                has_current_stake_info: false
              };
            }
          } catch (error) {
            console.warn('Error enriching delegation with stake info:', error);
            return {
              ...activity,
              has_current_stake_info: false
            };
          }
        }
        return activity;
      })
    );
    
    return enrichedActivities;
  }

  getDrepDelegators(
    drepVoterId: string,
    startingTime: Date,
    endingTime: Date,
  ): Observable<DRepDelegatorsHistoryResponse> {
    return from(
      this.drepRepository.getDrepDelegators(
        drepVoterId,
        startingTime,
        endingTime,
      ),
    );
  }

  async isDrepRegistered(voterId: string) {
    return this.drepRepository.isDrepRegistered(voterId);
  }

  async getMetadata(voterId: string) {
    const drepSnapshot = await this.governanceService.getSingleDRep(voterId);

    if (!drepSnapshot || !drepSnapshot.metadata) {
      try {
        const blockfrostMetadata = await this.blockfrostService.getDRepMetadata(voterId);
        return blockfrostMetadata?.json_metadata || null;
      } catch (error) {
        if (!drepSnapshot) {
          throw new NotFoundException('DRep not found!');
        }
        return null;
      }
    }

    return drepSnapshot.metadata.json_metadata || null;
  }

  async getVoltaireDRepViaVoterID(drepVoterId: string) {
    return this.drepRepository.getVoltaireDRepViaVoterID(drepVoterId);
  }

  async getVoterProfileData(stakeKey: string) {
    try {
      const stakeKeyInfo =
        await this.blockfrostService.getStakeAddressInfo(stakeKey);

      const profileData =
        await this.drepRepository.getVoterProfileData(stakeKey);

      if (!profileData.delegation) {
        return {
          walletBalance: stakeKeyInfo?.controlled_amount ?? null,
          delegatedToDRepView: null,
          delegatedToDRepRaw: null,
          delegatedToVotingPower: null,
          has_script: false,
          delegatedToIsRegistered: false,
          isDrep: false,
        };
      }

      if (!profileData.registration) {
        return {
          walletBalance: stakeKeyInfo?.controlled_amount ?? null,
          delegatedToDRepView: profileData.delegation.drep_view,
          delegatedToDRepRaw: profileData.delegation.drep_raw,
          delegatedToVotingPower: profileData.delegation.voting_power,
          has_script: profileData.delegation.has_script,
          delegatedToIsRegistered: false,
          isDrep: false,
        };
      }

      const isDrep =
        profileData.registration.stake_address_id ===
        profileData.delegation.stake_address_id;

      if (!isDrep) {
        return {
          walletBalance: stakeKeyInfo?.controlled_amount ?? null,
          delegatedToDRepView: profileData.delegation.drep_view,
          delegatedToDRepRaw: profileData.delegation.drep_raw,
          delegatedToVotingPower: profileData.delegation.voting_power,
          has_script: profileData.delegation.has_script,
          delegatedToIsRegistered:
            profileData.registration.deposit === null ||
            profileData.registration.deposit > 0,
          isDrep: false,
        };
      }

      return {
        walletBalance: stakeKeyInfo?.controlled_amount ?? null,
        selfDRepView: profileData.registration.view,
        selfDRepRaw: profileData.registration.raw,
        selfVotingPower: profileData.registration.voting_power,
        has_script: profileData.delegation.has_script,
        selfIsRegistered:
          profileData.registration.deposit === null ||
          profileData.registration.deposit > 0,
        isDrep,
      };
    } catch (error) {
      console.error('Error in getVoterProfileData:', error);
      return {
        isDrep: false,
        error: 'Failed to retrieve DRep profile data',
      };
    }
  }

  async getClaimedProfiles(voterId: string) {
    return this.drepRepository.getClaimedProfiles(voterId);
  }

  async getGovernanceParticipation(voterId: string) {
    if (!voterId) return null;
    
    try {
      // First try to get from repository (with fallback counting)
      const participation = await this.drepRepository.getGovernanceParticipation(voterId);
      
      // If both counts are zero, the DRep might not be in our database - try to fetch from Blockfrost
      if (participation.governance_vote_count === 0 && participation.delegation_vote_count === 0) {
        await this.fetchAndUpsertMissingDRep(voterId);
        
        // Re-query after potential upsert
        return await this.drepRepository.getGovernanceParticipation(voterId);
      }
      
      return participation;
    } catch (error) {
      console.error(`Error getting governance participation for ${voterId}:`, error);
      return {
        governance_vote_count: 0,
        delegation_vote_count: 0,
      };
    }
  }
  
  private async fetchAndUpsertMissingDRep(voterId: string) {
    try {

      
      // Check if DRep exists on Blockfrost
      const blockfrostDrep = await this.blockfrostService.getDRepInfo(voterId);
      if (!blockfrostDrep) {

        return;
      }
      
      // Get metadata if available
      let metadata = null;
      try {
        metadata = await this.blockfrostService.getDRepMetadata(voterId);
      } catch (metadataError) {

      }
      
      // Upsert DRep data using DataSource (since drepRepository extends from Voltaire DRep, not enhanced Drep)
      const { Drep } = await import('../entities/governance/drep.entity');
      
      // We need to access the voltaire DB from the repository
      const drepsRepository = this.drepRepository['voltaireDb'].getRepository(Drep);
      await drepsRepository.upsert({
        drepId: blockfrostDrep.drep_id,
        hex: blockfrostDrep.hex,
        amountLovelace: blockfrostDrep.amount || '0',
        active: blockfrostDrep.active,
        activeEpoch: blockfrostDrep.active_epoch,
        hasScript: blockfrostDrep.has_script,
        retired: blockfrostDrep.retired,
        expired: blockfrostDrep.expired,
        lastActiveEpoch: blockfrostDrep.last_active_epoch,
        metadata: metadata || null,
        votingPowerAda: blockfrostDrep.amount ? (parseInt(blockfrostDrep.amount) / 1_000_000).toString() : '0',
        governanceVoteCount: 0, 
        delegationVoteCount: 0, 
      }, {
        conflictPaths: ['drepId'],
        skipUpdateIfNoValuesChanged: true,
      });
      

      
      // Fetch and upsert delegators (in background, don't wait)
      this.fetchAndUpsertDelegators(voterId).catch(error => 
        console.error(`Error fetching delegators for ${voterId}:`, error)
      );
      
      // Fetch and upsert votes (in background, don't wait)
      this.fetchAndUpsertVotes(voterId).catch(error => 
        console.error(`Error fetching votes for ${voterId}:`, error)
      );
      
    } catch (error) {
      console.error(`Error fetching and upserting DRep ${voterId}:`, error);
    }
  }
  
  private async fetchAndUpsertDelegators(voterId: string) {
    try {

      
      const { DrepDelegator } = await import('../entities/governance/drep-delegator.entity');
      const delegatorsRepository = this.drepRepository['voltaireDb'].getRepository(DrepDelegator);
      
      // Get delegators from Blockfrost
      const blockfrostDelegators = await this.blockfrostService.getDRepDelegators(voterId);
      
      if (!blockfrostDelegators || blockfrostDelegators.length === 0) {

        return;
      }
      

      
      // Clear existing delegators for this DRep
      await delegatorsRepository.delete({ drepId: voterId });
      
      // Upsert new delegators
      for (const delegator of blockfrostDelegators) {
        try {
          // Get voting power (controlled stake) for this delegator
          let votingPowerLovelace: string | null = null;
          try {
            const stakeInfo = await this.blockfrostService.getStakeAddressInfo(delegator.address);
            votingPowerLovelace = stakeInfo?.controlled_amount || null;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (stakeInfoError) {
            console.warn(`Failed to get stake info for ${delegator.address}:`, stakeInfoError.message);
          }
          
          await delegatorsRepository.upsert({
            drepId: voterId,
            stakeAddress: delegator.address,
            amountLovelace: delegator.amount,
            votingPowerLovelace,
          }, {
            conflictPaths: ['drepId', 'stakeAddress'],
            skipUpdateIfNoValuesChanged: true,
          });
        } catch (delegatorError) {
          console.warn(`Failed to upsert delegator ${delegator.address}:`, delegatorError.message);
        }
      }
      
      // Update delegation count in dreps table
      const { Drep } = await import('../entities/governance/drep.entity');
      const drepsRepository = this.drepRepository['voltaireDb'].getRepository(Drep);
      await drepsRepository.update(
        { drepId: voterId },
        { delegationVoteCount: blockfrostDelegators.length }
      );
      

      
    } catch (error) {
      console.error(`Error fetching and upserting delegators for ${voterId}:`, error);
    }
  }
  
  private async fetchAndUpsertVotes(voterId: string) {
    try {

      
      const { ProposalVote } = await import('../entities/governance/proposal-vote.entity');
      const { Proposal } = await import('../entities/governance/proposal.entity');
      const votesRepository = this.drepRepository['voltaireDb'].getRepository(ProposalVote);
      const proposalsRepository = this.drepRepository['voltaireDb'].getRepository(Proposal);
      
      // Get votes from Blockfrost
      let allVotes = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          const blockfrostVotes = await this.blockfrostService.getDRepVotes(voterId, page, 100, 'asc');
          
          if (!blockfrostVotes || blockfrostVotes.length === 0) {
            hasMore = false;
            break;
          }
          
          allVotes.push(...blockfrostVotes);
          
          if (blockfrostVotes.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pageError) {
          console.warn(`Failed to fetch votes page ${page} for ${voterId}:`, pageError.message);
          hasMore = false;
        }
      }
      
      if (allVotes.length === 0) {

        return;
      }
      

      
      // Clear existing votes for this DRep
      await votesRepository.delete({ voter: voterId });
      
      let insertedVotes = 0;
      
      // Upsert votes
      for (const vote of allVotes) {
        try {
          // Check if the proposal exists in our database
          const proposalExists = await proposalsRepository.findOne({
            where: { id: vote.proposal_id }
          });
          
          if (!proposalExists) {
            // Skip votes for proposals that don't exist in our database

            continue;
          }
          
          await votesRepository.upsert({
            proposalId: vote.proposal_id,
            txHash: vote.tx_hash,
            certIndex: vote.cert_index,
            voterRole: 'drep',
            voter: voterId,
            vote: vote.vote,
          }, {
            conflictPaths: ['proposalId', 'voter'],
            skipUpdateIfNoValuesChanged: true,
          });
          
          insertedVotes++;
        } catch (voteError) {
          console.warn(`Failed to upsert vote ${vote.tx_hash}:`, voteError.message);
        }
      }
      
      // Update governance vote count in dreps table
      const { Drep } = await import('../entities/governance/drep.entity');
      const drepsRepository = this.drepRepository['voltaireDb'].getRepository(Drep);
      await drepsRepository.update(
        { drepId: voterId },
        { governanceVoteCount: insertedVotes }
      );
      

      
    } catch (error) {
      console.error(`Error fetching and upserting votes for ${voterId}:`, error);
    }
  }

  async getDRepVotedGovActions(
    voterId: string,
    currentPage: number,
    itemsPerPage: number,
  ) {
    return this.drepRepository.getDRepVotedGovActions(
      voterId,
      currentPage,
      itemsPerPage,
    );
  }
}
