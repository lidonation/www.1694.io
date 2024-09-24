export const getStakeKeyData: string = `
SELECT 
tx_out.address,
COALESCE(SUM(tx_out.value), 0) AS total_value,
dh.view as drep_id,
sa.view as stake_address

FROM tx_out 
LEFT JOIN
drep_registration as dr on dr.tx_id = tx_out.tx_id
LEFT JOIN 
drep_hash as dh on dh.id = dr.drep_hash_id
LEFT JOIN
stake_address as sa on tx_out.stake_address_id = sa.id

WHERE sa.view = $1 AND tx_out.consumed_by_tx_id IS NULL
GROUP BY 
    tx_out.address, sa.view, dh.view`;
