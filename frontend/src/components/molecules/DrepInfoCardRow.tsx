import React from 'react';
import DrepInfoCard from '../atoms/DrepInfoCard';

const DrepInfoCardRow = () => {
  return (
    <div className="flex items-center justify-center gap-4 text-zinc-100">
        <DrepInfoCard
            img={'/img/regImg.png'}
            title={'Registration'}
            description={
                'Like stake pools, DRep registers their intention on chain.'
            }
        />

        <DrepInfoCard
            img={'/img/delegImg.png'}
            title={'Delegation'}
            description={
                'DRep delegation will mimic the existing stake delegation mechanisms (via on-chain certificates). '
            }
        />

      <DrepInfoCard
        img={'/img/credImg.png'}
        title={'Credentials'}
        description={
          'Existing stake credentials will be able to delegate their stake to DReps.'
        }
      />

      <DrepInfoCard
        img={'/img/statusImg.png'}
        title={'Status'}
        description={
          'Additionally, registered DReps will need to vote regularly to still be considered active.'
        }
      />
    </div>
  );
};

export default DrepInfoCardRow;
