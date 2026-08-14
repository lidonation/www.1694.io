'use client';
import React from 'react';
import ViewDRepTableBtn from '../molecules/ViewDRepTableButton';
import { useRouter } from 'next/navigation';

const PickADRep = () => {
  const router = useRouter();
  const navToDRepList = () => {
    router.push('/dreps/list');
  };

  return (
    <div className="z-10 py-10 shadow-lg">
      <div className="base_container flex grid-cols-2 flex-col-reverse gap-4 lg:grid">
        <div className="col-span-1 flex flex-col items-start justify-center gap-3 py-20">
          <div className="text-6xl font-bold">
            <p>Pick a DRep</p>
          </div>

          <p className="mb-2 text-lg md:text-xl">
            In order to participate in governance, wallet with staked Ada can
            register as a DRep, or delegate to any registered DRep.
          </p>

          <ViewDRepTableBtn handleClick={navToDRepList} />
        </div>

        <div className="col-span-1 flex flex-col items-center justify-center">
          <img
            src="/img/handscuppingcoin.png"
            alt="Pick a DRep img"
            width={'500px'}
          />
        </div>
      </div>
    </div>
  );
};

export default PickADRep;
