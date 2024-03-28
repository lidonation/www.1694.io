'use client'
import { useCardano } from '@/context/walletContext'
import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import './index.css'
const page = () => {
  const {isEnabled, enable,walletState:{changeAddress, usedAddress}, disconnectWallet, isEnabling, dRepIDBech32, delegatedDRepID, isMainnet, error}=useCardano()
  const [installedWallets, setinstalledWallets]=useState([])
  const [walletEnabled, setWalletEnabled]=useState(null)
  useEffect(()=>{
    console.log(isEnabling)
    if(!isEnabled){
      setinstalledWallets(Object.values(window?.cardano))
    }
    
  },[])
  const connectWallet=async(walletName:string)=>{
    try{
      if(isEnabled) await disconnectWallet()
      console.log(walletName)
      const res=await enable(walletName)
    setWalletEnabled(walletName)
    }catch(err){
      console.log(err)
    }
  }
  return (
    <div>
      Currently connected to {walletEnabled} on {isMainnet?'mainnet':'testnet'}
      <br/>
      List of wallets:
      <br/>
      
      <div className='flexed'>
      {installedWallets.length>0 ? installedWallets.map(wallet=>(
        <div key={wallet.name} className='flexed-row'>
        <img src={wallet.icon} alt='Wallet Icon' width={"30px"}/>
        <Button disabled={isEnabling} style={{marginLeft:'4px', cursor:'pointer'}}  onClick={()=>connectWallet(wallet.name)}>{wallet.name}</Button>
        </div>
      )):<div>No wallets found! Please install a wallet, or refresh to detect one!</div>}
      Your Address: {changeAddress&& changeAddress}
      <br/>
      Your used Addresses: { usedAddress&& usedAddress}
      <br/>
      Your DrepId: {dRepIDBech32 && dRepIDBech32}
      <br/>
      Drep Id delegated to: {delegatedDRepID && delegatedDRepID}
      <br/>
      {error && error}
      </div>
    </div>
  )
}

export default page