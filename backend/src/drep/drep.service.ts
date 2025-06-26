import {
  BadRequestException,
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
import { ReactionsService } from 'src/reactions/reactions.service';
import { CommentsService } from 'src/comments/comments.service';
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
import { AuthService } from 'src/auth/auth.service';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { JsonLd } from 'jsonld/jsonld-spec';
import { Response } from 'express';
import { Currency } from 'src/common/enums';
import { Signature } from 'src/entities/signatures.entity';
import { MiscellaneousService } from 'src/miscellaneous/miscellaneous.service';
import { QueueService } from 'src/queue/queue.service';
import { DRepClaimJobData, JobTypes, Queues } from 'src/queue/queue.types';
import { DRepRepository } from 'src/repository/voltaire/dRep.repository';
import { NoteRepository } from 'src/repository/voltaire/note.repository';
import { IpfsService } from 'src/ipfs/ipfs.service';

@Injectable()
export class DrepService {
  constructor(
    private readonly drepRepository: DRepRepository,
    private readonly noteRepository: NoteRepository,
    private readonly ipfsService: IpfsService,
    private readonly reactionsService: ReactionsService,
    private readonly commentsService: CommentsService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
    private readonly blockfrostService: BlockfrostService,
    private readonly miscService: MiscellaneousService,
    private readonly queueService: QueueService,
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
    const sortColumn =
      {
        voting_power: 'voting_power',
        live_stake: 'live_stake',
        delegators: 'delegation_vote_count',
        votes: 'governance_vote_count',
      }[sort] || null;

    const sortOrder = !!order ? order.toUpperCase() : null;

    let dRepViews: string[];
    if (campaignStatus) {
      const voltaireDReps = await this.drepRepository.getAllWithSignatures();
      dRepViews = voltaireDReps.map((drep) => drep.signature_drep_bech32);
    }

    const drepList = await this.drepRepository.getAllDReps({
      query,
      currentPage,
      itemsPerPage,
      sortColumn,
      sortOrder,
      onChainStatus,
      campaignStatus,
      includeRetired,
      dRepViews,
      type,
    });

    const drepViews = drepList.data.map((drep) => drep.view);
    const voltaireDReps = await this.drepRepository.getByViews(drepViews);
    const totalPages = Math.ceil(drepList.totalItems / itemsPerPage);

    const mergedDRepsData = drepList.data.map((drep) => {
      const voltaireDrep = voltaireDReps.find(
        (voltaireDrep) => voltaireDrep.signature_drep_bech32 === drep.view,
      );

      // Account for voting options
      if (
        drep?.view &&
        (drep?.view.includes('drep_always_abstain') ||
          drep?.view.includes('drep_always_no_confidence'))
      ) {
        drep['type'] = 'voting_option';
      } else if (!!drep?.has_script) {
        drep['type'] = 'scripted';
      } else {
        drep['type'] = 'drep';
      }

      return {
        ...drep,
        ...(voltaireDrep ? voltaireDrep : {}),
        // Convert currency
        voting_power:
          drep.voting_power != null
            ? (drep.voting_power / Currency.LOVELACETOADA).toFixed(1)
            : null,
        live_stake:
          drep.live_stake != null
            ? (drep.live_stake / Currency.LOVELACETOADA).toFixed(1)
            : null,
      };
    });

    return {
      data: mergedDRepsData,
      totalItems: drepList.totalItems,
      currentPage,
      itemsPerPage,
      totalPages,
    };
  }

  async getSingleDrepViaID(drepId: number) {
    return this.drepRepository.getSingleDrepViaID(drepId);
  }

  async getSingleDrepViaVoterID(drepVoterId: string) {
    return this.drepRepository.getSingleDrepViaVoterID(drepVoterId);
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
          signatures: null,
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
          signatures: null,
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
      console.error('Error verifying ownership:', error);
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

        return this.getDrepTimelineWithMinItems({
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
    ).pipe(
      map((data) => data.map((item) => ({ ...item, type: 'voting_activity' }))),
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
              this.reactionsService.getReactions(note.note_id, 'note'),
            ),
            comments: from(
              this.commentsService.getComments(note.note_id, 'note'),
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
      const { token, insertedSig } = await this.authService.login(
        signatureDto,
        10000,
      );
      return { insertedDrep, insertedSig, token };
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
    let status: MetadataValidationStatus;
    let metadata: any;
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
    } catch (error) {
      Logger.error(LoggerMessage.METADATA_VALIDATION_ERROR, error);
      if (Object.values(MetadataValidationStatus).includes(error)) {
        status = error;
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
    const savedMetadata = await this.drepRepository.getDrepMetadata(voterId);

    if (!savedMetadata || !savedMetadata?.[0].metadata) {
      const metadata = await this.drepRepository.getDrepMetadataUrl(voterId);
      const metadataUrl = metadata?.[0]?.metadata_url;

      if (!metadataUrl) {
        throw new NotFoundException('metadata url not found!');
      }

      try {
        return await this.miscService.fetchWithIPFSFallback(metadataUrl);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
      }
    } else if (savedMetadata?.[0]) {
      return savedMetadata?.[0].metadata;
    }
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
    return this.drepRepository.getGovernanceParticipation(voterId);
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

  async checkDRepClaimStatus(stakeKey: string, signature: string, key: string) {
    try {
      if (!stakeKey) {
        throw new BadRequestException('Stake key is required');
      }

      const dRep = await this.drepRepository.checkDRepClaimStatus(stakeKey);

      if (dRep) {
        return {
          claimed: true,
          drepId: dRep.id,
          drepBech32: dRep.signatures[0].drep_bech32,
          voterId: dRep.signatures[0].voterId,
        };
      }

      this.queueService.addToQueue<DRepClaimJobData>(Queues.DREP_CLAIM, {
        name: JobTypes.DREP_CLAIM,
        data: {
          stakeKey,
          signature,
          signatureKey: key,
        },
      });

      return {
        claimed: false,
        message: 'DRep claim job has been queued successfully.',
      };
    } catch (error) {
      console.error('Error checking DRep claim status:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal Server Error',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
