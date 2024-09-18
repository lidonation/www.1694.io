import React, { useEffect, useState } from 'react';
import DrepInfoCard from '../atoms/DrepInfoCard';
import { urls } from '@/constants';
import { useDRepContext } from '@/context/drepContext';
import { useCardano } from '@/context/walletContext';

const DrepInfoCardRow = () => {
  const {isLoggedIn, setIsWalletListModalOpen} = useDRepContext()
  const {isEnabled} = useCardano()
  const [disabled, setDisabled] = useState(false)
  const [connectWalletLabel, setConnectWalletLabel] = useState("Connect Wallet")

  useEffect(()=>{
    if(isEnabled && !isLoggedIn){
      setConnectWalletLabel("Wallet Connected")
      setDisabled(true)
    }else if(isEnabled && isLoggedIn){
      setDisabled(false)
    }else{
      setDisabled(false)
      setConnectWalletLabel("Connect Wallet")
    }
  }, [isEnabled, isLoggedIn])
  
  return (
    <div className="grid grid-cols-1 items-center justify-center gap-4 text-zinc-100 sm:grid-cols-2 xl:grid-cols-4">
      <DrepInfoCard
        img={'/img/regImg.png'}
        title={'Registration'}
        action={{
          label: isLoggedIn ? 'Register on-chain' : connectWalletLabel,
          href: isLoggedIn ? `${urls.govToolUrl}/register_drep` : '',
          target: isLoggedIn ? '_blank' : undefined,
        }}
        clicked={isLoggedIn ? undefined : ()=>{setIsWalletListModalOpen(true)}}
        disabled = {disabled}
        description={
          'Like stake pools, DRep registers their intention on chain via DRep Certificates.'
        }
      />

      <DrepInfoCard
        img={'/img/delegImg.png'}
        title={'Delegation'}
        action={{
          label: isLoggedIn ? 'Create your campaign' : connectWalletLabel,
          href: isLoggedIn ? '/dreps/workflow/profile/new' : '',
        }}
        clicked={isLoggedIn ? undefined : ()=>{setIsWalletListModalOpen(true)}}
        disabled = {disabled}
        description={
          'Just like staking a pool, Ada holders can delegate their stake to a DRep with Transaction.'
        }
      />

      <DrepInfoCard
        img={'/img/credImg.png'}
        title={'Voting Power'}
        action={{
          label: isLoggedIn ? 'See Your Profile' : connectWalletLabel,
          href: isLoggedIn ?'#' : '',
        }}
        clicked={isLoggedIn ? undefined : ()=>{setIsWalletListModalOpen(true)}}
        disabled = {disabled}
        description={
          'DRep voting power will be the total value of staked Ada delegated to the DRep.'
        }
      />

      <DrepInfoCard
        img={'/img/statusImg.png'}
        title={'Status'}
        action={{
          label: isLoggedIn ? 'Go To Your Timeline' : connectWalletLabel,
          href: isLoggedIn ?'#' : '',
        }}
        description={
          'Registered DReps will need to vote regularly to still be considered active.'
        }
        disabled = {disabled}
        clicked={isLoggedIn ? undefined : ()=>{setIsWalletListModalOpen(true)}}
      />
    </div>
  );
};

export default DrepInfoCardRow;
