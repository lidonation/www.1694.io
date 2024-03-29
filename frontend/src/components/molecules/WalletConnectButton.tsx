import React from 'react'
import Button from '../atoms/Button'

const WalletConnectButton = ({handleClick}) => {
  return (
    <Button bgColor='#0033AD' handleClick={handleClick} borderRadius='10px'>
     <p style={{fontFamily:'Poppins', textTransform:'capitalize'}}>Connect Wallet</p>
    </Button>
  )
}

export default WalletConnectButton