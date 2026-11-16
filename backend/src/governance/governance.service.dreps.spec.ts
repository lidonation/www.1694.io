import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { GovernanceService } from './governance.service';
import { BlockfrostService } from '../blockfrost/blockfrost.service';
import { DrepTimelineEvent } from '../entities/governance/drep-timeline-event.entity';

const HEX_A = '22' + 'a'.repeat(56);
const HEX_A_LEGACY = 'a'.repeat(56);
const HEX_B = '22' + 'b'.repeat(56);

const drep = (overrides: Record<string, any>): Record<string, any> => ({
  hasScript: false,
  active: true,
  retired: false,
  metadata: null,
  delegationVoteCount: 0,
  governanceVoteCount: 0,
  isClaimed: false,
  voltaireDrepId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const allDreps = [
  drep({ drepId: 'drep1a', hex: HEX_A, votingPowerAda: '100' }),
  // Legacy alias of drep1a: same 56-char suffix, shorter hex.
  drep({ drepId: 'drep1a_legacy', hex: HEX_A_LEGACY, votingPowerAda: '100' }),
  drep({ drepId: 'drep1b', hex: HEX_B, votingPowerAda: '50' }),
  // The voting options are stored with an empty hex in production.
  drep({
    drepId: 'drep_always_no_confidence',
    hex: '',
    votingPowerAda: '75',
  }),
  drep({
    drepId: 'drep_always_abstain',
    hex: '',
    votingPowerAda: '1000',
  }),
];

const delegators = [
  { drep_id: 'drep1a', stake_address: 'stake1', amount_lovelace: '60000000' },
  // stake1 also listed under the legacy alias: must count once.
  {
    drep_id: 'drep1a_legacy',
    stake_address: 'stake1',
    amount_lovelace: '60000000',
  },
  { drep_id: 'drep1a', stake_address: 'stake2', amount_lovelace: '50000000' },
  { drep_id: 'drep1b', stake_address: 'stake3', amount_lovelace: '40000000' },
  {
    drep_id: 'drep_always_no_confidence',
    stake_address: 'stake4',
    amount_lovelace: '75000000',
  },
  {
    drep_id: 'drep_always_abstain',
    stake_address: 'stake5',
    amount_lovelace: '1000000000',
  },
];

describe('GovernanceService DRep list', () => {
  let service: GovernanceService;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn(async (sql: string) => {
      if (sql.includes('FROM proposal_votes')) return [];
      if (sql.includes('FROM drep_delegators') && !sql.includes('$1'))
        return delegators;
      if (sql.includes('$1')) return [{ live_stake_lovelace: '110000000' }];
      return [];
    });
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(allDreps),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        { provide: getRepositoryToken(DrepTimelineEvent), useValue: {} },
        {
          provide: getDataSourceToken('default'),
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              createQueryBuilder: jest.fn().mockReturnValue(qb),
              findOne: jest.fn(async ({ where }) =>
                allDreps.find((d) => d.drepId === where.drepId),
              ),
            }),
            query,
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, def?: string) => def) },
        },
        { provide: BlockfrostService, useValue: {} },
      ],
    }).compile();

    service = module.get(GovernanceService);
  });

  it('reports live stake from current delegators, not voting power', async () => {
    const { data } = await service.getAllDReps();
    const a = data.find((d) => d.view === 'drep1a');
    expect(a.voting_power).toBe(100);
    // stake1 (60) counted once across aliases + stake2 (50).
    expect(a.live_stake).toBe(110);
    expect(a.liveStake).toBe(110);
    expect(a.delegation_vote_count).toBe(2);
    expect(data.find((d) => d.view === 'drep1b').live_stake).toBe(40);
  });

  it('keeps the latest amount when two aliases list the same stake address', async () => {
    const base = query.getMockImplementation();
    query.mockImplementation(async (sql: string, params?: unknown[]) =>
      sql.includes('FROM drep_delegators') && !sql.includes('$1')
        ? [
            {
              drep_id: 'drep1a',
              stake_address: 'stake1',
              amount_lovelace: '70000000',
              updated_at: new Date('2026-02-02T00:00:00Z'),
            },
            {
              drep_id: 'drep1a_legacy',
              stake_address: 'stake1',
              amount_lovelace: '60000000',
              updated_at: new Date('2026-01-01T00:00:00Z'),
            },
          ]
        : base(sql, params),
    );
    const { data } = await service.getAllDReps();
    expect(data.find((d) => d.view === 'drep1a').live_stake).toBe(70);
  });

  it('keeps the two voting options apart even though both have an empty hex', async () => {
    const { data } = await service.getAllDReps();
    const noConfidence = data.find(
      (d) => d.view === 'drep_always_no_confidence',
    );
    const abstain = data.find((d) => d.view === 'drep_always_abstain');
    expect(noConfidence.live_stake).toBe(75);
    expect(noConfidence.delegation_vote_count).toBe(1);
    expect(abstain.live_stake).toBe(1000);
    expect(abstain.delegation_vote_count).toBe(1);
  });

  it('looks up a voting option by its own ID, not by its empty hex', async () => {
    await service.getSingleDRep('drep_always_abstain');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('$1'), [
      'drep_always_abstain',
      '',
    ]);
  });

  it('marks the predefined voting options as voting_option', async () => {
    const { data } = await service.getAllDReps();
    const option = data.find((d) => d.view === 'drep_always_no_confidence');
    expect(option.type).toBe('voting_option');
    expect(data.find((d) => d.view === 'drep1a').type).toBe('drep');
  });

  it('sorts by the snake_case keys the web app sends, case-insensitively', async () => {
    const byLive = await service.getAllDReps('', 1, 24, 'live_stake', 'desc');
    expect(byLive.data.map((d) => d.view)).toEqual([
      'drep_always_abstain',
      'drep1a',
      'drep_always_no_confidence',
      'drep1b',
    ]);

    const byPowerAsc = await service.getAllDReps(
      '',
      1,
      24,
      'voting_power',
      'asc',
    );
    expect(byPowerAsc.data.map((d) => d.view)).toEqual([
      'drep1b',
      'drep_always_no_confidence',
      'drep1a',
      'drep_always_abstain',
    ]);
  });

  it('computes live stake for a single DRep and its stats', async () => {
    const single = await service.getSingleDRep('drep1a');
    expect(single.live_stake).toBe(110);
    expect(single.voting_power).toBe(100);

    const stats = await service.getDRepStats('drep1a');
    expect(stats.liveStake).toBe(110);
    expect(stats.votingPower).toBe(100);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('$1'), [
      'drep1a',
      HEX_A,
    ]);
  });
});
