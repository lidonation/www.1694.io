export const getDrepDelegatorsWithVotingPowerQuery: string = `
      WITH latest_delegations AS (
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
      )
      SELECT 
        sa.view AS stake_address,
        b.epoch_no AS delegation_epoch,
        COALESCE(SUM(uv.value), 0) AS voting_power
      FROM 
        drep_hash AS dh
      JOIN 
        delegation_vote AS dv ON dh.id = dv.drep_hash_id
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
      WHERE 
        dh.view = $1
      GROUP BY 
        sa.view, b.epoch_no
      ORDER BY 
        voting_power DESC
      `;
