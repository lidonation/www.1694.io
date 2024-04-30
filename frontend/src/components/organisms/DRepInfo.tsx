import React from 'react';
import DrepInfoCardRow from '../molecules/DrepInfoCardRow';
import BecomeADrepCard from '../molecules/BecomeADrepCard';

const DRepInfo = () => {
  return (
    <div className="mt-5 w-full overflow-hidden rounded-t-3xl bg-opacity-20 bg-[url(/img/drepsBg.png)] bg-cover bg-center shadow-lg">
      {/* Inner div for img background */}
      <div className="drep_bg flex h-full w-full flex-col gap-10">
        <div className="container py-16">
          <div className="flex flex-col gap-16">
            <div className="pt-14 text-7xl font-bold text-violet-50">
              <p className="mb-2">Delegated Representatives</p>
              <p>(DReps)</p>
            </div>

            <DrepInfoCardRow />

            <div className="flex items-center justify-center">
              <hr className="w-[900px] border text-violet-50" />
            </div>

            <BecomeADrepCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DRepInfo;
