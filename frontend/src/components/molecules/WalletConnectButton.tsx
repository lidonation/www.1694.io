import React from 'react'
import Button from '../atoms/Button'
import { useDRepContext } from '@/context/drepContext'

const WalletConnectButton = () => {
  const {setIsWalletListModalOpen}=useDRepContext()
  return (
    <Button handleClick={()=>setIsWalletListModalOpen(true)}>
     <p>Connect Wallet</p>
    </Button>
  )
}

export default WalletConnectButton