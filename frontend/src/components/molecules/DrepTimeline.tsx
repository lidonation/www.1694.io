'use client';
import React, { useCallback, useEffect, useState } from 'react';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';
import Button from '../atoms/Button';
import { useCardano } from '@/context/walletContext';
import { useRouter, useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import { StakeKeys } from '../../../types/commonTypes';
const DrepTimeline = ({
  drepId,
  cexplorerDetails,
  activity,
}: {
  drepId: string;
  cexplorerDetails: any;
  activity: any[];
}) => {
  const [searchText, setSearchText] = useState('');
  const [allActivities, setAllActivities] = useState(activity || []);
  const [hasMoreAbove, setHasMoreAbove] = useState(true);
  const [hasMoreBelow, setHasMoreBelow] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPreviousData, setIsPreviousData] = useState(false);
  const [lastBatch, setlastBatch] = useState([]);
  const router = useRouter();
  const [scrollDirection, setScrollDirection] = useState('down');
  const [prevScrollTop, setPrevScrollTop] = useState(0);
  const [endTime, setEndTime] = useState(() => Date.now());
  const [startTime, setStartTime] = useState(
    () => endTime - 5 * 24 * 60 * 60 * 1000,
  ); // 30 days for now
  const searchParams = useSearchParams();
  const { dRepIDBech32, stakeKey, stakeKeyBech32 } = useCardano();
  const handleScroll = (event) => {
    const currentScrollTop = event.target.scrollTop;
    const isScrollingDown = currentScrollTop > prevScrollTop;
    setScrollDirection(isScrollingDown ? 'down' : 'up');
    setPrevScrollTop(currentScrollTop);
    currentScrollTop === 0 &&
      scrollDirection === 'up' &&
      !isPreviousData &&
      fetchMoreData();
  };
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };

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
            stakeKeys,
            newEndTime,
            newStartTime,
          ))
        : (drep = await getSingleDRep(
            Number(drepId),
            stakeKeys,
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
  useEffect(() => {
    if (activity) {
      setAllActivities((prevActivities) => {
        const uniqueActivitiesMap = new Map(
          [...prevActivities, ...activity].map((activity) => [
            activity.timestamp,
            activity,
          ]),
        );
        return Array.from(uniqueActivitiesMap.values()).sort(
          (a, b) => b.timestamp - a.timestamp,
        );
      });
      setHasMoreBelow(activity.length > 0);
    }
  }, [activity]);

  const updateDominantActivity = useCallback(
    _.debounce(
      () => {
        updateURL(startTime, endTime);
      },
      400,
      { leading: true, trailing: false },
    ),
    [startTime, endTime],
  );

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
            stakeKeys,
            newEndTime,
            newStartTime,
          ))
        : (drep = await getSingleDRep(
            Number(drepId),
            stakeKeys,
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
          // Maintain scroll position
          setTimeout(() => {
            const scrollableDiv = document.getElementById('scrollableDiv');
            if (scrollableDiv) {
              scrollableDiv.scrollTop += drep.activity.length * 100; // Adjust this value based on your item height
            }
          }, 0);
        }
        if (scrollDirection === 'down') {
          setHasMoreBelow(drep.activity.length > 1);
        }
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
      <div
        id="scrollableDiv"
        style={{
          height: 1000,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
        onScroll={handleScroll}
      >
        {allActivities && allActivities.length > 0 && (
          <InfiniteScroll
            onScroll={updateDominantActivity}
            dataLength={allActivities.length}
            next={fetchMoreData}
            hasMore={scrollDirection === 'down' ? hasMoreBelow : hasMoreAbove}
            loader={<p className="text-center">Loading...</p>}
            endMessage={<p className="text-center">You've caught up!</p>}
            scrollThreshold="200px"
            scrollableTarget="scrollableDiv"
            className="flex flex-col gap-5 pt-5"
            inverse={scrollDirection === 'up'} // Enable reverse scrolling
          >
            <DrepTimelineWaterfall activity={allActivities} />
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
};

export default DrepTimeline;
