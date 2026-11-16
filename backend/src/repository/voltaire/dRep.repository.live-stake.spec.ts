import { DRepRepository } from './dRep.repository';
import { LIVE_STAKE_FOR_DREP_SQL } from 'src/governance/drep-stake.util';

describe('DRepRepository.getSingleDrepViaVoterIDOptimized live stake', () => {
  it('returns live stake from delegators, not the voting power snapshot', async () => {
    const hex = '22' + 'c'.repeat(56);
    const query = jest.fn(async (sql: string) =>
      sql === LIVE_STAKE_FOR_DREP_SQL
        ? [{ live_stake_lovelace: '123456789' }]
        : [],
    );
    const voltaireDb = {
      createEntityManager: jest.fn().mockReturnValue({}),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          drepId: 'drep1c',
          hex,
          votingPowerAda: '500.000000',
          delegationVoteCount: 3,
          governanceVoteCount: 7,
          active: true,
          retired: false,
          hasScript: false,
          metadata: null,
        }),
      }),
      query,
    };
    const repo = new DRepRepository(voltaireDb as any, {} as any);
    jest.spyOn(repo, 'resolveDrepId').mockResolvedValue('drep1c');
    jest.spyOn(repo, 'getByVoterIdWithSignature').mockResolvedValue([]);

    const result: any = await repo.getSingleDrepViaVoterIDOptimized('drep1c');

    expect(result.voting_power).toBe('500.000000');
    expect(result.live_stake).toBe('123.456789');
    expect(query).toHaveBeenCalledWith(LIVE_STAKE_FOR_DREP_SQL, [
      'drep1c',
      hex,
    ]);
  });
});
