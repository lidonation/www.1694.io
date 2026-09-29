import {
  formatProposalCardDate,
  getDatasetFreshness,
  selectDatasetFreshness,
  shouldShowDatasetStaleWarning,
} from '@/lib/utils';

describe('formatProposalCardDate (issue 226)', () => {
  test('formats a valid date like the old card', () => {
    expect(formatProposalCardDate('2025-10-15 09:20:16')).toBe('15 Oct 2025');
  });

  test('falls back on missing value', () => {
    expect(formatProposalCardDate(undefined)).toBe('Unknown date');
    expect(formatProposalCardDate(null)).toBe('Unknown date');
    expect(formatProposalCardDate('')).toBe('Unknown date');
  });

  test('falls back on invalid date, never Invalid Date', () => {
    expect(formatProposalCardDate('not-a-date')).toBe('Unknown date');
    expect(formatProposalCardDate('not-a-date')).not.toContain('Invalid');
  });
});

describe('getDatasetFreshness (issue 226)', () => {
  const now = new Date('2026-09-29T00:00:00Z').getTime();

  test('marks the October 2025 snapshot stale', () => {
    const rows = [
      { updatedAt: '2025-10-15 09:20:16' },
      { updatedAt: '2025-10-15 09:20:14' },
    ];
    const result = getDatasetFreshness(rows, now, 90);
    expect(result.newestUpdatedAt).toBe('2025-10-15 09:20:16');
    expect(result.stale).toBe(true);
    expect(result.ageDays).toBeGreaterThan(90);
  });

  test('fresh data is not stale', () => {
    const fresh = new Date(now - 5 * 86400000).toISOString();
    const result = getDatasetFreshness([{ updatedAt: fresh }], now, 90);
    expect(result.stale).toBe(false);
    expect(result.ageDays).toBe(5);
    const justPastThreshold = new Date(
      now - 90 * 86400000 - 1000,
    ).toISOString();
    expect(
      getDatasetFreshness([{ updatedAt: justPastThreshold }], now, 90).stale,
    ).toBe(true);
    expect(result.thresholdDays).toBe(90);
  });

  test('future record clamps age to 0 and is not stale', () => {
    const future = new Date(now + 5 * 86400000).toISOString();
    const result = getDatasetFreshness([{ updatedAt: future }], now, 90);
    expect(result.ageDays).toBe(0);
    expect(result.stale).toBe(false);
  });

  test('empty or invalid sets report stale with null age', () => {
    expect(getDatasetFreshness([], now, 90)).toEqual({
      newestUpdatedAt: null,
      ageDays: null,
      stale: true,
      thresholdDays: 90,
    });
    expect(getDatasetFreshness([{ updatedAt: 'garbage' }], now, 90).stale).toBe(
      true,
    );
  });
});

describe('budget freshness display policy (issue 226)', () => {
  const local = {
    newestUpdatedAt: '2025-10-15 09:20:16',
    ageDays: 349,
    stale: true,
    thresholdDays: 90,
  };
  const server = { ...local, newestUpdatedAt: '2025-10-16 09:20:16' };

  test('uses server-wide freshness even when list filters are active', () => {
    expect(selectDatasetFreshness(server, local, true, false)).toBe(server);
  });

  test('does not call a filtered or loading list the newest dataset record', () => {
    expect(selectDatasetFreshness(null, local, true, false)).toBeNull();
    expect(selectDatasetFreshness(null, local, false, true)).toBeNull();
    expect(selectDatasetFreshness(null, local, false, false)).toBe(local);
  });

  test('shows a stale warning only when a record date proves staleness', () => {
    expect(shouldShowDatasetStaleWarning(local)).toBe(true);
    expect(
      shouldShowDatasetStaleWarning({ ...local, newestUpdatedAt: null }),
    ).toBe(false);
    expect(shouldShowDatasetStaleWarning(null)).toBe(false);
  });
});
