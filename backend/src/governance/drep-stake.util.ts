const LOVELACE_PER_ADA = BigInt(1_000_000);

const VOTING_OPTION_IDS = new Set([
  'drep_always_abstain',
  'drep_always_no_confidence',
]);

/**
 * Live stake (lovelace) of the DRep with ID $1 and hex $2: what every current
 * delegator holds, across all ID aliases (legacy and CIP-129, same 56-char hex
 * suffix). A stake address counts once even if it appears under more than one
 * alias. Rows without a real hex (the voting options store '') only ever match
 * their own ID, so drep_always_abstain and drep_always_no_confidence stay apart.
 */
export const LIVE_STAKE_FOR_DREP_SQL = `
  SELECT COALESCE(SUM(amount_lovelace), 0) AS live_stake_lovelace
    FROM (
      SELECT DISTINCT ON (dd.stake_address) dd.amount_lovelace
        FROM drep_delegators dd
        JOIN dreps d ON d.drep_id = dd.drep_id
       WHERE d.drep_id = $1::text
          OR (LENGTH($2::text) >= 56
              AND LENGTH(d.hex) >= 56
              AND LOWER(RIGHT(d.hex, 56)) = LOWER(RIGHT($2::text, 56)))
       ORDER BY dd.stake_address, dd.updated_at DESC
    ) live`;

/**
 * Key that groups the ID aliases of one DRep: the last 56 hex characters of
 * the credential. A row without a full hex (the voting options store '') is
 * keyed by its own ID so it is never merged with anything else.
 */
export function drepAliasKey(drep: { drepId: string; hex?: string | null }) {
  const hex = drep.hex ?? '';
  return hex.length >= 56
    ? `hex:${hex.slice(-56).toLowerCase()}`
    : `id:${drep.drepId}`;
}

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
