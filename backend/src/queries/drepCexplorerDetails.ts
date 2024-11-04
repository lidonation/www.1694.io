export const getDrepCexplorerDetailsQuery: string = `
    WITH DRepActivity AS (
        SELECT drep_activity,
               epoch_no AS epoch_no
        FROM epoch_param
        WHERE epoch_no IS NOT NULL
        ORDER BY epoch_no DESC
        LIMIT 1
    ),
    LatestRegistration AS (
        SELECT 
          dr.id AS reg_id, 
          dr.drep_hash_id, 
          dr.voting_anchor_id, 
          dr.deposit,
          dr.tx_id,
          va.url AS metadata_url,
          ROW_NUMBER() OVER (PARTITION BY dr.drep_hash_id ORDER BY dr.tx_id DESC) AS RegRowNum
        FROM 
          drep_registration AS dr
        LEFT JOIN 
          voting_anchor AS va ON dr.voting_anchor_id = va.id
    ),
    RankedRows AS (
        SELECT 
          dh.id AS drep_hash_id, 
          dh.raw, 
          dh.view,
          dh.has_script, 
          dd.id AS drep_distr_id, 
          COALESCE(dd.amount, null) AS voting_power,
          dd.epoch_no, 
          dd.active_until,
          lr.deposit, 
          lr.reg_id AS reg_drep_hash_id, 
          lr.voting_anchor_id AS reg_voting_anchor_id,  
          lr.metadata_url,
          lr.tx_id,
          sa.view AS stake_address,
          (lr.deposit IS NOT NULL AND lr.deposit < 0) AS retired,
          COALESCE(dd_data.vote_count, 0) AS delegation_vote_count,
          COALESCE(dd_data.live_stake, null) AS live_stake,
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
          stake_address AS sa ON dv.addr_id = sa.id
        LEFT JOIN 
          drepdelegationsummary dd_data ON dd_data.drep_hash_id = dh.id 
        WHERE 
          dh.view = $1
      )
      SELECT 
        r.drep_hash_id,
        r.view,
        r.delegation_vote_count,
        r.stake_address,
        r.voting_power,
        r.live_stake,
        r.epoch_no,
        r.retired,
        r.active_until,
        r.deposit,
        r.metadata_url,
        r.has_script,
        (da.epoch_no - COALESCE(
          (SELECT b.epoch_no 
           FROM voting_procedure vp 
           JOIN tx t ON t.id = vp.tx_id 
           JOIN block b ON b.id = t.block_id 
           WHERE vp.drep_voter = r.drep_hash_id
           ORDER BY b.epoch_no DESC 
           LIMIT 1),
          (SELECT b.epoch_no 
           FROM tx t 
           JOIN block b ON b.id = t.block_id 
           WHERE t.id = r.tx_id)
        )) <= da.drep_activity AS active
      FROM 
        RankedRows r
      CROSS JOIN
        DRepActivity da
      WHERE 
        RowNum = 1`;