'use client';
import React from 'react';
import DrepInfoCard from '../atoms/DrepInfoCard';
import { urls } from '@/constants';
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import { useWallet } from '@/context/globalContext';
import { ModalType, useModals } from '@/context/globalContext';

const DrepInfoCardRow = () => {
  const {
    wallet: { stakeKey, isConnected },
  } = useWallet();
  const { openModal } = useModals();
  const currentDelegation = useGetAdaHolderCurrentDelegationQuery(stakeKey);

  return (
    <div className="grid grid-cols-1 items-center justify-center gap-4 text-zinc-100 sm:grid-cols-2 xl:grid-cols-4">
      <DrepInfoCard
        img={'/img/regImg.png'}
        title={'Registration'}
        action={{
          label: isConnected ? 'Register on-chain' : 'Connect Wallet',
          href: isConnected ? `${urls.govToolUrl}/register_drep` : '',
          target: isConnected ? '_blank' : undefined,
        }}
        clicked={isConnected ? undefined : () => openModal(ModalType.LOGIN)}
        description={
          'Like stake pools, DRep registers their intention on chain via DRep Certificates.'
        }
      />

      <DrepInfoCard
        img={'/img/delegImg.png'}
        title={'Delegation'}
        action={{
          label: isConnected ? 'Create your campaign' : 'Connect Wallet',
          href: isConnected ? '/dreps/workflow/profile/new' : '',
        }}
        clicked={isConnected ? undefined : () => openModal(ModalType.LOGIN)}
        description={
          'Just like staking a pool, Ada holders can delegate their stake to a DRep with Transaction.'
        }
      />

      <DrepInfoCard
        img={'/img/credImg.png'}
        title={'Voting Power'}
        action={{
          label: isConnected ? 'See Your Profile' : 'Connect Wallet',
          href: isConnected
            ? `/dreps/${currentDelegation?.currentDelegation?.drep_view}`
            : '',
        }}
        clicked={isConnected ? undefined : () => openModal(ModalType.LOGIN)}
        description={
          'DRep voting power will be the total value of staked Ada delegated to the DRep.'
        }
      />

      <DrepInfoCard
        img={'/img/statusImg.png'}
        title={'Status'}
        action={{
          label: isConnected ? 'Go To Your Timeline' : 'Connect Wallet',
          href: isConnected
            ? `/dreps/${currentDelegation?.currentDelegation?.drep_view}`
            : '',
        }}
        description={
          'Registered DReps will need to vote regularly to still be considered active.'
        }
        clicked={isConnected ? undefined : () => openModal(ModalType.LOGIN)}
      />
    </div>
  );
};

export default DrepInfoCardRow;
