export const getAddrDataQuery: string = `
SELECT 
tx_out.address,
sa.view as stake_address,
COALESCE(SUM(tx_out.value), 0) AS total_value,
dh.view as drep_id
FROM tx_out 
LEFT JOIN
drep_registration as dr on dr.tx_id = tx_out.tx_id
LEFT JOIN 
drep_hash as dh on dh.id = dr.drep_hash_id
LEFT JOIN
stake_address as sa on sa.id = tx_out.stake_address_id
WHERE tx_out.address = $1 AND tx_out.consumed_by_tx_id IS NULL
GROUP BY 
    tx_out.address, tx_out.stake_address_id, dh.view, sa.view
    `;
