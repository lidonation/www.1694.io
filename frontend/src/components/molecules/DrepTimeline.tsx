import React, { useState } from 'react';
import SearchBar from '../atoms/SearchBar';
import DrepTimelineCard from '../atoms/DrepTimelineCard';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import DrepTabGroup from '../atoms/DrepTabGroup';
const ProfileClaimedChip = ({ claimedAddress }) => {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-yellow-500 px-3 py-2 ">
      <div className="flex flex-row items-center justify-between">
        <div className="flex max-w-fit items-center gap-2 rounded-full bg-black px-3 py-1 text-sm text-white">
          <img src="/svgs/user-circle-filled-yellow.svg" alt="" />
          <p>Profile Claimed</p>
        </div>
        <p>{new Date().toDateString()}</p>
      </div>
      <p className="overflow-x-scroll text-nowrap">
        Profile claimed by: {claimedAddress}
      </p>
    </div>
  );
};
const DrepTimeline = ({
  drepId,
  latestEpoch,
  cexplorerDetails,
  activity,
}: {
  drepId: string;
  latestEpoch: number;
  cexplorerDetails: any;
  activity: any[];
}) => {
  const [searchText, setSearchText] = useState('');
  return (
    <div className="flex h-full w-full flex-col gap-5 bg-white px-5 py-3">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="w-full text-2xl font-bold sm:w-auto lg:text-3xl">
          Timeline
        </p>
        <SearchBar searchText={searchText} setSearchText={setSearchText} handleSort={() => {}} />
      </div>
      <div className="flex items-center gap-3">
        <img src="/svgs/rotate-clockwise.svg" alt="Load" />
        <p className="text-2xl font-bold">Epoch {latestEpoch}</p>
      </div>
      
      {
        drepId &&
        <ProfileClaimedChip claimedAddress={drepId} />
      }
     
      <DrepTimelineWaterfall activity={activity} epochOfRegistration={cexplorerDetails?.epoch_of_registration}/>
    </div>
  );
};

export default DrepTimeline;
