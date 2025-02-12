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
import { AttachmentService } from 'src/attachment/attachment.service';
import {
  catchError,
  firstValueFrom,
  forkJoin,
  from,
  lastValueFrom,
  map,
  mergeMap,
  Observable,
  of,
  scan,
  switchMap,
  timeout,
} from 'rxjs';
import { AxiosResponse } from 'axios';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
  ValidateMetadataResult,
  VoterNoteResponse,
  VotingActivityHistory,
} from 'src/common/types';
import { AuthService } from 'src/auth/auth.service';
import { getAllDRepsQuery, getTotalResultsQuery } from 'src/queries/getDReps';
import {
  getDRepDelegatorsCountQuery,
  getDRepVotesCountQuery,
  getDRepVotingPowerQuery,
} from 'src/queries/drepStats';
import { getEpochParams } from 'src/queries/getEpochParams';
import { getDRepDelegatorsHistory } from 'src/queries/drepDelegatorsHistory';
import { JsonLd } from 'jsonld/jsonld-spec';
import { Response } from 'express';
import { getDrepCexplorerDetailsQuery } from 'src/queries/drepCexplorerDetails';
import {
  getDrepDelegatorsCountQuery,
  getDrepDelegatorsWithVotingPowerQuery,
} from 'src/queries/drepDelegatorsWithVotingPower';
import { BlockfrostService } from 'src/blockfrost/blockfrost.service';
import { drepRegistrationQuery } from 'src/queries/drepRegistration';
import { getDRepMetadataQuery } from 'src/queries/drepMetadata';
import { getDrepDateOfRegistrationQuery } from 'src/queries/drepDateOfRegistration';
import { getDrepVotingActivityQuery } from 'src/queries/drepVotingActivity';
import { Currency } from 'src/common/enums';
import { Signature } from 'src/entities/signatures.entity';

@Injectable()
export class DrepService {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
    private attachmentService: AttachmentService,
    private reactionsService: ReactionsService,
    private commentsService: CommentsService,
    private authService: AuthService,
    private readonly httpService: HttpService,
    private blockfrostService: BlockfrostService,
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
      }[sort] || null;

    const sortOrder = !!order ? order.toUpperCase() : null;

    let dRepViews: string[];

    if (campaignStatus) {
      const voltaireDReps = (await this.getAllDRepsVoltaire()) ?? [];
      dRepViews = voltaireDReps.map((drep) => drep.signature_drep_bech32);
    }

    const drepList = await this.getAllDRepsCexplorer(
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
    );

    const drepViews = drepList.data.map((drep) => drep.view);

    const voltaireDReps = await this.getVoltaireDRepsByViews(drepViews);

    const totalPages = Math.ceil(drepList.totalItems / itemsPerPage);

    const mergedDRepsData = drepList.data.map((drep) => {
      const voltaireDrep = voltaireDReps.find(
        (voltaireDrep) => voltaireDrep.signature_drep_bech32 === drep.view,
      );
      //account for voting options
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

  async getMedia(res: Response, assetUrl?: string) {
    try {
      const response = await this.httpService.axiosRef.get(assetUrl, {
        responseType: 'stream'
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

  async getAllDRepsCexplorer(
    query?: string,
    currentPage?: number,
    itemsPerPage?: number,
    sortColumn?: string,
    sortOrder?: string,
    onChainStatus?: 'active' | 'inactive',
    campaignStatus?: 'claimed' | 'unclaimed',
    includeRetired?: true | false,
    dRepViews?: string[],
    type?: 'has_script',
  ) {
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
    const drepList = await this.cexplorerService.manager.query(
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
    const totalResults = await this.cexplorerService.manager.query(
      getTotalResultsQuery(
        sanitizedSearchCondition,
        campaignStatusCondition,
        chainStatusCondition,
        typeCondition,
      ),
    );

    return {
      data: drepList.map((entry) => {
        return {
          ...entry,
          // deposit: (entry.deposit / Currency.LOVELACETOADA).toFixed(1),
          voting_power:
            entry.voting_power != null
              ? (entry.voting_power / Currency.LOVELACETOADA).toFixed(1)
              : null,
          live_stake:
            entry.live_stake != null
              ? (entry.live_stake / Currency.LOVELACETOADA).toFixed(1)
              : null,
        };
      }),
      totalItems: parseInt(totalResults[0].total, 10),
    };
  }
  async getAllDRepsVoltaire() {
    return await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .getRawMany();
  }

  async getVoltaireDRepsByViews(views: string[]) {
    if (views.length === 0) return [];

    return await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect('drep.signatures', 'signature')
      .where('signature.drep_bech32 IN (:...views)', { views })
      .getRawMany();
  }
  async getSingleDrepViaID(drepId: number) {
    const drep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('drep.id = :drepId', { drepId })
      .getRawMany();
    let drepVoterId;
    if (drep.length > 0) drepVoterId = drep[0].signature_drep_bech32;
    const drepCexplorer = await this.getDrepCexplorerDetails(drepVoterId);

    const combinedResult = {
      ...drep[0],
      ...drepCexplorer,
    };
    if (
      (!drep || drep.length === 0) &&
      (!drepCexplorer || drepCexplorer.length === 0)
    ) {
      throw new NotFoundException('Drep not found!');
    }
    //account for voting options
    if (
      combinedResult?.view.includes('drep_always_abstain') ||
      combinedResult?.view.includes('drep_always_no_confidence')
    ) {
      combinedResult['type'] = 'voting_option';
    } else {
      combinedResult['type'] = 'drep';
    }

    return combinedResult;
  }
  async getSingleDrepViaVoterID(drepVoterId: string) {
    const drep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('signature.drep_bech32 = :drepVoterId', { drepVoterId })
      .getRawMany();
    const drepCexplorer = await this.getDrepCexplorerDetails(drepVoterId);
    const combinedResult = {
      ...drep[0],
      ...drepCexplorer,
    };
    if (
      (!drep || drep.length === 0) &&
      (!drepCexplorer || drepCexplorer.length === 0)
    ) {
      throw new NotFoundException('Drep not found!');
    }
    //account for voting options
    if (
      combinedResult?.view.includes('drep_always_abstain') ||
      combinedResult?.view.includes('drep_always_no_confidence')
    ) {
      combinedResult['type'] = 'voting_option';
    } else if (!!combinedResult.has_script) {
      combinedResult['type'] = 'scripted';
    } else {
      combinedResult['type'] = 'drep';
    }

    return combinedResult;
  }
  async getDrepCexplorerDetails(drepVoterId: string) {
    const drepCexplorer = await this.cexplorerService.manager.query(
      getDrepCexplorerDetailsQuery,
      [drepVoterId],
    );
    return drepCexplorer[0];
  }

  getDrepDateofRegistration(
    drepVoterId: string,
  ): Observable<DRepRegistrationData | null> {
    return from(
      this.cexplorerService.manager.query(getDrepDateOfRegistrationQuery, [
        drepVoterId,
      ]),
    ).pipe(map((data) => data[0] || null));
  }

  private getFilters(filterValues?: string[]): TimelineFilters {
    return {
      includeVotingActivity: !filterValues || filterValues.includes('va'),
      includeDelegations: !filterValues || filterValues.includes('d'),
      includeNotes: !filterValues || filterValues.includes('n'),
      includeClaimedProfile: !filterValues || filterValues.includes('cp'),
      includeRegistration: !filterValues || filterValues.includes('r'),
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

      const res = (await this.voltaireService.getRepository('Signature').find({
        where: { voterId, drep_bech32: drepId },
      })) as Signature[];

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
    beforeDate?: number,
    tillDate?: number,
  ): { startingTime: Date; endingTime: Date } {
    const startingTime = beforeDate ? new Date(Number(beforeDate)) : new Date();
    const endingTime = tillDate
      ? new Date(Number(tillDate))
      : new Date(startingTime.getTime() - 432000000); // 5 days ago
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
    return startTime.getTime() > time && endTime.getTime() < time;
  }

  getDrepTimeline({
    drep,
    voterId,
    stakeKeyBech32,
    delegation,
    beforeDate,
    tillDate,
    filterValues,
  }: DRepTimelineParams): Observable<TimelineEntry[]> {
    const filters = this.getFilters(filterValues);
    const { startingTime, endingTime } = this.getTimeRange(
      beforeDate,
      tillDate,
    );
    const drepId = drep?.drep_id;

    // Setting up observables for parallel data fetching
    const queries: Record<string, Observable<any>> = {
      epochs: this.getEpochs(startingTime, endingTime),
      regData: filters.includeRegistration
        ? this.getDrepDateofRegistration(voterId)
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
          drep?.drep_createdAt &&
          this.isWithinTimeRange(drep.drep_createdAt, startingTime, endingTime)
        ) {
          timelineEntries.push({
            type: 'claimed_profile',
            timestamp: drep.drep_createdAt,
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
    beforeDate: Date,
    tillDate: Date,
  ): Observable<EpochActivityResponse[]> {
    const query = `
      SELECT start_time, end_time, no
      FROM epoch
      WHERE epoch.start_time::DATE
      BETWEEN $2::DATE AND $1::DATE
    `;

    return from(
      this.cexplorerService.manager.query(query, [beforeDate, tillDate]),
    ).pipe(
      map((epochs) =>
        epochs.map((epoch) => ({
          ...epoch,
          type: 'epoch',
        })),
      ),
    );
  }

  getDrepVotingActivity(
    drepVoterId: string,
    beforeDate: Date,
    tillDate: Date,
  ): Observable<VotingActivityHistory[]> {
    return from(
      this.cexplorerService.manager.query(getDrepVotingActivityQuery, [
        drepVoterId,
        beforeDate,
        tillDate,
      ]),
    ).pipe(
      map((data) => data.map((item) => ({ ...item, type: 'voting_activity' }))),
    );
  }

  getDRepNotes(
    drepId: number,
    beforeDate: Date,
    tillDate: Date,
    stakeKeyBech32?: string,
    delegation?: any,
  ): Observable<VoterNoteResponse> {
    const queryBuilder = this.voltaireService
      .getRepository('Note')
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.drep', 'drep')
      .leftJoin('drep.signatures', 'signature')
      .where('note.drep = :drepId', { drepId })
      .andWhere(
        'note."createdAt"::DATE BETWEEN :tillDate::DATE AND :beforeDate::DATE',
        {
          beforeDate,
          tillDate,
        },
      );

    // Prepare visibility conditions
    const visibilityConditions = ['note.visibility = :everyone'];

    const visibilityParams: {
      everyone: string;
      delegators?: string;
      drepVoterId?: string;
      myself?: string;
      stakeKeyBech32?: string;
    } = {
      everyone: 'everyone',
    };

    // 'delegators' visibility
    if (delegation) {
      visibilityConditions.push(
        'note.visibility = :delegators AND signature.drep_bech32 = :drepVoterId',
      );
      visibilityParams.delegators = 'delegators';
      visibilityParams.drepVoterId = delegation.drep_view;
    }

    // 'myself' visibility
    if (stakeKeyBech32) {
      visibilityConditions.push(
        'note.visibility = :myself AND signature.stakeKey = :stakeKeyBech32',
      );
      visibilityParams.myself = 'myself';
      visibilityParams.stakeKeyBech32 = stakeKeyBech32;
    }

    // Combine visibility conditions with OR logic
    queryBuilder.andWhere(
      `(${visibilityConditions.join(' OR ')})`,
      visibilityParams,
    );

    // Convert queryBuilder result to an observable
    return from(queryBuilder.getRawMany()).pipe(
      switchMap((allNotes) => {
        if (allNotes.length === 0) {
          // If no notes are found, return an observable emitting an empty array
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

        // Return an observable that emits all notes with reactions and comments
        return forkJoin(noteObservables);
      }),
      catchError((error) => {
        console.error('Error fetching DRep notes:', error);
        return of([]); // Return an empty array on error
      }),
    );
  }

  async populateFakeDRepData() {
    const dreps = await this.getAllDRepsCexplorer();
    //seeding`
    const modified = dreps.data.map((drep) => {
      return {
        ...drep,
        name: faker.person.fullName(),
        bio: faker.lorem.sentences(2),
      };
    });
    await this.voltaireService.getRepository('Drep').insert(modified);
    return modified;
  }

  async registerDrep(drepDto: createDrepDto) {
    try {
      const insertedDrep = await this.voltaireService
        .getRepository('Drep')
        .insert(drepDto);
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
        // Fallback to cexplorerService
        const fallbackResponse =
          await this.cexplorerService.manager.query(getEpochParams);
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
        console.error('Fallback to cexplorerService failed:', fallbackError);
        throw fallbackError; // Throw the fallback error if both attempts fail
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
    const offset = (currentPage - 1) * itemsPerPage;

    const sortColumns = {
      power: 'voting_power',
      epoch: 'epoch_no',
    };

    const sortColumn = sortColumns[sort] || null;
    const sortOrder = order?.toUpperCase();

    const orderByClause =
      sortColumn && ['ASC', 'DESC'].includes(sortOrder)
        ? `ORDER BY ${sortColumn} ${sortOrder} NULLS ${sortOrder === 'DESC' ? 'LAST' : 'FIRST'}`
        : '';

    const delegatorsWithVotingPower = await this.cexplorerService.manager.query(
      getDrepDelegatorsWithVotingPowerQuery(
        itemsPerPage,
        offset,
        orderByClause,
      ),
      [drepVoterId],
    );

    const totalResults = await this.cexplorerService.manager.query(
      getDrepDelegatorsCountQuery(),
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

  async updateDrepInfo(drepId: number, drep: createDrepDto) {
    const foundDrep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .where('drep.id = :drepId', { drepId })
      .getRawMany();

    if (!foundDrep) {
      throw new NotFoundException('Drep to be updated not found!');
    }
    //disabled for now due to conflicts
    // if (drep.signatures && drep.signatures.length > 0) {
    //   await this.voltaireService
    //     .getRepository('Signature')
    //     .update(
    //       { drep: foundDrep[0].drep_id },
    //       {
    //         signatureKey: drep.signatures[0].key,
    //         signature: drep.signatures[0].signature,
    //       },
    //     );
    //   delete drep.signatures;
    //   delete drep.stake_addr;
    //   delete drep.voter_id;
    //   delete drep.drep_bech32;
    // }
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

    return await this.voltaireService
      .getRepository('Drep')
      .update(drepId, updatedDrep);
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
      //buggy
      // if (standard) {
      //   await validateMetadataStandard(data, standard);
      //   metadata = parseMetadata(data.body, standard);
      // }
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
      //save to IPFS via blockfrost
      const metadataStr = JSON.stringify(metadata);
      const binary = Buffer.from(metadataStr);

      // Prepare the FormData
      const formData = new FormData();
      formData.append('file', binary as any);
      return await this.attachmentService.uploadAttachmentToIPFS(formData);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async getMetadataFromIPFS(hash: string, res: Response): Promise<JsonLd> {
    try {
      return await this.attachmentService.getAttachmentFromIPFS(hash, res);
    } catch (error) {
      console.error(error);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getStats(drepVoterId: string) {
    const drepDelegatorsCountResult = await this.cexplorerService.manager.query(
      getDRepDelegatorsCountQuery,
      [drepVoterId],
    );

    const drepDelegatorsCount = Number(
      drepDelegatorsCountResult[0]?.delegators_count || 0,
    );

    const drepVotesCountResult = await this.cexplorerService.manager.query(
      getDRepVotesCountQuery,
      [drepVoterId],
    );
    const drepVotesCount = Number(drepVotesCountResult[0]?.vote_count || 0);

    const drepVotingPowerResult = await this.cexplorerService.manager.query(
      getDRepVotingPowerQuery,
      [drepVoterId],
    );

    const drepVotingPower = Number(drepVotingPowerResult[0]?.voting_power) || 0;

    const drepStats = {
      delegators: drepDelegatorsCount,
      votes: drepVotesCount,
      votingPower: drepVotingPower,
    };

    return drepStats;
  }

  getDrepDelegators(
    drepVoterId: string,
    beforeDate: Date,
    tillDate: Date,
  ): Observable<DRepDelegatorsHistoryResponse> {
    const drepHashQuery = `
      SELECT id, view FROM drep_hash WHERE view = $1
    `;

    return from(
      this.cexplorerService.manager.query(drepHashQuery, [drepVoterId]),
    ).pipe(
      switchMap((drepHashResult) => {
        const drepHashId = drepHashResult[0]?.id;

        if (!drepHashId) {
          throw new Error(`No DRep found with the view: ${drepVoterId}`);
        }

        const addrIdsQuery = `
          SELECT DISTINCT addr_id FROM delegation_vote WHERE drep_hash_id = $1
        `;

        return from(
          this.cexplorerService.manager.query(addrIdsQuery, [drepHashId]),
        ).pipe(
          switchMap((addrIdsResult) => {
            const addrIds = addrIdsResult.map((row) => row.addr_id);
            return from(
              this.cexplorerService.manager.query(
                getDRepDelegatorsHistory(addrIds),
                [drepHashId, drepVoterId, beforeDate, tillDate],
              ),
            );
          }),
        );
      }),
    );
  }

  async isDrepRegistered(voterId: string) {
    const latestRegistration = await this.cexplorerService.manager.query(
      drepRegistrationQuery,
      [voterId],
    );

    const regDeposit = latestRegistration[0]?.deposit;

    return regDeposit === null || regDeposit > 0;
  }

  async getMetadata(voterId: string) {
    const savedMetadata = await this.cexplorerService.manager.query(
      getDRepMetadataQuery,
      [voterId],
    );

    if (!savedMetadata || !savedMetadata?.[0].metadata) {
      const metadata = await this.cexplorerService.manager.query(
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

      const metadataUrl = metadata?.[0]?.metadata_url;

      if (!metadataUrl) {
        throw new NotFoundException('metadata url not found!');
      }

      const { data } = await firstValueFrom(
        this.httpService.get(metadataUrl).pipe(
          catchError((err) => {
            console.log(err);
            throw new Error('Metadata url not reachable!');
          }),
        ),
      );

      return data;
    } else if (savedMetadata?.[0]) {
      return savedMetadata?.[0].metadata;
    }
  }

  async getVoltaireDRepViaVoterID(drepVoterId) {
    return await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('signature.drep_bech32 = :drepVoterId', { drepVoterId })
      .getRawOne();
  }
}
