import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceService } from './governance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
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
          provide: 'governanceDataSource',
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
               })
            })
          },
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  it('should group events by epoch and bundle delegations', async () => {
    const result = await service.getDRepTimeline('drep123');
    
    expect(result.epochs).toHaveLength(2);
    
    // Epoch 609 should have 2 items: 1 vote and 1 bundle of 2 delegations
    const epoch609 = result.epochs.find(e => e.epochNo === 609);
    expect(epoch609).toBeDefined();
    expect(epoch609.items).toHaveLength(2);
    expect(epoch609.items.find(i => i.type === 'voting_activity')).toBeDefined();
    expect(epoch609.items.find(i => i.type === 'bundled_delegations')).toBeDefined();
    
    const bundle = epoch609.items.find(i => i.type === 'bundled_delegations') as any;
    expect(bundle.items).toHaveLength(2);
    
    // Epoch 590
    const epoch590 = result.epochs.find(e => e.epochNo === 590);
    expect(epoch590).toBeDefined();
    expect(epoch590.items).toHaveLength(1);
  });
});
