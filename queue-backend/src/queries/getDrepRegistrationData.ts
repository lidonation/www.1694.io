export const getDrepRegistrationData = `
WITH target_stake_address AS (
    SELECT id
    FROM stake_address 
    WHERE view = $1
),
relevant_tx_outs AS (
    SELECT tx_id
    FROM tx_out
    WHERE stake_address_id IN (SELECT id FROM target_stake_address)
),
relevant_drep_registrations AS (
    SELECT 
        drep_hash_id,
        deposit,
        CASE 
            WHEN deposit <= -500000000 THEN true
            ELSE false
        END AS retired,
        ROW_NUMBER() OVER (PARTITION BY drep_hash_id ORDER BY id DESC) as rn
    FROM drep_registration
    WHERE tx_id IN (SELECT tx_id FROM relevant_tx_outs)
),
latest_drep_registrations AS (
    SELECT 
        drep_hash_id,
        deposit,
        retired
    FROM relevant_drep_registrations
    WHERE rn = 1
)
SELECT 
    dh.view,
    ldr.deposit,
    ldr.retired
FROM drep_hash dh
INNER JOIN latest_drep_registrations ldr ON dh.id = ldr.drep_hash_id;
`