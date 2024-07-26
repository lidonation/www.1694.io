'use client';
import React, { useCallback, useEffect, useState } from 'react';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import Link from 'next/link';
import useInfiniteScroll from 'react-easy-infinite-scroll-hook';
import _ from 'lodash';
import Button from '../atoms/Button';
import { useCardano } from '@/context/walletContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { CircularProgress } from '@mui/material';
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
  claimingDrepId,
  drepId,
  cexplorerDetails,
  activity,
}: {
  claimingDrepId: number;
  drepId: string;
  cexplorerDetails: any;
  activity: any[];
}) => {
  const [searchText, setSearchText] = useState('');
  const [allActivities, setAllActivities] = useState(activity || []);
  const [hasMoreBelow, setHasMoreBelow] = useState(true);
  const [hasMoreAbove, setHasMoreAbove] = useState(true);
  const [isPreviousData, setIsPreviousData] = useState(false);
  const [lastBatch, setlastBatch] = useState([]);
  const [prevScrollTop, setPrevScrollTop] = useState(0);
 const [scrollDirection, setScrollDirection] = useState(null);
  const router = useRouter();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [endTime, setEndTime] = useState(() => Date.now());
  const [startTime, setStartTime] = useState(
    () => endTime - 5 * 24 * 60 * 60 * 1000,
  ); // 5 days for now
  const searchParams = useSearchParams();
  const { dRepIDBech32 } = useCardano();
  const updateURL = (startTime?: number, endTime?: number) => {
    const params = new URLSearchParams(searchParams);
    if (startTime) {
      params.set('startTime', new Date(startTime).toISOString());
    }
    if (endTime) {
      params.set('endTime', new Date(endTime).toISOString());
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const ref = useInfiniteScroll({
    next: (scrollDirection) => fetchMoreData(),
    rowCount: allActivities.length,
    hasMore: { down: hasMoreBelow, up: hasMoreAbove },
    onScroll: (event) => {
      handleScroll(event);
      updateDominantActivity();
    },
    initialScroll: { top: 0 },
  });
  useEffect(() => {
    let startTime, endTime;
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      if (params.get('startTime')) {
        setStartTime(new Date(params.get('startTime')).getTime());
        startTime = new Date(params.get('startTime')).getTime();
      }
      if (params.get('endTime')) {
        setEndTime(new Date(params.get('endTime')).getTime());
        endTime = new Date(params.get('endTime')).getTime();
      }
    }
    const initialFetch = async (startTime, endTime) => {
      let newStartTime = startTime;
      let newEndTime = endTime;
      let drep;
      String(drepId).includes('drep')
        ? (drep = await getSingleDRepViaVoterId(
            drepId as string,
            null,
            newEndTime,
            newStartTime,
          ))
        : (drep = await getSingleDRep(
            Number(drepId),
            null,
            newEndTime,
            newStartTime,
          ));

      if (drep.activity && drep.activity.length > 0) {
        setAllActivities((prevActivities) => {
          const uniqueActivitiesMap = new Map(
            [...drep.activity].map((activity) => [
              activity.timestamp,
              activity,
            ]),
          );
          return Array.from(uniqueActivitiesMap.values()).sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        });
        setHasMoreBelow(drep.activity.length > 0);
        // Update time states
        setEndTime(newEndTime);
        setStartTime(newStartTime);
      }
    };
    if (drepId) initialFetch(startTime, endTime);
  }, [drepId]);
  const updateDominantActivity = () => {
    updateURL(startTime, endTime);
  };
  const handleScroll = (event) => {
    const currentScrollTop = event.scrollTop;
    const isScrollingDown = currentScrollTop > prevScrollTop;
    setScrollDirection(isScrollingDown ? 'down' : 'up');
    setPrevScrollTop(currentScrollTop);
  };
  const fetchMoreData = useCallback(async () => {
    if (allActivities && allActivities.length > 0 && !isPreviousData) {
      setIsLoadingMore(true);
      let newStartTime;
      let newEndTime;
      if (scrollDirection === 'up') {
        const newestActivityTimestamp = Math.max(
          ...allActivities.map((a) => new Date(a.timestamp).getTime()),
        );
        newStartTime = newestActivityTimestamp;
        newEndTime = newStartTime + 5 * 24 * 60 * 60 * 1000; // 5 days earlier
      } else {
        const oldestActivityTimestamp = Math.min(
          ...allActivities.map((a) => new Date(a.timestamp).getTime()),
        );
        newEndTime = oldestActivityTimestamp;
        newStartTime = newEndTime - 5 * 24 * 60 * 60 * 1000; // Fetch 5 more days
      }

      let drep;
      String(drepId).includes('drep')
        ? (drep = await getSingleDRepViaVoterId(
            drepId as string,
            null,
            newEndTime,
            newStartTime,
          ))
        : (drep = await getSingleDRep(
            Number(drepId),
            null,
            newEndTime,
            newStartTime,
          ));
      if (drep.activity && drep.activity.length > 0) {
        setlastBatch(drep.activity);
        setAllActivities((prevActivities) => {
          const uniqueActivitiesMap = new Map(
            [...prevActivities, ...drep.activity].map((activity) => [
              activity.timestamp,
              activity,
            ]),
          );
          return Array.from(uniqueActivitiesMap.values()).sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        });
        if (scrollDirection === 'up') {
          setHasMoreAbove(drep.activity.length > 1);
        }
        if (scrollDirection === 'down') {
          setHasMoreBelow(drep.activity.length > 1);
        }
        //check if data is simlar to preiovus

        // Update time states
        setEndTime(newEndTime);
        setIsPreviousData(_.isEqual(drep.activity, lastBatch));
        setStartTime(newStartTime);
        setIsLoadingMore(false);
      } else {
        setHasMoreBelow(false);
        setIsLoadingMore(false);
        setHasMoreAbove(false);
      }
    }
  }, [drepId, allActivities, scrollDirection]);

  return (
    <div className="flex h-full w-full flex-col gap-5 bg-white px-5 py-3">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="w-full text-2xl font-bold sm:w-auto lg:text-3xl">
          Timeline
        </p>
        {/* <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          handleSort={() => {}}
          handleFilter={() => {}}
        /> */}
      </div>
      {cexplorerDetails?.view == dRepIDBech32 && (
        <Button className="flex w-fit items-center">
          <Link href={`/dreps/workflow/notes/new`}>Add a note</Link>
        </Button>
      )}
      {claimingDrepId && <ProfileClaimedChip claimedAddress={claimingDrepId} />}
      <div
        id="drep-timeline"
        ref={ref as any}
        style={{
          height: 1000,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoadingMore && scrollDirection === 'up' && (
          <div className="flex items-center justify-center">
            <CircularProgress size={40} />
          </div>
        )}
        {allActivities && allActivities.length > 0 && (
          <div className="flex flex-col gap-5 pt-5">
            <DrepTimelineWaterfall activity={allActivities} />
          </div>
        )}
        {isLoadingMore && scrollDirection === 'down' && (
          <div className="flex items-center justify-center">
            <CircularProgress size={40} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DrepTimeline;
