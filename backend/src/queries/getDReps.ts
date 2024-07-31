export const getAllDRepsQuery = (
    sanitizedSearch: string,
    nameFilteredDRepCondition: string,
    campaignStatusCondition: string,
    chainStatusCondition: string,
    orderByClause: string,
    itemsPerPage: number,
    offset: number
  ) => `
    WITH LatestEpoch AS (
        SELECT MAX(no) AS latest_epoch_no FROM epoch
    ),
    RankedRows AS (
        SELECT 
            dh.id AS drep_hash_id, 
            dh.raw, 
            dh.view, 
            dh.has_script,
            dd.id AS drep_distr_id, 
            dd.hash_id, 
            dd.amount, 
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
            (
              SELECT COUNT(DISTINCT dv.addr_id)
              FROM delegation_vote dv
              WHERE dv.drep_hash_id = dh.id
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
        WHERE
            dh.view ILIKE '%${sanitizedSearch}%' 
            ${nameFilteredDRepCondition}
            ${campaignStatusCondition}
            ${chainStatusCondition}
    )
    SELECT 
        drep_hash_id,
        view,
        delegation_vote_count,
        stake_address,
        amount,
        epoch_no,
        active_until,
        latest_epoch_no,
        deposit,
        url,
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
    chainStatusCondition: string
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
  `;
  