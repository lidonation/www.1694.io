import React, { useState } from 'react';
import SearchBar from '../atoms/SearchBar';
import DrepTimelineCard from '../atoms/DrepVoteTimelineCard';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import DrepTabGroup from '../atoms/DrepTabGroup';
import Link from 'next/link';
import Button from '../atoms/Button';
import { useCardano } from '@/context/walletContext';
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
  cexplorerDetails,
  activity,
}: {
  drepId: string;
  latestEpoch: number;
  cexplorerDetails: any;
  activity: any[];
}) => {
  const [searchText, setSearchText] = useState('');
  const { dRepIDBech32 } = useCardano();
  console.log(cexplorerDetails , dRepIDBech32)
  return (
    <div className="flex h-full w-full flex-col gap-5 bg-white px-5 py-3">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="w-full text-2xl font-bold sm:w-auto lg:text-3xl">
          Timeline
        </p>
        <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          handleSort={() => {}}
          handleFilter={() => {}}
        />
      </div>
      {cexplorerDetails?.view == dRepIDBech32 && (
        <Button className="flex w-fit items-center">
          <Link href={`/dreps/workflow/notes/new`}>Add a note</Link>
        </Button>
      )}

      {drepId && <ProfileClaimedChip claimedAddress={drepId} />}

      <DrepTimelineWaterfall activity={activity} />
    </div>
  );
};

export default DrepTimeline;
