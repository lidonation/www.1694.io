import { ProviderDeferred } from '../blockfrost/request-budget';
import {
  batchDatabase,
  runBatch,
  syncItem,
  targets,
  multiDaySnapshot,
} from '../blockfrost/sync-run';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { LOCK_DURATION_HEAVY } from '../queue.constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  Queues,
  GovernanceSyncJobData,
  GovernanceSyncJobResponse,
} from '../queue.types';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as blake from 'blakejs';

@Injectable()
@Processor(Queues.GOVERNANCE_SYNC, { lockDuration: LOCK_DURATION_HEAVY })
export class GovernanceSyncWorker extends WorkerHost {
  private readonly logger = new Logger(GovernanceSyncWorker.name);

  constructor(
    private readonly blockfrostService: BlockfrostService,
    private readonly httpService: HttpService,
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(
    job: Job<GovernanceSyncJobData, GovernanceSyncJobResponse>,
    token?: string,
  ): Promise<GovernanceSyncJobResponse> {
    return runBatch(this.dataSource, job, token, async () => {
      this.logger.log(`Starting governance sync: ${job.id}`);

      try {
        const { syncOnly } = job.data;
        let drepsCount = 0,
          proposalsCount = 0,
          votesCount = 0,
          delegatorsCount = 0;

        if (!syncOnly || syncOnly === 'dreps')
          drepsCount = await this.syncDReps();
        if (!syncOnly || syncOnly === 'delegators') {
          delegatorsCount = await this.syncDRepDelegators();
          await this.updateDelegationCounts();
        }
        if (!syncOnly || syncOnly === 'proposals')
          proposalsCount = await this.syncProposals();
        if (!syncOnly || syncOnly === 'metadata-votes')
          votesCount = await this.syncProposalMetadataAndVotes();

        this.logger.log(
          `Sync completed: ${drepsCount} DReps, ${delegatorsCount} delegators, ${proposalsCount} proposals, ${votesCount} votes`,
        );

        return {
          success: true,
          message:
            multiDaySnapshot() && (!syncOnly || syncOnly === 'delegators')
              ? 'Synced governance data; deletions deferred for multi-day staging'
              : 'Synced governance data',
          delegatorReconciliation:
            !syncOnly || syncOnly === 'delegators'
              ? multiDaySnapshot()
                ? 'upsert-only'
                : 'complete'
              : undefined,
          drepsCount,
          proposalsCount,
          votesCount,
          delegatorsCount,
        };
      } catch (error) {
        if (error instanceof ProviderDeferred) throw error;

        this.logger.error('Sync failed');
        throw error;
      }
    });
  }

  private async syncDReps(): Promise<number> {
    const drepsRepository = batchDatabase(this.dataSource).getRepository(Drep);
    let page = 1,
      totalSynced = 0,
      hasMore = true;

    while (hasMore) {
      try {
        const drepsData =
          await this.blockfrostService.getAllDRepsWithPagination(
            page,
            100,
            'asc',
          );
        if (!drepsData || drepsData.length === 0) break;

        for (const d of drepsData) {
          totalSynced += await syncItem(`drep:${d.drep_id}`, async () => {
            let delta = 0;
            try {
              let detailedInfo: any = null,
                metadata: any = null;

              try {
                detailedInfo = await this.blockfrostService.getDRepInfo(
                  d.drep_id,
                );
                await new Promise((r) => setTimeout(r, 50));
              } catch (e) {
                if (e instanceof ProviderDeferred) throw e;

                if (e.status !== 404) throw e;
              }

              try {
                metadata = await this.blockfrostService.getDRepMetadata(
                  d.drep_id,
                );
                await new Promise((r) => setTimeout(r, 50));
              } catch (e) {
                if (e instanceof ProviderDeferred) throw e;

                if (e.status !== 404) throw e;
              }

              if (
                detailedInfo?.amount != null &&
                (!Number.isFinite(Number(detailedInfo.amount)) ||
                  Number(detailedInfo.amount) < 0)
              )
                throw new ProviderDeferred(
                  'source',
                  'transient',
                  Date.now() + 60000,
                );
              await drepsRepository.upsert(
                {
                  drepId: d.drep_id,
                  hex: d.hex,
                  ...(detailedInfo
                    ? {
                        amountLovelace: detailedInfo.amount?.toString(),
                        active: detailedInfo.active,
                        activeEpoch: detailedInfo.active_epoch,
                        hasScript: detailedInfo.has_script,
                        retired: detailedInfo.retired,
                        expired: detailedInfo.expired,
                        lastActiveEpoch: detailedInfo.last_active_epoch,
                        votingPowerAda:
                          detailedInfo.amount != null
                            ? (
                                Number(detailedInfo.amount) / 1_000_000
                              ).toString()
                            : undefined,
                      }
                    : {}),
                  ...(metadata ? { metadata } : {}),
                },
                {
                  conflictPaths: ['drepId'],
                  skipUpdateIfNoValuesChanged: true,
                },
              );
              delta++;
            } catch (e) {
              if (e instanceof ProviderDeferred) throw e;

              this.logger.warn('DRep upsert failed');
              throw e;
            }

            return delta;
          });
        }

        await new Promise((r) => setTimeout(r, 100));
        if (drepsData.length < 100) hasMore = false;
        else page++;
      } catch (e) {
        if (e instanceof ProviderDeferred) throw e;

        this.logger.error('DReps fetch failed');
        throw e;
      }
    }
    return totalSynced;
  }

  private async syncDRepDelegators(): Promise<number> {
    const drepsRepository = batchDatabase(this.dataSource).getRepository(Drep);
    const delegatorsRepository = batchDatabase(this.dataSource).getRepository(
      DrepDelegator,
    );
    const allDreps = await targets('delegator-dreps', () =>
      drepsRepository.find({ order: { drepId: 'ASC' } }),
    );
    let totalSynced = 0;

    for (const drep of allDreps) {
      totalSynced += await syncItem(`delegators:${drep.drepId}`, async () => {
        let delta = 0;
        const newDelegatorsMap = new Map<string, any>();
        let page = 1,
          hasMore = true;

        while (hasMore) {
          try {
            const data = await this.blockfrostService.getDRepDelegators(
              drep.drepId,
              page,
              100,
              'asc',
            );
            if (!data || data.length === 0) break;

            for (const d of data) newDelegatorsMap.set(d.address, d);
            if (data.length < 100) hasMore = false;
            else page++;
          } catch (e) {
            if (e instanceof ProviderDeferred) throw e;

            if (e.status === 404) return 0;
            this.logger.warn('Delegators fetch failed');
            throw e;
          }
        }

        const existing = await delegatorsRepository.find({
          where: { drepId: drep.drepId },
        });
        const existingMap = new Map(existing.map((d) => [d.stakeAddress, d]));

        const toInsert: any[] = [],
          toUpdate: any[] = [];
        const toDelete: { address: string; amountLovelace: string }[] = [];

        for (const [address, newData] of newDelegatorsMap) {
          const ext = existingMap.get(address);
          if (!ext) {
            toInsert.push({
              drepId: drep.drepId,
              stakeAddress: address,
              amountLovelace: newData.amount,
              votingPowerLovelace: newData.amount,
            });
          } else if (ext.amountLovelace !== newData.amount) {
            toUpdate.push({
              drepId: drep.drepId,
              stakeAddress: address,
              amountLovelace: newData.amount,
              votingPowerLovelace: newData.amount,
            });
          }
        }

        const undelegatedAt = new Date();
        for (const [address, existing] of existingMap) {
          if (!newDelegatorsMap.has(address))
            toDelete.push({ address, amountLovelace: existing.amountLovelace });
        }

        try {
          await batchDatabase(this.dataSource).transaction(async (manager) => {
            const repo = manager.getRepository(DrepDelegator);
            const timelineRepo = manager.getRepository(DrepTimelineEvent);
            const chunkSize = 1000;

            if (toDelete.length > 0 && !multiDaySnapshot()) {
              const deleteAddresses = toDelete.map((d) => d.address);
              for (let i = 0; i < deleteAddresses.length; i += chunkSize) {
                await repo
                  .createQueryBuilder()
                  .delete()
                  .where('drepId = :dId', { dId: drep.drepId })
                  .andWhere('stakeAddress IN (:...ids)', {
                    ids: deleteAddresses.slice(i, i + chunkSize),
                  })
                  .execute();
              }
              // Synthetic tx_hash is unique per (drep, address); tx_index 0 clears the NOT NULL + (tx_hash, tx_index) index.
              const undelegationEvents: Partial<DrepTimelineEvent>[] =
                toDelete.map(({ address, amountLovelace }) => ({
                  drepId: drep.drepId,
                  eventType: 'undelegation' as const,
                  timestamp: undelegatedAt,
                  epoch: 0,
                  slot: '0',
                  txHash: `synthetic-undelegation-${drep.drepId}-${address}`,
                  txIndex: 0,
                  blockHash: null,
                  stakeAddress: address,
                  previousDrep: drep.drepId,
                  metadata: {
                    stake_address: address,
                    previous_drep: drep.drepId,
                    target_drep: null,
                    added_power: false,
                    total_stake: amountLovelace,
                  },
                }));
              for (let i = 0; i < undelegationEvents.length; i += chunkSize) {
                await timelineRepo.upsert(
                  undelegationEvents.slice(i, i + chunkSize) as any,
                  {
                    conflictPaths: ['txHash', 'txIndex'],
                    skipUpdateIfNoValuesChanged: true,
                  },
                );
              }
            }

            if (toInsert.length > 0) {
              for (let i = 0; i < toInsert.length; i += chunkSize)
                await repo.insert(toInsert.slice(i, i + chunkSize));
            }

            if (toUpdate.length > 0) {
              for (let i = 0; i < toUpdate.length; i += chunkSize) {
                await repo.upsert(toUpdate.slice(i, i + chunkSize), {
                  conflictPaths: ['drepId', 'stakeAddress'],
                  skipUpdateIfNoValuesChanged: true,
                });
              }
            }
          });
          delta += newDelegatorsMap.size;
        } catch (e) {
          if (e instanceof ProviderDeferred) throw e;

          this.logger.error('Delegators sync failed');
          throw e;
        }
        await new Promise((r) => setTimeout(r, 200));

        return delta;
      });
    }
    return totalSynced;
  }

  private async syncProposals(): Promise<number> {
    const proposalsRepository = batchDatabase(this.dataSource).getRepository(
      Proposal,
    );
    let page = 1,
      totalSynced = 0,
      hasMore = true;

    while (hasMore) {
      try {
        const list = await this.blockfrostService.getAllProposals(
          page,
          100,
          'asc',
        );
        if (!list || list.length === 0) break;

        for (const item of list) {
          totalSynced += await syncItem(
            `proposal:${item.tx_hash}:${item.cert_index}`,
            async () => {
              let delta = 0;
              try {
                const existing = await proposalsRepository.findOne({
                  where: { txHash: item.tx_hash, certIndex: item.cert_index },
                });

                // Skip only terminal states — enacted/expired/dropped will never change
                if (
                  existing &&
                  (existing.enactedEpoch ||
                    existing.expiredEpoch ||
                    existing.droppedEpoch)
                )
                  return 0;

                const data = await this.blockfrostService.getProposal(
                  item.tx_hash,
                  item.cert_index,
                );
                if (data) {
                  let blockTime: Date | null = existing?.blockTime ?? null;
                  if (!blockTime) {
                    try {
                      const tx = await this.blockfrostService.getTransaction(
                        data.tx_hash,
                      );
                      if (tx?.block_time)
                        blockTime = new Date(tx.block_time * 1000);
                    } catch (e) {
                      if (e instanceof ProviderDeferred) throw e;

                      this.logger.debug('Tx time fetch failed');
                    }
                  }

                  await proposalsRepository.upsert(
                    {
                      id: data.id,
                      txHash: data.tx_hash,
                      certIndex: data.cert_index,
                      governanceType: data.governance_type,
                      governanceDescription:
                        data.governance_description || null,
                      depositLovelace: data.deposit || null,
                      returnStakeAddress: data.return_address || null,
                      ratifiedEpoch: data.ratified_epoch || null,
                      enactedEpoch: data.enacted_epoch || null,
                      droppedEpoch: data.dropped_epoch || null,
                      expiredEpoch: data.expired_epoch || null,
                      expirationEpoch: data.expiration || null,
                      blockTime,
                    },
                    {
                      conflictPaths: ['id'],
                      skipUpdateIfNoValuesChanged: true,
                    },
                  );
                  delta++;
                }
                await new Promise((r) => setTimeout(r, 50));
              } catch (e) {
                if (e instanceof ProviderDeferred) throw e;

                if (e.status === 404) return 0;
                this.logger.warn('Proposal sync failed');
                throw e;
              }

              return delta;
            },
          );
        }

        if (list.length < 100) hasMore = false;
        else page++;
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        if (e instanceof ProviderDeferred) throw e;

        this.logger.error('Proposals fetch failed');
        throw e;
      }
    }
    return totalSynced;
  }

  private async syncProposalMetadataAndVotes(): Promise<number> {
    const proposalsRepository = batchDatabase(this.dataSource).getRepository(
      Proposal,
    );
    const metadataRepository = batchDatabase(this.dataSource).getRepository(
      ProposalMetadata,
    );
    const votesRepository = batchDatabase(this.dataSource).getRepository(
      ProposalVote,
    );

    const proposalTargets = await targets('metadata-vote-targets', () =>
      proposalsRepository
        .createQueryBuilder('p')
        .leftJoin(ProposalMetadata, 'm', 'm.proposalId = p.id')
        .where('m.proposalId IS NULL OR m.error IS NOT NULL')
        .orWhere(
          `EXISTS (
        SELECT 1 FROM proposal_votes pv
        WHERE pv.proposal_id = p.id
          AND pv.voter_role = 'drep'
          AND pv.voting_power_lovelace IS NULL
        LIMIT 1
      )`,
        )
        .limit(500)
        .orderBy('p.id', 'ASC')
        .getMany(),
    );

    let totalVotesSynced = 0;
    for (const p of proposalTargets) {
      totalVotesSynced += await syncItem(`metadata-votes:${p.id}`, async () => {
        let delta = 0;
        try {
          let meta: any = null;
          let url: string | null = null;
          let hash: string | null = null;
          let jsonMetadata: any = null;

          try {
            meta = await this.blockfrostService.getProposalMetadata(
              p.txHash,
              p.certIndex,
            );
            if (meta) {
              url = meta.url;
              hash = meta.hash;
              jsonMetadata = meta.json_metadata;
            }
          } catch (e) {
            if (e instanceof ProviderDeferred) throw e;

            if (e.status !== 404) throw e;
            this.logger.debug('Blockfrost metadata 404');
          }

          if (!jsonMetadata) {
            const anchor = await this.getAnchorFromTimeline(
              p.txHash,
              p.certIndex,
            );
            if (anchor) {
              url = anchor.url;
              hash = anchor.hash;
              jsonMetadata = await this.fetchMetadataManually(url, hash);
            }
          }

          if (jsonMetadata) {
            await metadataRepository.upsert(
              {
                proposalId: p.id,
                url: url,
                hash: hash,
                jsonMetadata: jsonMetadata,
                bytes: meta?.bytes || null,
                version: 'v2',
                error: null,
              } as any,
              {
                conflictPaths: ['proposalId'],
                skipUpdateIfNoValuesChanged: true,
              },
            );
          } else if (url) {
            await metadataRepository.upsert(
              {
                proposalId: p.id,
                url,
                hash,
                error: {
                  message: 'Metadata fetch failed',
                  ts: new Date().toISOString(),
                },
                version: 'v2',
              } as any,
              {
                conflictPaths: ['proposalId'],
                skipUpdateIfNoValuesChanged: false,
              },
            );
          } else {
            await metadataRepository.upsert(
              {
                proposalId: p.id,
                error: {
                  message: 'No anchor found',
                  status: 404,
                  ts: new Date().toISOString(),
                },
                version: 'v2',
              } as any,
              {
                conflictPaths: ['proposalId'],
                skipUpdateIfNoValuesChanged: false,
              },
            );
          }

          try {
            let page = 1,
              hasMore = true;
            while (hasMore) {
              const data = await this.blockfrostService.getProposalVotes(
                p.txHash,
                p.certIndex,
                page,
                100,
                'asc',
              );
              if (!data || data.length === 0) break;

              const upserts = data.map((v) => ({
                proposalId: p.id,
                txHash: v.tx_hash,
                certIndex: v.cert_index,
                voterRole: v.voter_role,
                voter: v.voter,
                vote: v.vote,
                votingPowerLovelace: v.voting_power ?? null,
              }));
              await votesRepository.upsert(upserts, {
                conflictPaths: ['proposalId', 'voter'],
                skipUpdateIfNoValuesChanged: false,
              });

              delta += data.length;
              if (data.length < 100) hasMore = false;
              else page++;
              await new Promise((r) => setTimeout(r, 50));
            }
          } catch (e) {
            if (e instanceof ProviderDeferred) throw e;

            this.logger.warn('Votes sync failed');
            throw e;
          }
          await new Promise((r) => setTimeout(r, 100));
        } catch (e) {
          if (e instanceof ProviderDeferred) throw e;

          this.logger.warn('Meta/Votes sync failed');
          throw e;
        }

        return delta;
      });
    }
    return totalVotesSynced;
  }

  private async getAnchorFromTimeline(txHash: string, certIndex: number) {
    try {
      const timelineRepository = batchDatabase(this.dataSource).getRepository(
        DrepTimelineEvent,
      );
      const actionId = `${txHash}#${certIndex}`;
      const event = await timelineRepository
        .createQueryBuilder('event')
        .where("event.eventType = 'proposal'")
        .andWhere("event.metadata->>'action_id' = :actionId", { actionId })
        .getOne();
      return event?.metadata?.anchor_url
        ? { url: event.metadata.anchor_url, hash: event.metadata.anchor_hash }
        : event?.metadata?.url
          ? { url: event.metadata.url, hash: event.metadata.hash }
          : null;
    } catch (e) {
      if (e instanceof ProviderDeferred) throw e;
      return null;
    }
  }

  private async fetchMetadataManually(url: string, hash: string) {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
    ];

    let urlsToTry: string[] = [];
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      urlsToTry = gateways.map((g) => `${g}${ipfsHash}`);
    } else {
      urlsToTry = [url];
    }

    for (const fetchUrl of urlsToTry) {
      try {
        let buffer: Buffer;

        if (url.startsWith('ipfs://') && fetchUrl === urlsToTry[0]) {
          const ipfsHash = url.replace('ipfs://', '');
          try {
            buffer = await this.blockfrostService.getIpfsContent(ipfsHash);
          } catch (e) {
            if (e instanceof ProviderDeferred) throw e;

            this.logger.debug('Blockfrost IPFS fetch failed');
            continue;
          }
        } else {
          this.logger.debug('Fetching metadata manually');
          const response = await firstValueFrom(
            this.httpService.get(fetchUrl, {
              timeout: 10000,
              responseType: 'arraybuffer',
            }),
          );
          buffer = Buffer.from(response.data);
        }

        const bufferToHash = Buffer.from(buffer);
        const hashed = blake.blake2bHex(
          new Uint8Array(bufferToHash),
          undefined,
          32,
        );

        if (hashed !== hash) {
          this.logger.warn('Manual metadata hash mismatch');
          continue;
        }

        try {
          return JSON.parse(buffer.toString('utf8'));
        } catch (e) {
          if (e instanceof ProviderDeferred) throw e;

          this.logger.warn('Failed to parse metadata as JSON');
          return null;
        }
      } catch (e) {
        if (e instanceof ProviderDeferred) throw e;

        this.logger.debug('Manual metadata fetch failed');
      }
    }
    return null;
  }

  private async updateDelegationCounts(): Promise<void> {
    const drepsRepository = batchDatabase(this.dataSource).getRepository(Drep);
    const delegatorsRepository = batchDatabase(this.dataSource).getRepository(
      DrepDelegator,
    );

    const counts = await delegatorsRepository
      .createQueryBuilder('d')
      .select('d.drepId', 'drepId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('d.drepId')
      .getRawMany();

    for (const c of counts) {
      try {
        await drepsRepository.update(
          { drepId: c.drepId },
          { delegationVoteCount: parseInt(c.count) },
        );
      } catch (e) {
        if (e instanceof ProviderDeferred) throw e;

        this.logger.warn('Count update failed');
      }
    }
  }
}
