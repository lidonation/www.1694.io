export const drepRegistrationQuery = `
SELECT
    dh.view,
    ENCODE(dh.raw, 'hex') AS raw,
    dr.deposit,
    dr.tx_id,
    ROW_NUMBER() OVER (PARTITION BY dr.drep_hash_id ORDER BY dr.tx_id DESC) AS rn,
    (
        SELECT
            dd.amount AS voting_power
        FROM
            drep_distr AS dd
        WHERE
            dd.hash_id = dh.id
        ORDER BY
            dd.epoch_no DESC
        LIMIT 1
    ) AS voting_power,
    txo.stake_address_id
FROM
    drep_hash dh
JOIN
    drep_registration dr ON dh.id = dr.drep_hash_id
JOIN 
    tx_out txo ON txo.tx_id = dr.tx_id
WHERE
    (
        dh.view = $1
        OR 
        (
            $1 ~ '^[0-9a-fA-F]+$' AND 
            encode(dh.raw, 'hex') = $1
        )
    )
LIMIT 1
`;
