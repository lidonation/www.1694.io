const LOVELACE_PER_ADA = BigInt(1_000_000);

const VOTING_OPTION_IDS = new Set([
  'drep_always_abstain',
  'drep_always_no_confidence',
]);

/**
 * Live stake (lovelace) of the DRep with hex $1: what every current delegator
 * holds, across all ID aliases (legacy and CIP-129, same 56-char hex suffix).
 * A stake address counts once even if it appears under more than one alias.
 */
export const LIVE_STAKE_FOR_HEX_SQL = `
  SELECT COALESCE(SUM(amount_lovelace), 0) AS live_stake_lovelace
    FROM (
      SELECT DISTINCT ON (dd.stake_address) dd.amount_lovelace
        FROM drep_delegators dd
        JOIN dreps d ON d.drep_id = dd.drep_id
       WHERE LOWER(RIGHT(d.hex, 56)) = LOWER(RIGHT($1, 56))
       ORDER BY dd.stake_address, dd.updated_at DESC
    ) live`;

/**
 * Total live stake (lovelace) delegated to active DReps, each stake address
 * counted once. Matches the scope of the total voting power metric.
 */
export const TOTAL_LIVE_STAKE_SQL = `
  SELECT COALESCE(SUM(amount_lovelace), 0) AS total_lovelace
    FROM (
      SELECT DISTINCT ON (dd.stake_address) dd.amount_lovelace
        FROM drep_delegators dd
        JOIN dreps d ON d.drep_id = dd.drep_id
       WHERE d.active = true
       ORDER BY dd.stake_address, dd.updated_at DESC
    ) live`;

/** The two predefined CIP-1694 voting options are not individual DReps. */
export function isVotingOption(drepId?: string | null): boolean {
  return !!drepId && VOTING_OPTION_IDS.has(drepId);
}

/**
 * Sums lovelace amounts (bigint columns arrive as strings) without losing
 * precision, then converts to ada. Missing or malformed values count as 0.
 */
export function sumLovelaceAsAda(
  amounts: Iterable<string | number | bigint | null | undefined>,
): number {
  let total = BigInt(0);
  for (const amount of amounts) {
    if (amount == null) continue;
    try {
      const value = BigInt(
        typeof amount === 'number' ? Math.trunc(amount) : amount,
      );
      if (value > BigInt(0)) total += value;
    } catch {
      // Not an integer amount; ignore it rather than corrupt the total.
    }
  }
  return (
    Number(total / LOVELACE_PER_ADA) +
    Number(total % LOVELACE_PER_ADA) / Number(LOVELACE_PER_ADA)
  );
}
