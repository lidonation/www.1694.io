import { Test, TestingModule } from '@nestjs/testing';
import {
  GovernanceService,
  TIMELINE_EPOCHS_PER_PAGE,
} from './governance.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';
import { DataSource } from 'typeorm';

describe('GovernanceService Grouping Logic', () => {
  let service: GovernanceService;

  const mockEntities = [
    {
      id: '1',
      eventType: 'vote',
      timestamp: new Date('2026-01-26T10:00:00Z'),
      epoch: 609,
      metadata: { vote: 'Yes' },
    },
    {
      id: '2',
      eventType: 'delegation',
      timestamp: new Date('2026-01-25T15:00:00Z'),
      epoch: 609,
      metadata: { stake_address: 'stake1' },
    },
    {
      id: '3',
      eventType: 'delegation',
      timestamp: new Date('2026-01-25T15:30:00Z'),
      epoch: 609,
      metadata: { stake_address: 'stake2' },
    },
    {
      id: '4',
      eventType: 'vote',
      timestamp: new Date('2025-10-20T10:00:00Z'),
      epoch: 590,
      metadata: { vote: 'No' },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        {
          provide: getRepositoryToken(DrepTimelineEvent),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getRawAndEntities: jest.fn().mockResolvedValue({
                entities: mockEntities,
                raw: [],
              }),
            }),
          },
        },
        {
          provide: getDataSourceToken('default'),
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({
                  entities: mockEntities,
                  raw: [],
                }),
              }),
            }),
            query: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, def?: string) => def) },
        },
        {
          provide: BlockfrostService,
          useValue: {
            getLatestBlock: jest.fn().mockResolvedValue({ epoch: 609 }),
          },
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  // The chain tip is mocked at epoch 609 (see the BlockfrostService provider),
  // so the first page of the timeline is the window
  // [609 - (TIMELINE_EPOCHS_PER_PAGE - 1) .. 609] == [606..609].
  const CURRENT_EPOCH = 609;
  const OLDEST_EPOCH_ON_FIRST_PAGE =
    CURRENT_EPOCH - (TIMELINE_EPOCHS_PER_PAGE - 1);

  it('should group events by epoch and bundle delegations', async () => {
    const result = await service.getDRepTimeline('drep123');

    // The initial page is anchored on the current epoch and reaches back
    // TIMELINE_EPOCHS_PER_PAGE epochs -- derived from the implementation
    // constant, not a hard-coded literal.
    expect(result.epochs).toHaveLength(TIMELINE_EPOCHS_PER_PAGE);
    expect(Math.max(...result.epochs.map((e) => e.epochNo))).toBe(
      CURRENT_EPOCH,
    );

    // Epoch 609 should have 2 items: 1 vote and 1 bundle of 2 delegations
    const epoch609 = result.epochs.find((e) => e.epochNo === 609);
    expect(epoch609).toBeDefined();
    expect(epoch609.items).toHaveLength(2);
    expect(
      epoch609.items.find((i) => i.type === 'voting_activity'),
    ).toBeDefined();
    expect(
      epoch609.items.find((i) => i.type === 'bundled_delegations'),
    ).toBeDefined();

    const bundle = epoch609.items.find(
      (i) => i.type === 'bundled_delegations',
    ) as any;
    expect(bundle.items).toHaveLength(2);

    // Epoch 590 predates the first page window and is only reachable by
    // following nextCursor.
    expect(590).toBeLessThan(OLDEST_EPOCH_ON_FIRST_PAGE);
    expect(result.epochs.find((e) => e.epochNo === 590)).toBeUndefined();
    expect(result.nextCursor).toBe(`${OLDEST_EPOCH_ON_FIRST_PAGE - 1}_older`);
  });

  // Regression tests for the cursor parsing fix. Previously the raw cursor was
  // parsed with Number(''), which yields 0 rather than NaN, so a request with no
  // cursor was treated as a request anchored on epoch 0 and returned an empty
  // timeline. Anything falsy or non-epoch-like must fall back to the chain tip.
  describe('cursor handling', () => {
    it.each([
      ['no cursor', undefined],
      ['an empty cursor', ''],
      ['a legacy millisecond timestamp cursor', '1700000000000_older'],
    ])('anchors on the current epoch given %s', async (_label, cursor) => {
      const result = await service.getDRepTimeline('drep123', { cursor });

      expect(result.epochs).toHaveLength(TIMELINE_EPOCHS_PER_PAGE);
      expect(Math.max(...result.epochs.map((e) => e.epochNo))).toBe(
        CURRENT_EPOCH,
      );
      expect(result.epochs.find((e) => e.epochNo === 0)).toBeUndefined();
    });
  });
});
