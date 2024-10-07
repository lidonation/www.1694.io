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
      WITH total_stake AS (
          SELECT addr_id, COALESCE(amount, 0) AS amount, NULL AS tx_id FROM reward r WHERE r.type <> 'refund'
          UNION ALL
          SELECT addr_id, COALESCE(amount, 0) AS amount, NULL AS tx_id FROM reward_rest rr
          UNION ALL
          SELECT addr_id, COALESCE(amount, 0) AS amount, NULL AS tx_id FROM reward r WHERE r.type = 'refund'
          UNION ALL
          SELECT stake_address_id, value AS amount, tx_id::text FROM tx_out WHERE consumed_by_tx_id IS NULL
          UNION ALL
          SELECT addr_id, (amount * -1) AS amount, tx_id::text FROM withdrawal
      )
      SELECT DISTINCT
          sa.view AS stake_address,
          $2::TEXT AS target_drep,
              current_drep.view AS current_drep,
          previous_drep.view AS previous_drep,
          b.time AS timestamp,
    b.epoch_no AS delegation_epoch,
    SUBSTRING(CAST(tx.hash AS TEXT) FROM 3) AS tx_hash,
    'delegation' AS type,
    SUM(ts.amount) AS total_stake,
	CASE 
        WHEN current_drep.view = $2 THEN true
              ELSE false
      END AS added_power

	
FROM 
    delegation_vote dva
    LEFT JOIN delegation_vote dvb ON dva.addr_id = dvb.addr_id AND dvb.tx_id = (
        SELECT MAX(tx_id) 
        FROM delegation_vote 
        WHERE addr_id = dva.addr_id 
        AND tx_id < dva.tx_id
    )
    JOIN stake_address sa ON dva.addr_id = sa.id
    LEFT JOIN tx ON dva.tx_id = tx.id
    JOIN total_stake ts ON ts.addr_id = sa.id
    LEFT JOIN block b ON tx.block_id = b.id
    LEFT JOIN drep_hash current_drep ON dva.drep_hash_id = current_drep.id
    LEFT JOIN drep_hash previous_drep ON dvb.drep_hash_id = previous_drep.id

      ${addrIdsCondition}

      GROUP BY
      sa.view,
      current_drep.view,
      previous_drep.view,
      b.time,
      b.epoch_no,
      tx.hash,
      tx.block_id
      ORDER BY
      b.time DESC;`;
};
