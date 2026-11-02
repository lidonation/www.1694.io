import * as syncRun from '../blockfrost/sync-run';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { ProposalsSyncWorker } from './proposals-sync.worker';
import { GovernanceSyncWorker } from './governance-sync.worker';
import { ProviderDeferred } from '../blockfrost/request-budget';
import { Drep } from '../entities/governance/drep.entity';
import { TimelineWatcherWorker } from './timeline-watcher.worker';

describe('worker quota safety', () => {
  it('stops delegator iteration at the first exhausted provider, without reconciliation', async () => {
    const error = new ProviderDeferred(
      'shared',
      'quota',
      Date.now() + 86400000,
      402,
    );
    const api = {
      getDRepDelegators: jest
        .fn()
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({
            address: `stake-${i}`,
            amount: '1',
          })),
        )
        .mockRejectedValue(error),
    };
    const db = {
      getRepository: jest.fn((type) =>
        type === Drep
          ? { find: async () => [{ drepId: 'a' }, { drepId: 'b' }] }
          : {},
      ),
      transaction: jest.fn(),
    };
    const worker = new GovernanceSyncWorker(api as any, {} as any, db as any);
    await expect(worker['syncDRepDelegators']()).rejects.toBe(error);
    expect(api.getDRepDelegators).toHaveBeenCalledTimes(2);
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('preserves existing detail fields when detail/metadata are absent', async () => {
    const missing = Object.assign(new Error('missing'), { status: 404 });
    const api = {
      getAllDRepsWithPagination: jest
        .fn()
        .mockResolvedValue([{ drep_id: 'a', hex: 'a' }]),
      getDRepInfo: jest.fn().mockRejectedValue(missing),
      getDRepMetadata: jest.fn().mockRejectedValue(missing),
    };
    const repo = { upsert: jest.fn() };
    const worker = new GovernanceSyncWorker(
      api as any,
      {} as any,
      { getRepository: () => repo } as any,
    );
    await worker['syncDReps']();
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.not.objectContaining({ votingPowerAda: null }),
      expect.anything(),
    );
    expect(repo.upsert.mock.calls[0][0]).not.toHaveProperty('metadata');
    expect(repo.upsert.mock.calls[0][0]).not.toHaveProperty('active');
  });
  it('does not swallow quota failures during a timeline voting-power update', async () => {
    const error = new ProviderDeferred(
      'shared',
      'quota',
      Date.now() + 86400000,
      402,
    );
    const worker = new TimelineWatcherWorker(
      {} as any,
      {
        getStakeAddressInfo: async () => {
          throw error;
        },
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      worker['updateDelegatorVotingPower']('stake-private'),
    ).rejects.toBe(error);
  });
  it.each([false, true])(
    'only reconciles deletions from a complete same-day snapshot (multi-day=%s)',
    async (multiDay) => {
      const clock = jest
        .spyOn(syncRun, 'multiDaySnapshot')
        .mockReturnValue(multiDay);
      try {
        const execute = jest.fn();
        const builder = {
          delete: jest.fn(),
          where: jest.fn(),
          andWhere: jest.fn(),
          execute,
        };
        builder.delete.mockReturnValue(builder);
        builder.where.mockReturnValue(builder);
        builder.andWhere.mockReturnValue(builder);
        const repo = {
          find: async () => [{ stakeAddress: 'old', amountLovelace: '1' }],
          createQueryBuilder: () => builder,
        };
        const manager = {
          getRepository: (type: unknown) =>
            type === DrepDelegator ? repo : { upsert: jest.fn() },
        };
        const db = {
          getRepository: (type: unknown) =>
            type === Drep ? { find: async () => [{ drepId: 'a' }] } : repo,
          transaction: async (work: (m: unknown) => Promise<void>) =>
            work(manager),
        };
        const worker = new GovernanceSyncWorker(
          { getDRepDelegators: async () => [] } as any,
          {} as any,
          db as any,
        );
        await worker['syncDRepDelegators']();
        expect(execute).toHaveBeenCalledTimes(multiDay ? 0 : 1);
      } finally {
        clock.mockRestore();
      }
    },
  );
  it.each([GovernanceSyncWorker, ProposalsSyncWorker])(
    'propagates exhaustion out of optional IPFS metadata fallbacks (%p)',
    async (Worker) => {
      const error = new ProviderDeferred(
        'shared',
        'quota',
        Date.now() + 86400000,
        402,
      );
      const worker = new Worker(
        {
          getIpfsContent: async () => {
            throw error;
          },
        } as any,
        {} as any,
        {} as any,
      );
      await expect(
        worker['fetchMetadataManually']('ipfs://private-cid', 'hash'),
      ).rejects.toBe(error);
    },
  );
  it('does not persist partially fetched DRep details after metadata quota exhaustion', async () => {
    const error = new ProviderDeferred(
      'shared',
      'quota',
      Date.now() + 86400000,
      402,
    );
    const upsert = jest.fn();
    const worker = new GovernanceSyncWorker(
      {
        getAllDRepsWithPagination: async () => [{ drep_id: 'a', hex: 'a' }],
        getDRepInfo: async () => ({ amount: '1000000' }),
        getDRepMetadata: async () => {
          throw error;
        },
      } as any,
      {} as any,
      { getRepository: () => ({ upsert }) } as any,
    );
    await expect(worker['syncDReps']()).rejects.toBe(error);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('keeps existing delegations when the entity is authoritatively missing', async () => {
    const missing = Object.assign(new Error('not found'), { status: 404 });
    const transaction = jest.fn();
    const db = {
      getRepository: (type: unknown) =>
        type === Drep ? { find: async () => [{ drepId: 'a' }] } : {},
      transaction,
    };
    const worker = new GovernanceSyncWorker(
      {
        getDRepDelegators: async () => {
          throw missing;
        },
      } as any,
      {} as any,
      db as any,
    );
    await expect(worker['syncDRepDelegators']()).resolves.toBe(0);
    expect(transaction).not.toHaveBeenCalled();
  });
});
