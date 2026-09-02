import { Test, TestingModule } from '@nestjs/testing';
import { TimelineWatcherWorker } from './timeline-watcher.worker';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Queues } from '../queue.types';
import { SYNTHETIC_TX_INDEX_OFFSET } from '../queue.constants';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { Job } from 'bullmq';

describe('TimelineWatcherWorker', () => {
  let worker: TimelineWatcherWorker;
  let mockDataSource: any;
  let mockSyncStateRepo: any;
  let mockTimelineRepo: any;
  let insertValues: jest.Mock;
  let insertExecute: jest.Mock;
  let rawQuery: jest.Mock;
  let mockQueue: any;

  const mockJob = {} as Job;

  beforeEach(async () => {
    mockSyncStateRepo = {
      findOne: jest.fn().mockResolvedValue({ lastProcessedId: '0' }),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockTimelineRepo = {
      find: jest.fn(),
    };

    insertExecute = jest.fn().mockResolvedValue({ identifiers: [{ id: '999' }] });
    insertValues = jest.fn().mockReturnValue({
      orIgnore: jest.fn().mockReturnValue({ execute: insertExecute }),
    });
    rawQuery = jest.fn().mockResolvedValue([]);

    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'SyncState') return mockSyncStateRepo;
        if (entity.name === 'DrepTimelineEvent') return mockTimelineRepo;
        return {};
      }),
      query: rawQuery,
      createQueryBuilder: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          into: jest.fn().mockReturnValue({ values: insertValues }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ execute: jest.fn().mockResolvedValue({}) }),
          }),
        }),
      }),
    };

    mockQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineWatcherWorker,
        { provide: getDataSourceToken('default'), useValue: mockDataSource },
        {
          provide: BlockfrostService,
          useValue: { getStakeAddressInfo: jest.fn().mockResolvedValue(null) },
        },
        { provide: `BullQueue_${Queues.GOVERNANCE_SYNC}`, useValue: mockQueue },
        { provide: `BullQueue_${Queues.PROPOSALS_SYNC}`, useValue: mockQueue },
        { provide: `BullQueue_${Queues.DREP_VOTES_SYNC}`, useValue: mockQueue },
      ],
    }).compile();

    worker = module.get<TimelineWatcherWorker>(TimelineWatcherWorker);
  });

  it('advances the cursor to the last event id in the batch', async () => {
    mockTimelineRepo.find.mockResolvedValue([
      { id: '10', eventType: 'proposal', metadata: {} },
      { id: '11', eventType: 'vote', metadata: {} },
    ]);

    await worker.process(mockJob);

    expect(mockSyncStateRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ lastProcessedId: '11' }),
    );
  });

  describe('Delegation transfer logic', () => {
    it('generates no undelegation when there is no prior delegation', async () => {
      mockTimelineRepo.find.mockResolvedValue([
        { id: '1', eventType: 'delegation', drepId: 'drepB', metadata: { stake_address: 'stake1xxx' } },
      ]);
      rawQuery.mockResolvedValue([]); // no previous delegation row

      await worker.process(mockJob);

      expect(insertValues).not.toHaveBeenCalled();
    });

    it('generates no undelegation when re-delegating to the same drep', async () => {
      mockTimelineRepo.find.mockResolvedValue([
        { id: '2', eventType: 'delegation', drepId: 'drepA', metadata: { stake_address: 'stake1yyy' } },
      ]);
      rawQuery.mockResolvedValue([{ drep_id: 'drepA' }]);

      await worker.process(mockJob);

      expect(insertValues).not.toHaveBeenCalled();
    });

    it('synthesizes an undelegation for the previous drep on a transfer', async () => {
      mockTimelineRepo.find.mockResolvedValue([
        {
          id: '3',
          eventType: 'delegation',
          drepId: 'drepB',
          timestamp: new Date('2026-01-01'),
          epoch: 500,
          slot: '100000',
          txHash: 'txhash123',
          txIndex: 0,
          blockHash: 'block1',
          metadata: { stake_address: 'stake1yyy' },
        },
      ]);
      rawQuery.mockResolvedValue([{ drep_id: 'drepA' }]);

      await worker.process(mockJob);

      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'undelegation',
          drepId: 'drepA',
          previousDrep: 'drepA',
          txHash: 'txhash123',
          stakeAddress: 'stake1yyy',
          metadata: expect.objectContaining({ stake_address: 'stake1yyy', target_drep: 'drepB' }),
        }),
      );
    });

    it('gives the synthesized row a non-colliding tx_index (regression: (tx_hash, tx_index) unique + NOT NULL)', async () => {
      mockTimelineRepo.find.mockResolvedValue([
        {
          id: '4',
          eventType: 'delegation',
          drepId: 'drepB',
          timestamp: new Date('2026-01-01'),
          epoch: 500,
          slot: '100000',
          txHash: 'txhash456',
          txIndex: 2,
          metadata: { stake_address: 'stake1zzz' },
        },
      ]);
      rawQuery.mockResolvedValue([{ drep_id: 'drepA' }]);

      await worker.process(mockJob);

      const values = insertValues.mock.calls[0][0];
      expect(values.txIndex).toBe(2 + SYNTHETIC_TX_INDEX_OFFSET);
      expect(values.txIndex).not.toBe(2);
    });

    it('uses an idempotent insert so retries do not fail the batch', async () => {
      mockTimelineRepo.find.mockResolvedValue([
        {
          id: '5',
          eventType: 'delegation',
          drepId: 'drepB',
          txHash: 'txhash789',
          txIndex: 0,
          metadata: { stake_address: 'stake1aaa' },
        },
      ]);
      rawQuery.mockResolvedValue([{ drep_id: 'drepA' }]);

      const orIgnore = jest.fn().mockReturnValue({ execute: insertExecute });
      insertValues.mockReturnValue({ orIgnore });

      await worker.process(mockJob);

      expect(orIgnore).toHaveBeenCalled();
    });
  });

  it('keeps advancing the cursor even when one event throws', async () => {
    mockTimelineRepo.find.mockResolvedValue([
      { id: '20', eventType: 'delegation', drepId: 'drepB', metadata: { stake_address: 'boom' } },
      { id: '21', eventType: 'vote', metadata: {} },
    ]);
    rawQuery.mockRejectedValueOnce(new Error('db exploded'));

    await worker.process(mockJob);

    expect(mockSyncStateRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ lastProcessedId: '21' }),
    );
  });
});
