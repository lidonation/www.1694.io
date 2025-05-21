export const getDrepDelegatorsWithVotingPowerQuery = (
  itemsPerPage: number,
  offset?: number,
  orderByClause?: string,
) => `
    WITH latest_delegation_votes AS (
        SELECT dv.addr_id,
               MAX(dv.tx_id) AS latest_tx_id
        FROM delegation_vote dv
        GROUP BY dv.addr_id
    ),
    current_delegators AS (
        SELECT sa.id,
               sa.view AS stake_address,
               b.epoch_no AS delegation_epoch
        FROM latest_delegation_votes ldv
        JOIN delegation_vote dv ON ldv.addr_id = dv.addr_id AND ldv.latest_tx_id = dv.tx_id
        JOIN stake_address sa ON dv.addr_id = sa.id
        JOIN drep_hash dh ON dv.drep_hash_id = dh.id
        JOIN tx ON dv.tx_id = tx.id
        JOIN block b ON tx.block_id = b.id
        WHERE dh.view = $1
    )
    SELECT 
        cd.stake_address,
        cd.delegation_epoch,
        COALESCE((
            SELECT SUM(txo.value)
            FROM tx_out txo
            WHERE txo.stake_address_id = cd.id
            AND NOT EXISTS (
                SELECT 1
                FROM tx_in txi
                WHERE txi.tx_out_id = txo.tx_id
                AND txi.tx_out_index = txo.index
            )
        ), 0) AS voting_power
    FROM current_delegators cd
    ${orderByClause}
    LIMIT ${itemsPerPage}
    OFFSET ${offset};
`;

export const getDrepDelegatorsCountQuery = () => `
    WITH latest_delegation_votes AS (
        SELECT dv.addr_id,
               MAX(dv.tx_id) AS latest_tx_id
        FROM delegation_vote dv
        GROUP BY dv.addr_id
    )
    SELECT COUNT(*) AS total
    FROM latest_delegation_votes ldv
    JOIN delegation_vote dv ON ldv.addr_id = dv.addr_id AND ldv.latest_tx_id = dv.tx_id
    JOIN drep_hash dh ON dv.drep_hash_id = dh.id
    WHERE dh.view = $1
`;
