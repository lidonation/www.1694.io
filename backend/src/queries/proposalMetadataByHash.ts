export const proposalMetadataByHash = `WITH Proposals AS (
SELECT ga.voting_anchor_id as vid, SUBSTRING(CAST(tx.hash AS TEXT), 3) as tx_hash
FROM "gov_action_proposal" ga
JOIN tx on ga.tx_id = tx.id
)
select p.tx_hash, va.url
FROM Proposals p
JOIN voting_anchor va on p.vid = va.id
WHERE p.tx_hash = $1
`;