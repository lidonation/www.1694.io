import Link from 'next/link';
import React from 'react';

const VoteStatusChip = () => {
  return (
    <div className="flex flex-row items-center justify-between">
        <div className="flex w-fit flex-row items-center gap-2 rounded-full bg-purple-500 px-3 py-1 text-sm">
          <img src="/file-check.svg" alt="" />
          <p>Voted</p>
        </div>
        <p>{new Date().toDateString()}</p>
      </div>
      
  )
};
const DrepTimelineCard = () => {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-lg max-w-md">
      <VoteStatusChip/>
      <hr />
      <div className='flex flex-col gap-1 max-w-52'>
        <p className="text-lg font-bold">For project X</p>
        <p className="text-sm">Governance Action ID:</p>
        <div className="flex items-center overflow-x-scroll text-nowrap rounded-full border px-3 py-1 text-sm">
          <p>0xasdasdasd123123123asdasdasd123123123asdasdasd123123123</p>
        </div>
      </div>
      <Link href={'#'} className="text-blue-800">
        View Governance Action
      </Link>
    </div>
  );
};

export default DrepTimelineCard;