export const drepRegistrationQuery = `
  SELECT
    dh.view,
    dr.deposit,
    dr.tx_id,
    ROW_NUMBER() OVER (PARTITION BY drep_hash_id ORDER BY tx_id DESC) AS rn,
    (
      SELECT
        dd.amount AS voting_power
      FROM
        drep_distr AS dd
      WHERE
        dd.hash_id = dh.id
      ORDER BY
        dd.epoch_no DESC
      LIMIT 1
    ) AS voting_power
  FROM
    drep_hash dh
  JOIN
    drep_registration dr ON dh.id = dr.drep_hash_id
  WHERE
    dh.view = $1 OR encode(dh.raw, 'hex') = $1
  LIMIT 1
`;