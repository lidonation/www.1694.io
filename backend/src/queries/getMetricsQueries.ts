
export const getTotalDrepsAndVotingPower = `
WITH latest_registration AS (
    SELECT
        drep_hash_id,
        deposit,
        ROW_NUMBER() OVER (PARTITION BY drep_hash_id ORDER BY id DESC) AS rn
    FROM
        drep_registration
),
registered_dreps AS (
    SELECT
        h.id AS drep_hash_id
    FROM
        drep_hash h
    LEFT JOIN
        latest_registration r ON h.id = r.drep_hash_id
    WHERE
        (r.rn = 1 AND (r.deposit = 500000000))
        -- OR r.drep_hash_id IS NULL  -- Include DReps with no registration entry
),
latest_epoch AS (
    SELECT
        hash_id,
        MAX(epoch_no) AS latest_epoch_no
    FROM
        drep_distr
    GROUP BY
        hash_id
)
SELECT
    SUM(d.amount) AS total_active_power,
    (SELECT COUNT(DISTINCT drep_hash_id) FROM registered_dreps) AS total_dreps
FROM
    drep_distr d
JOIN
    registered_dreps a ON d.hash_id = a.drep_hash_id
JOIN
    latest_epoch e ON d.hash_id = e.hash_id AND d.epoch_no = e.latest_epoch_no;
`;
export const getTotalDelegatorsQuery = `
With delegation_summary as (SELECT * from "drepdelegationsummary")
select SUM(vote_count) as total_delegators
from delegation_summary`;
export const getTotalGovernanceActionsQuery = `SELECT COUNT(*) as count FROM "gov_action_proposal"`;
export const getActiveDRepsQuery=`
WITH latest_epoch AS (
    -- Get the latest epoch from the block table
    SELECT MAX(epoch_no) AS latest_epoch_no
    FROM block
),
latest_registration AS (
    SELECT
        drep_hash_id,
        deposit,
        ROW_NUMBER() OVER (PARTITION BY drep_hash_id ORDER BY id DESC) AS rn
    FROM
        drep_registration
),
active_dreps AS (
    -- Select distinct hash_ids where active_until is greater than the latest epoch
    SELECT DISTINCT dd.hash_id
    FROM drep_distr dd
    JOIN latest_epoch le ON dd.active_until > le.latest_epoch_no
    LEFT JOIN
        latest_registration r ON dd.hash_id = r.drep_hash_id
    WHERE
        (r.rn = 1 AND (r.deposit = 500000000 OR r.deposit IS NULL))
        OR r.drep_hash_id IS NULL  -- Include DReps with no registration entry
)
SELECT
    COUNT(*) AS total_active_dreps
FROM active_dreps;
`