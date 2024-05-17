import React from 'react';
import DrepInfoCard from '../atoms/DrepInfoCard';

const DrepInfoCardRow = () => {
  return (
    <div className="flex items-center justify-center gap-4 text-zinc-100">
        <DrepInfoCard
            img={'/img/regImg.png'}
            title={'Registration'}
            description={
                'Like stake pools, DRep registers their intention on chain via DRep Certificates.'
            }
        />

        <DrepInfoCard
            img={'/img/delegImg.png'}
            title={'Delegation'}
            description={
                'Just like staking a pool, Ada holders can delegate their stake to a DRep with Transaction.'
            }
        />

      <DrepInfoCard
        img={'/img/credImg.png'}
        title={'Voting Power'}
        description={
          'DRep voting power will be the total value of staked Ada delegated to the DRep.'
        }
      />

      <DrepInfoCard
        img={'/img/statusImg.png'}
        title={'Status'}
        description={
          'Registered DReps will need to vote regularly to still be considered active.'
        }
      />
    </div>
  );
};

export default DrepInfoCardRow;
