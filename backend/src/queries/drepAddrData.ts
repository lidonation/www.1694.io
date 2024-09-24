export const getDrepAddrData: string = `
       WITH LatestRegistration AS (
    SELECT 
      dr.id AS reg_id, 
      dr.drep_hash_id, 
      dr.voting_anchor_id, 
      dr.deposit,
      tx_out.stake_address_id as stake_addr,
      ROW_NUMBER() OVER (PARTITION BY dr.drep_hash_id ORDER BY reg_tx_bk.time DESC) AS RegRowNum
    FROM 
      drep_registration AS dr
    LEFT JOIN 
      tx AS reg_tx ON dr.tx_id = reg_tx.id 
    LEFT JOIN 
      tx_out ON reg_tx.id = tx_out.tx_id
    LEFT JOIN 
      block AS reg_tx_bk ON reg_tx.block_id = reg_tx_bk.id
    WHERE 
      tx_out.stake_address_id IS NOT NULL 
), 

DRepWalletAddressData AS (
  SELECT 
    addr.address,
    COALESCE(SUM(addr.value), 0) AS total_value,
    addr.stake_address_id AS stake_addr
  FROM 
    tx_out AS addr
  WHERE 
    addr.stake_address_id IS NOT NULL AND addr.consumed_by_tx_id IS NULL
  GROUP BY 
    addr.address, addr.stake_address_id
),
RankedRows AS (
  SELECT 
    dh.id AS drep_hash_id, 
    dh.raw, 
    dh.view,
    dr_addr_data.address,
    dr_addr_data.total_value,
    dh.has_script, 
    dd.id AS drep_distr_id, 
    COALESCE(dd.amount, 0) AS voting_power,
    dd.epoch_no, 
    dd.active_until,
    sa.view AS stake_address,
    ROW_NUMBER() OVER (PARTITION BY dh.id ORDER BY dd.epoch_no DESC) AS RowNum
  FROM 
    drep_hash AS dh
  LEFT JOIN 
    drep_distr AS dd ON dh.id = dd.hash_id
  LEFT JOIN 
    LatestRegistration AS lr ON dh.id = lr.drep_hash_id AND lr.RegRowNum = 1
  LEFT JOIN 
    delegation_vote AS dv ON dh.id = dv.drep_hash_id 
  LEFT JOIN 
    DRepWalletAddressData AS dr_addr_data ON dr_addr_data.stake_addr = lr.stake_addr
  LEFT JOIN 
    stake_address AS sa ON dv.addr_id = sa.id
  WHERE 
    dh.view = $1
)
SELECT 
  drep_hash_id,
  view,
  address,
  total_value,
  stake_address,
  epoch_no
FROM 
  RankedRows
WHERE 
  RowNum = 1`;
