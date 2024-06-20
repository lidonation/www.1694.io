import React, { useState } from 'react';
import SearchBar from '../atoms/SearchBar';
import DrepTimelineCard from '../atoms/DrepTimelineCard';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
const ProfileClaimedChip = () => {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-yellow-500 px-3 py-2 ">
      <div className="flex flex-row items-center justify-between">
        <div className="flex max-w-fit items-center gap-2 rounded-full bg-black px-3 py-1 text-sm text-white">
          <img src="/user-circle-filled-yellow.svg" alt="" />
          <p>Profile Claimed</p>
        </div>
        <p>{new Date().toDateString()}</p>
      </div>
      <p className="overflow-x-scroll text-nowrap">
        Profile claimed by: 6LKJSA876SDMA571IQAKLASPPOIWLKJKLSA12
      </p>
    </div>
  );
};
const DrepTimeline = () => {
  const [searchText, setSearchText] = useState('');
  return (
    <div>
      <div className="flex w-full flex-row items-center justify-between">
        <p className="text-3xl font-bold">Timeline</p>
        <SearchBar searchText={searchText} setSearchText={setSearchText} />
      </div>
      <div className="flex items-center gap-3">
        <img src="/rotate-clockwise.svg" alt="Load" />
        <p className="text-2xl font-bold">Epoch 232</p>
      </div>
      <div className='flex flex-row items-center justify-center gap-2 text-gray-500'>
        <img src="/loader.svg" alt="" />
        <p>Registered, Epoch 232</p>
      </div>
      <ProfileClaimedChip />
      <DrepTimelineWaterfall />
    </div>
  );
};

export default DrepTimeline;