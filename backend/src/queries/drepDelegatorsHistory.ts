export const getDRepDelegatorsHistory = (addrIds: []) => {
  const addrIdsCondition =
    addrIds.length > 0
      ? `WHERE
    dva.addr_id IN (${addrIds.join(',')})
    AND (current_drep.id = $1 OR previous_drep.id = $1)
    AND b.time::DATE BETWEEN $4::DATE AND $3::DATE`
      : `WHERE
    (current_drep.id = $1 OR previous_drep.id = $1)
    AND b.time::DATE BETWEEN $4::DATE AND $3::DATE`;
  return `
    SELECT 
    sa.view AS stake_address,
	$2::TEXT AS target_drep,
    current_drep.view AS current_drep,
    encode(current_drep.raw, 'hex') AS current_chain_id,
    current_drep.has_script AS current_drep_has_script,
    previous_drep.view AS previous_drep,
    encode(previous_drep.raw, 'hex') AS previous_chain_id,
    previous_drep.has_script AS previous_drep_has_script,
    b.time AS timestamp,
    b.epoch_no AS delegation_epoch,
    SUBSTRING(CAST(tx.hash AS TEXT) FROM 3) AS tx_hash,
    'delegation' AS type,
	(
      COALESCE(stake_summary.stake, 0) 
    )::TEXT AS total_stake,

	CASE 
        WHEN current_drep.view = $2 THEN true
        ELSE false
    END AS added_power
FROM 
    (
        SELECT 
            dva.addr_id,
            dva.drep_hash_id AS current_drep_hash_id,
            LAG(dva.drep_hash_id) OVER (PARTITION BY dva.addr_id ORDER BY dva.tx_id) AS previous_drep_hash_id,
            dva.tx_id
        FROM 
            delegation_vote dva
    ) AS dva
JOIN 
    stake_address sa 
    ON dva.addr_id = sa.id
LEFT JOIN 
    tx 
    ON dva.tx_id = tx.id
LEFT JOIN 
    block b 
    ON tx.block_id = b.id
LEFT JOIN 
    drep_hash current_drep 
    ON dva.current_drep_hash_id = current_drep.id
LEFT JOIN 
    drep_hash previous_drep 
    ON dva.previous_drep_hash_id = previous_drep.id
LEFT JOIN (
    SELECT 
        sa_inner.id AS addr_id,
        (
            (
                SELECT COALESCE(SUM(txo.value), 0)
                FROM tx_out txo
                LEFT JOIN tx_in txi ON txo.tx_id = txi.tx_out_id AND txo.index = txi.tx_out_index
                WHERE txi.tx_out_id IS NULL
                AND txo.stake_address_id = sa_inner.id
            )
            + COALESCE(
                (
                    SELECT SUM(amount)
                    FROM reward
                    WHERE addr_id = sa_inner.id
                    AND type <> 'refund'
                ), 0
            )
            + COALESCE(
                (
                    SELECT SUM(amount)
                    FROM reward_rest
                    WHERE addr_id = sa_inner.id
                ), 0
            )
            + COALESCE(
                (
                    SELECT SUM(amount)
                    FROM reward
                    WHERE addr_id = sa_inner.id
                    AND type = 'refund'
                ), 0
            )
            - COALESCE(
                (
                    SELECT SUM(amount)
                    FROM withdrawal
                    WHERE addr_id = sa_inner.id
                ), 0
            )
        ) AS stake
    FROM 
        stake_address sa_inner
    WHERE 
        sa_inner.id IN (SELECT DISTINCT addr_id FROM delegation_vote)
) AS stake_summary
ON sa.id = stake_summary.addr_id
${addrIdsCondition}
ORDER BY 
    b.time DESC`;
};
