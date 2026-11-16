import { NotFoundException } from '@nestjs/common';
import { DrepService } from './drep.service';

describe('DRep detail Blockfrost fallback', () => {
  it('does not report voting power as live stake', async () => {
    const service = Object.assign(Object.create(DrepService.prototype), {
      drepRepository: {
        getSingleDrepViaVoterID: jest
          .fn()
          .mockRejectedValue(new NotFoundException()),
      },
      blockfrostService: {
        getDRepInfo: jest.fn().mockResolvedValue({
          drep_id: 'drep1new',
          hex: 'ab'.repeat(28),
          amount: '5000000',
          active: true,
          retired: false,
          has_script: false,
          active_epoch: 500,
        }),
        getDRepMetadata: jest.fn().mockRejectedValue(new Error('none')),
      },
    }) as DrepService;

    const drep = (await service.getSingleDrepViaVoterID('drep1new')) as {
      voting_power: string;
      live_stake: string | null;
    };

    expect(drep.voting_power).toBe('5');
    expect(drep.live_stake).toBeNull();
  });
});
