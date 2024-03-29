'use client'
import { useCardano } from '@/context/walletContext'
import React, { useEffect, useState } from 'react'
import WalletConnectButton from '@/components/molecules/WalletConnectButton'
import { ChooseWalletModal } from '@/components/organisms'
import { WalletInfoCard } from '@/components/molecules'
const page = () => {
  const {isEnabled}=useCardano()
  const [isModalOpen, setisModalOpen]=useState(false)
  
  const connectWallet=()=>{
    try{
      setisModalOpen(true)
    }catch(err){
      console.log(err)
    }
  }
  return (
    <div>
     {!isEnabled?<WalletConnectButton handleClick={connectWallet} />:<WalletInfoCard />}
     {isModalOpen&&<ChooseWalletModal handleClose={()=>setisModalOpen(false)}/>}
    </div>
  )
}

export default page