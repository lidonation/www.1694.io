import React from 'react';
import AcknowledgmentSummary from './AcknowledgmentSummary';

const CIPAcknowledgments = () => {
  return (
    <div className="bg-gradient-to-b from-[#E9EFFF] to-[#FFFFFF] text-black">
      <div className="container flex w-full flex-col gap-10 py-10">
        <div className="text-start">
          <p className="text-5xl font-bold text-zinc-800">Acknowledgements</p>
        </div>
        <div className="grid grid-cols-2 gap-20">
          <div className="col-span-1">
            <AcknowledgmentSummary />
          </div>
          <div className="col-span-1 flex flex-col items-center justify-between">
            <div>
              <img src="/doublecoin-top.png" alt="" />
            </div>
            <div>
              <img src="/doublecoin-bottom.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CIPAcknowledgments;
