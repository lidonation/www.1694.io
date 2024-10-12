export const getDrepDateOfRegistrationQuery = `
    SELECT 
        dh.id AS drep_hash_id, 
        SUBSTRING(CAST(reg_tx.hash AS TEXT) FROM 3) AS reg_tx_hash,
        reg_tx_bk.time AS date_of_registration,
        reg_tx_bk.epoch_no AS epoch_of_registration
    FROM 
        drep_hash AS dh
    LEFT JOIN 
        drep_registration AS dr ON dh.id = dr.drep_hash_id
    LEFT JOIN 
        tx AS reg_tx ON dr.tx_id = reg_tx.id 
    LEFT JOIN 
        block AS reg_tx_bk ON reg_tx.block_id = reg_tx_bk.id 
    WHERE 
        dh.view = $1`