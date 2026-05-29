import { bech32, bech32m } from 'bech32';

const DREP_TYPE_BECH32M = new Set(['ADDR_KEYHASH', 'SCRIPTHASH']);
const CC_HOT_TYPE = 'CONSTITUTIONAL_COMMITTEE_HOT_KEY_HASH';
const POOL_TYPE = 'STAKE_POOL_KEY_HASH';

export function drepHashToBech32(hash: string, type: string): string {
  if (type === 'ALWAYS_ABSTAIN')       return 'drep_always_abstain';
  if (type === 'ALWAYS_NO_CONFIDENCE') return 'drep_always_no_confidence';

  try {
    const words = bech32m.toWords(Buffer.from(hash, 'hex'));
    return bech32m.encode('drep', words);
  } catch {
    return `hex:${hash}`;
  }
}

export function voterHashToBech32(hash: string, voterType: string): string {
  try {
    if (voterType === CC_HOT_TYPE || voterType === 'CONSTITUTIONAL_COMMITTEE_HOT_SCRIPT_HASH') {
      const words = bech32m.toWords(Buffer.from(hash, 'hex'));
      return bech32m.encode('cc_hot', words);
    }
    if (voterType === POOL_TYPE) {
      const words = bech32.toWords(Buffer.from(hash, 'hex'));
      return bech32.encode('pool', words);
    }
    // DREP_KEY_HASH / DREP_SCRIPT_HASH
    const words = bech32m.toWords(Buffer.from(hash, 'hex'));
    return bech32m.encode('drep', words);
  } catch {
    return `hex:${hash}`;
  }
}

export function isDrepVoter(voterType: string): boolean {
  return voterType === 'DREP_KEY_HASH' || voterType === 'DREP_SCRIPT_HASH';
}
