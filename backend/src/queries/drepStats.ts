export const getDRepDelegatorsCountQuery: string = `
  SELECT
      COUNT(DISTINCT dv.addr_id) AS delegators_count
  FROM
      delegation_vote AS dv
  JOIN
      drep_hash AS dh ON dv.drep_hash_id = dh.id
  WHERE
      dh.view = $1
`;

export const getDRepVotesCountQuery: string = `
  SELECT 
      COUNT(vp.id) AS vote_count
  FROM 
      drep_hash AS dh
  JOIN 
      voting_procedure AS vp ON dh.id = vp.drep_voter
  WHERE 
      dh.view = $1
`;

export const getDRepVotingPowerQuery: string = `
  SELECT
     dd.amount AS voting_power
   FROM
     drep_hash AS dh
   JOIN
     drep_distr AS dd ON dd.hash_id = dh.id
   WHERE
     dh.view = $1
   ORDER BY
     dd.epoch_no DESC
   LIMIT 1
`;
