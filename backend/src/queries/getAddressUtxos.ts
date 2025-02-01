export const getAddrUtxosQuery: string = `
SELECT 
    utxo_view.id,
    utxo_view.tx_id,
    utxo_view.index,
    utxo_view.address,
    utxo_view.address_has_script,
    SUBSTRING(CAST(utxo_view.payment_cred AS TEXT) FROM 3) AS payment_cred,
    utxo_view.stake_address_id,
    utxo_view.value,
    utxo_view.data_hash,
    utxo_view.inline_datum_id,
    utxo_view.reference_script_id,
    utxo_view.consumed_by_tx_id,
    SUBSTRING(CAST(tx.hash AS TEXT) FROM 3) AS hash,
    tx.block_id,
    tx.block_index,
    tx.out_sum,
    tx.fee,
    tx.deposit,
    tx.size,
    tx.invalid_before,
    tx.invalid_hereafter,
    tx.valid_contract,
    tx.script_size,
    tx.treasury_donation,
    ARRAY_AGG(
        CASE 
            WHEN ma.policy IS NOT NULL 
            THEN json_build_object(
                'unit', CONCAT(ENCODE(ma.policy, 'hex'), ENCODE(ma.name, 'hex')),
                'quantity', mto.quantity::text
            )
        END
    ) FILTER (WHERE ma.policy IS NOT NULL) as tokens
FROM utxo_view
INNER JOIN tx ON tx.id = utxo_view.tx_id
LEFT JOIN ma_tx_out mto ON mto.tx_out_id = utxo_view.id
LEFT JOIN multi_asset ma ON ma.id = mto.ident
WHERE utxo_view.address = $1
GROUP BY 
    utxo_view.id,
    utxo_view.tx_id,
    utxo_view.index,
    utxo_view.address,
    utxo_view.address_has_script,
    utxo_view.payment_cred,
    utxo_view.stake_address_id,
    utxo_view.value,
    utxo_view.data_hash,
    utxo_view.inline_datum_id,
    utxo_view.reference_script_id,
    utxo_view.consumed_by_tx_id,
    tx.hash,
    tx.block_id,
    tx.block_index,
    tx.out_sum,
    tx.fee,
    tx.deposit,
    tx.size,
    tx.invalid_before,
    tx.invalid_hereafter,
    tx.valid_contract,
    tx.script_size,
    tx.treasury_donation;
`;