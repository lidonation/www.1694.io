export const getStakeKeyData: string = `
SELECT sa.view AS stake_address,
COALESCE(SUM(txo.value), 0) AS total_stake
FROM stake_address AS sa
JOIN tx_out txo ON sa.id = txo.stake_address_id
LEFT JOIN tx_in txi ON txo.tx_id = txi.tx_out_id AND txo.index = txi.tx_out_index
WHERE sa.view = $1
  AND txi.tx_out_id IS NULL
GROUP BY sa.view;`;

