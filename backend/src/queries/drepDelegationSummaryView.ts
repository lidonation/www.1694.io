export const drepDelegationSummaryView = `
CREATE MATERIALIZED VIEW DrepDelegationSummary
AS
SELECT 
    dh.id AS drep_hash_id,
    COUNT(DISTINCT ld.addr_id) AS vote_count,
    SUM(tx_out.value) AS live_stake
FROM 
    drep_hash dh
JOIN (
    -- Subquery for LatestDelegation
    SELECT 
        dv.addr_id,
        dv.drep_hash_id,
        ROW_NUMBER() OVER (PARTITION BY dv.addr_id ORDER BY dv.tx_id DESC) AS row_num
    FROM 
        delegation_vote dv
) ld ON dh.id = ld.drep_hash_id AND ld.row_num = 1
JOIN stake_address sa ON ld.addr_id = sa.id
JOIN tx_out ON sa.id = tx_out.stake_address_id
LEFT JOIN tx_in ON tx_out.tx_id = tx_in.tx_out_id AND tx_out.index = tx_in.tx_out_index
WHERE 
    tx_in.tx_out_id IS NULL
GROUP BY 
    dh.id
WITH DATA;`;
