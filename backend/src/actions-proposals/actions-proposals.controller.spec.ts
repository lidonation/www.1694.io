import { ActionsProposalsController } from './actions-proposals.controller';
import { ActionsProposalsService } from './actions-proposals.service';

describe('ActionsProposalsController freshness threshold', () => {
  const getDatasetFreshness = jest.fn();
  const controller = new ActionsProposalsController({
    getDatasetFreshness,
  } as unknown as ActionsProposalsService);

  beforeEach(() => {
    getDatasetFreshness.mockReset();
  });

  test.each([
    [undefined, 90],
    ['', 90],
    ['invalid', 90],
    ['0', 90],
    ['-5', 90],
    ['0.5', 1],
    ['1.9', 1],
    ['90', 90],
    ['9999', 3650],
  ])('normalizes threshold %p to %i days', async (input, expected) => {
    await controller.getFreshness(input);
    expect(getDatasetFreshness).toHaveBeenCalledWith(expected);
  });
});
