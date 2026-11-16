import { MiscellaneousService } from './miscellaneous.service';
import { TOTAL_LIVE_STAKE_SQL } from 'src/governance/drep-stake.util';

describe('MiscellaneousService.getMetrics', () => {
  it('reports total live stake from delegators, separately from voting power', async () => {
    const query = jest.fn(async (sql: string) => {
      if (sql === TOTAL_LIVE_STAKE_SQL)
        return [{ total_lovelace: '45000000000123456' }];
      if (sql.includes('voting_power_ada')) return [{ total: '44000000000.5' }];
      if (sql.includes('drep_delegators')) return [{ count: '1000' }];
      if (sql.includes('active = true')) return [{ count: '900' }];
      if (sql.includes('FROM proposals')) return [{ count: '197' }];
      return [{ count: '1200' }];
    });
    const service = new MiscellaneousService(
      { query } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const metrics = await service.getMetrics();

    expect(metrics.totalVotingPower).toBe(44000000000.5);
    expect(metrics.totalLiveStake).toBeCloseTo(45000000000.123, 2);
    expect(metrics.totalLiveStake).not.toBe(metrics.totalVotingPower);
    expect(metrics.totalRegisteredStakeAddresses).toBe(1000);
    expect(metrics.totalProposals).toBe(197);
  });
});
