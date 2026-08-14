import { Test, TestingModule } from '@nestjs/testing';
import { TimelineWatcherWorker } from './timeline-watcher.worker';
import { getDataSourceToken } from '@nestjs/typeorm';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { Queues } from '../queue.types';
import { Job } from 'bullmq';

describe('TimelineWatcherWorker', () => {
  let worker: TimelineWatcherWorker;
  let mockDataSource: any;
  let mockSyncStateRepo: any;
  let mockTimelineRepo: any;
  let mockDrepDelegatorRepo: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockSyncStateRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockTimelineRepo = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDrepDelegatorRepo = {
      findOne: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'SyncState') return mockSyncStateRepo;
        if (entity.name === 'DrepTimelineEvent') return mockTimelineRepo;
        if (entity.name === 'DrepDelegator') return mockDrepDelegatorRepo;
        return {};
      }),
      query: jest.fn().mockResolvedValue([]),
    };

    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineWatcherWorker,
        {
          provide: getDataSourceToken('default'),
          useValue: mockDataSource,
        },
        {
          provide: BlockfrostService,
          useValue: { getStakeAddressInfo: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: `BullQueue_${Queues.GOVERNANCE_SYNC}`,
          useValue: mockQueue,
        },
        {
          provide: `BullQueue_${Queues.PROPOSALS_SYNC}`,
          useValue: mockQueue,
        },
        {
          provide: `BullQueue_${Queues.DREP_VOTES_SYNC}`,
          useValue: mockQueue,
        },
      ],
    }).compile();

    worker = module.get<TimelineWatcherWorker>(TimelineWatcherWorker);
  });

  describe('Delegation Transfer Logic', () => {
    const mockJob = {} as Job;

    it('Test 1: Given a stake key with no prior delegation, processing a VoteDelegation generates 0 extra events', async () => {
      mockSyncStateRepo.findOne.mockResolvedValue({ lastProcessedId: '0' });

      const newDelegation = {
        id: '1',
        eventType: 'delegation',
        drepId: 'new_drep',
        metadata: { stake_address: 'stake1xxx' },
      };

      mockTimelineRepo.find.mockResolvedValue([newDelegation]);
      // No prior delegation for this stake address
      mockDataSource.query.mockResolvedValue([]);

      await worker.process(mockJob);

      // Verify no extra timeline event was created/saved
      expect(mockTimelineRepo.create).not.toHaveBeenCalled();
      expect(mockTimelineRepo.save).not.toHaveBeenCalled();
    });

    it('Test 2: Given a stake key delegated to DRep A, processing a VoteDelegation to DRep B successfully synthesizes an undelegation event for DRep A', async () => {
      mockSyncStateRepo.findOne.mockResolvedValue({ lastProcessedId: '0' });

      const newDelegation = {
        id: '2',
        eventType: 'delegation',
        drepId: 'drepB',
        timestamp: new Date(),
        epoch: 500,
        slot: '100000',
        txHash: 'txhash123',
        txIndex: 1,
        metadata: { stake_address: 'stake1yyy' },
      };

      mockTimelineRepo.find.mockResolvedValue([newDelegation]);
      mockDataSource.query.mockImplementation((sql: string) =>
        Promise.resolve(
          sql.includes('SELECT drep_id') ? [{ drep_id: 'drepA' }] : [],
        ),
      );

      // Define what create returns
      const synthesizedUndelegation = {
        ...newDelegation,
        eventType: 'undelegation',
        drepId: 'drepA',
      };
      mockTimelineRepo.create.mockReturnValue(synthesizedUndelegation);

      await worker.process(mockJob);

      // Verify create was called with correct parameters
      expect(mockTimelineRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'undelegation',
          drepId: 'drepA',
          txHash: 'txhash123',
          metadata: expect.objectContaining({
            stake_address: 'stake1yyy',
          }),
        }),
      );

      // Verify the new event was saved
      expect(mockTimelineRepo.save).toHaveBeenCalledWith(
        synthesizedUndelegation,
      );
    });
  });
});
