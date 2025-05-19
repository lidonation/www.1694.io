export const getDRepDelegatorsHistory = (addrIds: number[]) => {
  const hasAddrFilter = addrIds.length > 0;
  const addrFilterClause = hasAddrFilter
    ? `dva.addr_id IN (${addrIds.join(',')}) AND`
    : '';

  return `
    WITH latest_dva AS (
      SELECT 
        dva.addr_id,
        dva.drep_hash_id AS current_drep_hash_id,
        LAG(dva.drep_hash_id) OVER (PARTITION BY dva.addr_id ORDER BY dva.tx_id) AS previous_drep_hash_id,
        dva.tx_id
      FROM delegation_vote dva
    ),
    stake_values AS (
      SELECT 
        sa.id AS addr_id,
        (
          COALESCE((
            SELECT SUM(txo.value)
            FROM tx_out txo
            LEFT JOIN tx_in txi ON txo.tx_id = txi.tx_out_id AND txo.index = txi.tx_out_index
            WHERE txi.tx_out_id IS NULL AND txo.stake_address_id = sa.id
          ), 0)
          + COALESCE((
            SELECT SUM(amount) FROM reward WHERE addr_id = sa.id AND type <> 'refund'
          ), 0)
          + COALESCE((
            SELECT SUM(amount) FROM reward_rest WHERE addr_id = sa.id
          ), 0)
          + COALESCE((
            SELECT SUM(amount) FROM reward WHERE addr_id = sa.id AND type = 'refund'
          ), 0)
          - COALESCE((
            SELECT SUM(amount) FROM withdrawal WHERE addr_id = sa.id
          ), 0)
        ) AS stake
      FROM stake_address sa
      ${hasAddrFilter ? `WHERE sa.id IN (${addrIds.join(',')})` : ''}
    )
    SELECT 
      sa.view AS stake_address,
      $2::TEXT AS target_drep,
      curr.view AS current_drep,
      encode(curr.raw, 'hex') AS current_chain_id,
      curr.has_script AS current_drep_has_script,
      prev.view AS previous_drep,
      encode(prev.raw, 'hex') AS previous_chain_id,
      prev.has_script AS previous_drep_has_script,
      b.time AS timestamp,
      b.epoch_no AS delegation_epoch,
      encode(tx.hash, 'hex') AS tx_hash,
      'delegation' AS type,
      COALESCE(sv.stake, 0)::TEXT AS total_stake,
      curr.view = $2 AS added_power
    FROM latest_dva dva
    JOIN stake_address sa ON dva.addr_id = sa.id
    JOIN tx ON dva.tx_id = tx.id
    JOIN block b ON tx.block_id = b.id
    LEFT JOIN drep_hash curr ON dva.current_drep_hash_id = curr.id
    LEFT JOIN drep_hash prev ON dva.previous_drep_hash_id = prev.id
    LEFT JOIN stake_values sv ON sa.id = sv.addr_id
    WHERE 
      ${addrFilterClause}
      (curr.id = $1 OR prev.id = $1)
      AND b.time::DATE BETWEEN $3::DATE AND $4::DATE
    ORDER BY b.time DESC;
  `;
};
