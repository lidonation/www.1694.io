export const getDRepVotedGovActionsQuery = (
  itemsPerPage: number,
  offset?: number,
) => `
WITH Vote_rationale AS (
    SELECT va.url, vp.drep_voter, vp.gov_action_proposal_id
    FROM voting_anchor va 
    JOIN voting_procedure vp on va.id = vp.voting_anchor_id
), 
GovActions AS (
    SELECT DISTINCT ON (vp.gov_action_proposal_id)
        SUBSTRING(CAST(gat.hash AS TEXT) FROM 3) AS gov_action_proposal_id,
        gap.index AS gov_action_proposal_index,
        gap.type,
        gap.description,
        vp.vote::text,
        va.url,
        off_chain_vote_data.json AS metadata,
        off_chain_vote_gov_action_data.title,
        off_chain_vote_gov_action_data.rationale,
        b.epoch_no AS voting_epoch,
        b.time AS time_voted,
        encode(vt.hash, 'hex') AS vote_tx_hash,
        dh.view,
        vr.url as vote_rationale,
        gap.ratified_epoch,
        gap.enacted_epoch,
        gap.dropped_epoch,
        gap.expiration as expiration_epoch
    FROM 
        voting_procedure vp
    JOIN 
        gov_action_proposal gap ON gap.id = vp.gov_action_proposal_id
    JOIN 
        drep_hash dh ON dh.id = vp.drep_voter
    LEFT JOIN 
        voting_anchor va ON va.id = gap.voting_anchor_id
    LEFT JOIN
        off_chain_vote_data AS off_chain_vote_data ON off_chain_vote_data.voting_anchor_id = va.id
    LEFT JOIN 
        off_chain_vote_gov_action_data ON off_chain_vote_gov_action_data.off_chain_vote_data_id = off_chain_vote_data.id
    JOIN 
        tx gat ON gat.id = gap.tx_id
    JOIN 
        tx vt ON vt.id = vp.tx_id
    JOIN 
        block b ON b.id = vt.block_id
    LEFT JOIN 
        Vote_rationale vr ON vr.drep_voter = vp.drep_voter AND vr.gov_action_proposal_id = vp.gov_action_proposal_id
    WHERE 
        dh.view = $1
    ORDER BY
        vp.gov_action_proposal_id,
        b.time DESC
)
SELECT * FROM GovActions
ORDER BY time_voted DESC
LIMIT ${itemsPerPage}
OFFSET ${offset || 0}
`;

export const getDRepVotedGovActionsCountQuery = `
SELECT COUNT(DISTINCT vp.gov_action_proposal_id)::integer AS total
FROM 
    voting_procedure vp
JOIN 
    gov_action_proposal gap ON gap.id = vp.gov_action_proposal_id
JOIN 
    drep_hash dh ON dh.id = vp.drep_voter
WHERE 
    dh.view = $1
`;
