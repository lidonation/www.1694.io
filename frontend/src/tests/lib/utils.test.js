import {
  formatAsCurrency,
  formatNumberTimeToReadable,
  lovelaceToAda,
} from '@/lib/utils';

describe('honest formatters (issue 227)', () => {
  test('formatNumberTimeToReadable(undefined/null) has no Invalid Date', () => {
    expect(formatNumberTimeToReadable(undefined)).toBe('Unknown date');
    expect(formatNumberTimeToReadable(null)).toBe('Unknown date');
    expect(formatNumberTimeToReadable('')).toBe('Unknown date');
  });

  test('formatNumberTimeToReadable parses ISO strings, not Jan 1970', () => {
    const out = formatNumberTimeToReadable('2025-04-30T08:12:57.000Z');
    expect(out).not.toContain('1970');
    expect(out).toContain('2025');
  });

  test('formatAsCurrency(undefined) has no NaN, null has no misleading 0', () => {
    expect(formatAsCurrency(undefined)).toBe('Unknown');
    expect(formatAsCurrency(null)).toBe('Unknown');
    expect(formatAsCurrency(Number.NaN)).toBe('Unknown');
  });

  test('lovelaceToAda(undefined/null) returns null, not NaN/0', () => {
    expect(lovelaceToAda(undefined)).toBeNull();
    expect(lovelaceToAda(null)).toBeNull();
    expect(lovelaceToAda(1000000)).toBe(1);
  });
});
