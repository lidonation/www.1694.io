export const getDRepParticipationQuery = `
WITH 
  drep_id AS (
    SELECT id
    FROM drep_hash
    WHERE view = $1
    LIMIT 1
  ),
  
  participation AS (
    SELECT COUNT(DISTINCT gov_action_proposal_id)::integer as participation_count
    FROM voting_procedure
    WHERE drep_voter = (SELECT id FROM drep_id)
    AND voter_role = 'DRep'
  ),
  
  total_proposals AS (
    SELECT COUNT(DISTINCT id)::integer as total_count
    FROM gov_action_proposal
  )
  
SELECT 
  dp.participation_count::integer AS participation,
  tp.total_count::integer AS total_actions,
  (tp.total_count - dp.participation_count)::integer AS non_participation
FROM 
  participation dp,
  total_proposals tp
`;
