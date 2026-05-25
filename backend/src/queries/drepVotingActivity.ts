export const getDrepVotingActivityQuery = `
    WITH vote_rationale AS (
        SELECT va.url, vp.drep_voter, vp.gov_action_proposal_id
        FROM voting_anchor va 
        JOIN voting_procedure vp ON va.id = vp.voting_anchor_id
    )    
    SELECT  
        dh.view, 
        SUBSTRING(CAST(prop_creation_tx.hash AS TEXT) FROM 3) AS gov_action_proposal_id,
        gp.index AS gov_action_proposal_index,
        prop_creation_bk.time AS prop_inception,
        gp.type AS gov_action_type,
        gp.description,
        gp.voting_anchor_id,
        vp.vote::text,
        ocvd.json AS metadata,
        bk.time AS time_voted,
        prop_creation_bk.epoch_no AS proposal_epoch,
        bk.epoch_no AS voting_epoch,
        gp.ratified_epoch,
        gp.enacted_epoch,
        gp.dropped_epoch,
        gp.expiration AS expiration_epoch,
        va.url,
        vr.url AS vote_rationale
    FROM 
        drep_hash dh
    JOIN 
        voting_procedure vp ON dh.id = vp.drep_voter
    JOIN 
        gov_action_proposal gp ON vp.gov_action_proposal_id = gp.id
    JOIN 
        tx ON vp.tx_id = tx.id
    JOIN 
        tx prop_creation_tx ON gp.tx_id = prop_creation_tx.id
    JOIN 
        block bk ON tx.block_id = bk.id 
    JOIN 
        block prop_creation_bk ON prop_creation_tx.block_id = prop_creation_bk.id
    LEFT JOIN
        voting_anchor va ON gp.voting_anchor_id = va.id
    LEFT JOIN
        off_chain_vote_data ocvd ON ocvd.voting_anchor_id = va.id
    LEFT JOIN 
        vote_rationale vr ON dh.id = vr.drep_voter AND vr.gov_action_proposal_id = vp.gov_action_proposal_id
    WHERE
        dh.view = $1
        AND bk.time::DATE BETWEEN $2::DATE AND $3::DATE
    ORDER BY 
        bk.epoch_no`;

export const getDrepVotingActivityInTimestampQuery = `
    SELECT  
        dh.view, 
        SUBSTRING(CAST(prop_creation_tx.hash AS TEXT) FROM 3) AS gov_action_proposal_id,
        prop_creation_bk.time AS prop_inception,
        gp.type,
        gp.description,
        gp.voting_anchor_id,
        vp.vote::text,
        ocvd.json AS metadata,
        bk.time AS time_voted,
        prop_creation_bk.epoch_no AS proposal_epoch,
        bk.epoch_no AS voting_epoch,
        va.url
    FROM 
        drep_hash AS dh
    JOIN 
        voting_procedure AS vp ON dh.id = vp.drep_voter
    LEFT JOIN 
        gov_action_proposal AS gp ON vp.gov_action_proposal_id = gp.id
    LEFT JOIN 
        tx AS tx ON vp.tx_id = tx.id
    LEFT JOIN 
        tx AS prop_creation_tx ON gp.tx_id = prop_creation_tx.id
    LEFT JOIN 
        block AS bk ON tx.block_id = bk.id 
    LEFT JOIN 
        block AS prop_creation_bk ON prop_creation_tx.block_id = prop_creation_bk.id
    LEFT JOIN
        voting_anchor as va ON gp.voting_anchor_id = va.id
    LEFT JOIN
        off_chain_vote_data AS ocvd ON ocvd.voting_anchor_id = va.id
    WHERE
        dh.view = $1
        --$2 earliest range limit, $3 latest range limit
        AND bk.time BETWEEN $2::timestamptz AND $3::timestamptz
    ORDER BY 
        bk.epoch_no`;
