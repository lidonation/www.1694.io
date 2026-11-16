import {
  formatPercentChange,
  isVotingOptionView,
  liveStakeChangePercent,
  votingOptionLabel,
} from '@/lib/drepDisplay';

describe('drepDisplay', () => {
  test('names the predefined voting options', () => {
    expect(votingOptionLabel('drep_always_no_confidence')).toBe(
      'Always No Confidence',
    );
    expect(votingOptionLabel('drep_always_abstain')).toBe('Always Abstain');
    expect(votingOptionLabel('drep1xyz')).toBeNull();
    expect(isVotingOptionView('drep_always_abstain')).toBe(true);
    expect(isVotingOptionView(undefined)).toBe(false);
    // Object prototype keys are not voting options.
    expect(votingOptionLabel('constructor')).toBeNull();
    expect(votingOptionLabel('__proto__')).toBeNull();
    expect(isVotingOptionView('toString')).toBe(false);
  });

  test('returns no change when live stake equals voting power', () => {
    expect(liveStakeChangePercent(100, 100)).toBeNull();
    expect(liveStakeChangePercent('100.001', '100')).toBeNull();
  });

  test('returns no change when inputs cannot produce one', () => {
    expect(liveStakeChangePercent(null, 100)).toBeNull();
    expect(liveStakeChangePercent(50, 0)).toBeNull();
    expect(liveStakeChangePercent(50, null)).toBeNull();
    expect(liveStakeChangePercent('abc', 100)).toBeNull();
  });

  test('returns the signed percentage change against voting power', () => {
    expect(liveStakeChangePercent(110, 100)).toBe(10);
    expect(liveStakeChangePercent(99.5, 100)).toBe(-0.5);
    expect(formatPercentChange(10)).toBe('+10%');
    expect(formatPercentChange(-0.5)).toBe('-0.5%');
  });
});
