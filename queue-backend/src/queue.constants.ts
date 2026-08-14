export const MAX_COMPLETED_JOB_AGE = 3600;
export const MAX_FAILED_JOB_AGE = 3600;
export const MAX_COMPLETED_JOBS = 1000;
export const MAX_FAILED_JOBS = 1000;
export const DEFAULT_ATTEMPTS = 3;

// Lock durations for long-running sync workers (ms).
// BullMQ default is 30s — far too short for jobs that page through hundreds
// of proposals with per-item API calls and 50-100ms rate-limit delays.
export const LOCK_DURATION_HEAVY = 30 * 60 * 1000; // 30 min — governance/proposal full syncs
export const LOCK_DURATION_MEDIUM = 10 * 60 * 1000; // 10 min — vote/stake syncs
