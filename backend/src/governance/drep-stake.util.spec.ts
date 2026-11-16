import { isVotingOption, sumLovelaceAsAda } from './drep-stake.util';

describe('drep-stake.util', () => {
  describe('sumLovelaceAsAda', () => {
    it('sums bigint strings from Postgres and converts to ada', () => {
      expect(sumLovelaceAsAda(['1500000', '2500000'])).toBe(4);
    });

    it('sums amounts above Number.MAX_SAFE_INTEGER lovelace', () => {
      // 9,007,199,254,740,993 lovelace cannot be held exactly in a Number.
      expect(sumLovelaceAsAda(['9007199254740993', '1000000'])).toBeCloseTo(
        9007199255.741,
        3,
      );
    });

    it('treats missing, negative and malformed values as zero', () => {
      expect(sumLovelaceAsAda([null, undefined, '-5', 'abc', '1000000'])).toBe(
        1,
      );
      expect(sumLovelaceAsAda([])).toBe(0);
    });
  });

  describe('isVotingOption', () => {
    it('recognises the two predefined voting options only', () => {
      expect(isVotingOption('drep_always_abstain')).toBe(true);
      expect(isVotingOption('drep_always_no_confidence')).toBe(true);
      expect(isVotingOption('drep1abc')).toBe(false);
      expect(isVotingOption(null)).toBe(false);
    });
  });
});
