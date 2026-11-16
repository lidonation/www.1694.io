import { AutomatedVotingOptionDelegationId } from '@/models/enums';

// A Map, so an ID like "constructor" never resolves to an Object prototype key.
const VOTING_OPTION_LABELS = new Map<string, string>([
  [AutomatedVotingOptionDelegationId.abstain, 'Always Abstain'],
  [AutomatedVotingOptionDelegationId.no_confidence, 'Always No Confidence'],
]);

/** Readable name of a predefined CIP-1694 voting option, or null for a DRep. */
export function votingOptionLabel(view?: string | null): string | null {
  return (view && VOTING_OPTION_LABELS.get(view)) || null;
}

export function isVotingOptionView(view?: string | null): boolean {
  return votingOptionLabel(view) !== null;
}

/**
 * Change of live stake against the voting power snapshot, in percent, rounded
 * to `fixed` decimals. Null when there is nothing worth showing: missing or
 * zero voting power, missing live stake, or a change that rounds to zero.
 */
export function liveStakeChangePercent(
  liveStake: number | string | null | undefined,
  votingPower: number | string | null | undefined,
  fixed = 2,
): number | null {
  if (liveStake === null || liveStake === undefined || liveStake === '')
    return null;
  const live = Number(liveStake);
  const power = Number(votingPower);
  if (!Number.isFinite(live) || !Number.isFinite(power) || power <= 0)
    return null;
  const change = Number((((live - power) / power) * 100).toFixed(fixed));
  return change === 0 ? null : change; // also true for -0
}

/** "+1.25%" / "-0.4%" for a change from liveStakeChangePercent. */
export function formatPercentChange(change: number): string {
  return `${new Intl.NumberFormat('en-US', {
    signDisplay: 'exceptZero',
    maximumFractionDigits: 2,
  }).format(change)}%`;
}
