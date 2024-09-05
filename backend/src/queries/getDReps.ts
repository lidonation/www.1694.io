export const getAllDRepsQuery = (
  sanitizedSearch: string,
  nameFilteredDRepCondition: string,
  campaignStatusCondition: string,
  chainStatusCondition: string,
  orderByClause: string,
  itemsPerPage: number,
  offset: number,
  typeCondition: string,
) => `
  WITH LatestEpoch AS (
      SELECT MAX(no) AS latest_epoch_no FROM epoch
  ),
  latest_delegations AS (
    SELECT 
      dv.addr_id,
      MAX(b.time) as latest_time
    FROM 
      delegation_vote dv
    JOIN 
      tx ON dv.tx_id = tx.id
    JOIN 
      block b ON tx.block_id = b.id
    GROUP BY 
      dv.addr_id
  ),
  live_power_cte AS (
    SELECT 
      dv.drep_hash_id,
      SUM(uv.value) AS live_power
    FROM 
      delegation_vote dv
    JOIN 
      stake_address sa ON dv.addr_id = sa.id
    JOIN 
      tx ON dv.tx_id = tx.id
    JOIN 
      block b ON tx.block_id = b.id
    JOIN 
      latest_delegations ld ON dv.addr_id = ld.addr_id AND b.time = ld.latest_time
    LEFT JOIN 
      utxo_view uv ON sa.id = uv.stake_address_id
    GROUP BY 
      dv.drep_hash_id
  ),
  RankedRows AS (
      SELECT 
          dh.id AS drep_hash_id, 
          dh.raw, 
          dh.view, 
          dh.has_script,
          dd.id AS drep_distr_id, 
          dd.hash_id, 
          dd.amount AS active_power, 
          dd.epoch_no, 
          dd.active_until,
          dr.id AS drep_registration_id, 
          dr.tx_id, 
          dr.cert_index, 
          dr.deposit, 
          dr.drep_hash_id AS reg_drep_hash_id, 
          dr.voting_anchor_id AS reg_voting_anchor_id,  
          va.id AS voting_anchor_id, 
          va.url, 
          va.data_hash, 
          va.type,
          sa.view AS stake_address,
          le.latest_epoch_no,
          COALESCE(lp.live_power, 0) AS live_power,
          (
            SELECT COUNT(DISTINCT dv_inner.addr_id)
            FROM delegation_vote dv_inner
            JOIN latest_delegations ld ON dv_inner.addr_id = ld.addr_id
            JOIN tx ON dv_inner.tx_id = tx.id
            JOIN block b ON tx.block_id = b.id AND b.time = ld.latest_time
            WHERE dv_inner.drep_hash_id = dh.id
          ) AS delegation_vote_count,
          ROW_NUMBER() OVER (PARTITION BY dh.id ORDER BY dd.epoch_no DESC) AS RowNum
      FROM 
          drep_hash AS dh
      LEFT JOIN 
          drep_distr AS dd ON dh.id = dd.hash_id
      LEFT JOIN 
          drep_registration AS dr ON dh.id = dr.drep_hash_id
      LEFT JOIN 
          voting_anchor AS va ON dr.voting_anchor_id = va.id
      LEFT JOIN 
          delegation_vote AS dv ON dh.id = dv.drep_hash_id 
      LEFT JOIN
          stake_address AS sa ON dv.addr_id = sa.id
      CROSS JOIN 
          LatestEpoch le
      LEFT JOIN
          live_power_cte lp ON dh.id = lp.drep_hash_id
      WHERE
          dh.view ILIKE '%${sanitizedSearch}%' 
          ${nameFilteredDRepCondition}
          ${campaignStatusCondition}
          ${chainStatusCondition}
          ${typeCondition}
  )
  SELECT 
      drep_hash_id,
      view,
      delegation_vote_count,
      live_power,
      stake_address,
      active_power,
      epoch_no,
      active_until,
      latest_epoch_no,
      deposit,
      url,
      has_script,
      type
  FROM 
      RankedRows
  WHERE 
      RowNum = 1
  ${orderByClause}
  LIMIT ${itemsPerPage} OFFSET ${offset}
`;
  
  
  export const getTotalResultsQuery = (
    sanitizedSearch: string,
    nameFilteredDRepCondition: string,
    campaignStatusCondition: string,
    chainStatusCondition: string,
    typeCondition: string
  ) => `
    WITH LatestEpoch AS (
        SELECT MAX(no) AS latest_epoch_no FROM epoch
    )
    SELECT COUNT(DISTINCT dh.id) AS total
    FROM drep_hash AS dh
    LEFT JOIN drep_distr AS dd ON dh.id = dd.hash_id
    CROSS JOIN LatestEpoch le
    WHERE dh.view ILIKE '%${sanitizedSearch}%'
    ${nameFilteredDRepCondition} 
    ${campaignStatusCondition}
    ${chainStatusCondition}
    ${typeCondition}
  `;
  