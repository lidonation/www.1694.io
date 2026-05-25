export type EpochParams = {
  dvt_motion_no_confidence: string | null;
  dvt_committee_normal: string | null;
  dvt_committee_no_confidence: string | null;
  dvt_update_to_constitution: string | null;
  dvt_hard_fork_initiation: string | null;
  dvt_p_p_network_group: string | null;
  dvt_p_p_economic_group: string | null;
  dvt_p_p_technical_group: string | null;
  dvt_p_p_gov_group: string | null;
  dvt_treasury_withdrawal: string | null;
  pvt_motion_no_confidence: string | null;
  pvt_committee_normal: string | null;
  pvt_committee_no_confidence: string | null;
  pvt_hard_fork_initiation: string | null;
  gov_action_lifetime: number | null;
  [key: string]: unknown;
};

export type GovernanceThresholds = {
  dvt: number | null;
  pvt: number | null;
  dvtLabel: string | null;
  isInfoAction: boolean;
};

const pct = (val: string | null): number | null => {
  if (val === null || val === undefined) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 100);
};

export function getThresholdsForType(
  governanceType: string | null | undefined,
  epochParams: EpochParams | null | undefined,
): GovernanceThresholds {
  if (!governanceType || !epochParams) {
    return { dvt: null, pvt: null, dvtLabel: null, isInfoAction: false };
  }

  const type = governanceType.toLowerCase();

  if (type.includes('info') || type === 'info_action') {
    return { dvt: null, pvt: null, dvtLabel: null, isInfoAction: true };
  }

  if (type.includes('noconfidence') || type === 'no_confidence') {
    return {
      dvt: pct(epochParams.dvt_motion_no_confidence),
      pvt: pct(epochParams.pvt_motion_no_confidence),
      dvtLabel: 'DRep',
      isInfoAction: false,
    };
  }

  if (type.includes('updatecommittee') || type.includes('newcommittee') || type === 'new_committee') {
    return {
      dvt: pct(epochParams.dvt_committee_normal),
      pvt: pct(epochParams.pvt_committee_normal),
      dvtLabel: 'DRep',
      isInfoAction: false,
    };
  }

  if (type.includes('newconstitution') || type === 'new_constitution') {
    return {
      dvt: pct(epochParams.dvt_update_to_constitution),
      pvt: null,
      dvtLabel: 'DRep',
      isInfoAction: false,
    };
  }

  if (type.includes('hardfork') || type === 'hard_fork_initiation') {
    return {
      dvt: pct(epochParams.dvt_hard_fork_initiation),
      pvt: pct(epochParams.pvt_hard_fork_initiation),
      dvtLabel: 'DRep',
      isInfoAction: false,
    };
  }

  if (type.includes('parameterchange') || type === 'parameter_change') {
    const dvts = [
      epochParams.dvt_p_p_network_group,
      epochParams.dvt_p_p_economic_group,
      epochParams.dvt_p_p_technical_group,
      epochParams.dvt_p_p_gov_group,
    ].map(pct).filter((v): v is number => v !== null);

    const min = dvts.length ? Math.min(...dvts) : null;
    return {
      dvt: min,
      pvt: null,
      dvtLabel: 'DRep (varies by group)',
      isInfoAction: false,
    };
  }

  if (type.includes('treasury') || type === 'treasury_withdrawals') {
    return {
      dvt: pct(epochParams.dvt_treasury_withdrawal),
      pvt: null,
      dvtLabel: 'DRep',
      isInfoAction: false,
    };
  }

  return { dvt: null, pvt: null, dvtLabel: null, isInfoAction: false };
}

export type LifecycleStatus = 'ratified' | 'enacted' | 'expired' | 'dropped' | 'active';

export function getLifecycleStatus(
  action: {
    ratified_epoch?: number | null;
    enacted_epoch?: number | null;
    expired_epoch?: number | null;
    dropped_epoch?: number | null;
    expiration_epoch?: number | null;
  },
  currentEpoch?: number | null,
): LifecycleStatus {
  if (action.enacted_epoch) return 'enacted';
  if (action.ratified_epoch) return 'ratified';
  if (action.expired_epoch) return 'expired';
  if (action.dropped_epoch) return 'dropped';
  if (action.expiration_epoch && currentEpoch && currentEpoch > action.expiration_epoch) return 'expired';
  return 'active';
}
