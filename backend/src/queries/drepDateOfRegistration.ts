export const getDrepDateOfRegistrationQuery = `
    WITH oldest_registration AS (
        SELECT 
            dh.id AS drep_hash_id,
            dr.tx_id
        FROM 
            drep_hash AS dh
        INNER JOIN 
            drep_registration AS dr ON dh.id = dr.drep_hash_id
        WHERE 
            dh.view = $1
            AND dr.deposit = 500000000 
        ORDER BY 
            dr.tx_id ASC
        LIMIT 1
    )
    SELECT 
        or_data.drep_hash_id,
        SUBSTRING(CAST(reg_tx.hash AS TEXT) FROM 3) AS reg_tx_hash,
        reg_tx_bk.time AS date_of_registration,
        reg_tx_bk.epoch_no AS epoch_of_registration
    FROM 
        oldest_registration AS or_data
    INNER JOIN 
        tx AS reg_tx ON or_data.tx_id = reg_tx.id 
    INNER JOIN 
        block AS reg_tx_bk ON reg_tx.block_id = reg_tx_bk.id`;
