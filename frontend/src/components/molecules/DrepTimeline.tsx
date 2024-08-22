'use client';
import React, { memo, useCallback, useEffect, useState } from 'react';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import Link from 'next/link';
import Button from '../atoms/Button';
import { useCardano } from '@/context/walletContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { useGetDRepTimelineQuery } from '@/hooks/useGetDRepTimelineQuery';
import DRepTimelineLoader from '../Loaders/DRepTimelineLoader';
import ReloadIcon from '../atoms/svgs/ReloadIcon';

const DrepTimeline = ({ cexplorerDetails }: { cexplorerDetails: any }) => {
  const router = useRouter();
  const [queryEndTime, setQueryEndTime] = useState(() => Date.now());
  const [queryStartTime, setQueryStartTime] = useState(
    () => queryEndTime - 5 * 24 * 60 * 60 * 1000,
  );
  const [timelineEndTime, setTimelineEndTime] = useState(queryEndTime);
  const [timelineStartTime, setTimelineStartTime] = useState(queryStartTime);
  const [isAtLatestPoint, setIsAtLatestPoint] = useState(true);

  const searchParams = useSearchParams();
  const { dRepIDBech32 } = useCardano();
  const { drepid } = useParams();
  const { DRepActivity, isDRepActivityLoading } = useGetDRepTimelineQuery(
    drepid,
    queryEndTime,
    queryStartTime,
  );

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const startTimeFormatted = new Date(timelineStartTime).toLocaleString(
    undefined,
    options,
  );
  const endTimeFormatted = new Date(timelineEndTime).toLocaleString(
    undefined,
    options,
  );

  //  console.log(endTime === Date.now(), endTime, Date.now())
  // const handleScroll = (event) => {
  //   const currentScrollTop = event.target.scrollTop;
  //   const isScrollingDown = currentScrollTop > prevScrollTop;
  //   setScrollDirection(isScrollingDown ? 'down' : 'up');
  //   setPrevScrollTop(currentScrollTop);
  //   if (currentScrollTop === 0 && scrollDirection === 'up' && !isPreviousData) {
  //     fetchMoreData();
  //   } else if (
  //     currentScrollTop === 0 &&
  //     scrollDirection === 'up' &&
  //     !!isPreviousData
  //   ) {
  //     const params = new URLSearchParams(searchParams);
  //     params.delete('startTime');
  //     params.delete('endTime');
  //     router.replace(`?${params.toString()}`, { scroll: false });
  //   }
  // };

  // useEffect(() => {
  //   let startTime, endTime;
  //   if (searchParams) {
  //     const params = new URLSearchParams(searchParams);
  //     if (params.get('startTime')) {
  //       setStartTime(new Date(params.get('startTime')).getTime());
  //       startTime = new Date(params.get('startTime')).getTime();
  //     }
  //     if (params.get('endTime')) {
  //       setEndTime(new Date(params.get('endTime')).getTime());
  //       endTime = new Date(params.get('endTime')).getTime();
  //     }
  //   }
  //   const initialFetch = async (startTime, endTime) => {
  //     let newStartTime = startTime;
  //     let newEndTime = endTime;
  //     let drep;
  //     String(drepId).includes('drep')
  //       ? (drep = await getSingleDRepViaVoterId(
  //           drepId as string,
  //           stakeKeys,
  //           newEndTime,
  //           newStartTime,
  //         ))
  //       : (drep = await getSingleDRep(
  //           Number(drepId),
  //           stakeKeys,
  //           newEndTime,
  //           newStartTime,
  //         ));

  //     if (drep.activity && drep.activity.length > 0) {
  //       setAllActivities((prevActivities) => {
  //         const uniqueActivitiesMap = new Map(
  //           [...drep.activity].map((activity) => [
  //             `${activity.timestamp}-${activity.type}`,
  //             activity,
  //           ]),
  //         );
  //         return Array.from(uniqueActivitiesMap.values()).sort(
  //           (a, b) =>
  //             new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  //         );
  //       });
  //       setHasMoreBelow(drep.activity.length > 0);
  //       // Update time states
  //       setEndTime(newEndTime);
  //       setStartTime(newStartTime);
  //     }
  //   };
  //   if (drepId) initialFetch(startTime, endTime);
  // }, [drepId]);
  const loadMoreData = () => {
    const newEndTime = timelineStartTime - 1 * 24 * 60 * 60 * 1000;

    const newStartTime = newEndTime - 5 * 24 * 60 * 60 * 1000;

    setQueryEndTime(newEndTime);
    setQueryStartTime(newStartTime);
    setTimelineStartTime(newStartTime);

    updateURL(newStartTime, newEndTime);
  };

  const loadNewerData = () => {
    const sixDaysInMillis = 6 * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();

    if (timelineEndTime + sixDaysInMillis > currentTime) {
      setIsAtLatestPoint(true);
      return;
    }

    const newStartTime = timelineEndTime + 1 * 24 * 60 * 60 * 1000;

    const newEndTime = Math.min(
      newStartTime + 5 * 24 * 60 * 60 * 1000,
      currentTime,
    );

    setQueryStartTime(newStartTime);
    setQueryEndTime(newEndTime);
    setTimelineEndTime(newEndTime);

    updateURL(newStartTime, newEndTime);

    // if (newEndTime === Date.now()) {
    //   setIsAtLatestPoint(true);
    // }
  };

  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      if (params.get('startTime')) {
        const startTime = new Date(params.get('startTime')).getTime();
        setQueryStartTime(startTime);
        setTimelineStartTime(startTime);
      }
      if (params.get('endTime')) {
        const endTime = new Date(params.get('endTime')).getTime();
        setQueryEndTime(endTime);
        setTimelineEndTime(endTime);
        endTime < Date.now()
          ? setIsAtLatestPoint(false)
          : setIsAtLatestPoint(true);
      }
    }
  }, []);

  const updateURL = useCallback((startTime?: number, endTime?: number) => {
    const params = new URLSearchParams(searchParams);
    if (startTime) {
      params.set('startTime', new Date(startTime).toISOString());
    }
    if (endTime) {
      params.set('endTime', new Date(endTime).toISOString());
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, []);
  // useEffect(() => {
  //   if (activity) {
  //     setAllActivities((prevActivities) => {
  //       const uniqueActivitiesMap = new Map(
  //         [...prevActivities, ...activity].map((activity) => [
  //           `${activity.timestamp}-${activity.type}`,
  //           activity,
  //         ]),
  //       );
  //       return Array.from(uniqueActivitiesMap.values()).sort(
  //         (a, b) =>
  //           new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  //       );
  //     });
  //     setHasMoreBelow(activity.length > 0);
  //   }
  // }, [activity]);

  // const updateDominantActivity = useCallback(
  //   _.debounce(
  //     () => {
  //       updateURL(startTime, endTime);
  //     },
  //     400,
  //     { leading: true, trailing: false },
  //   ),
  //   [startTime, endTime],
  // );

  // const fetchMoreData = useCallback(async () => {
  //   if (allActivities && allActivities.length > 0 && !isPreviousData) {
  //     setIsLoadingMore(true);
  //     let newStartTime;
  //     let newEndTime;
  //     if (scrollDirection === 'up') {
  //       const newestActivityTimestamp = Math.max(
  //         ...allActivities.map((a) => new Date(a.timestamp).getTime()),
  //       );
  //       newStartTime = newestActivityTimestamp;
  //       newEndTime = newStartTime + 5 * 24 * 60 * 60 * 1000; // 5 days earlier
  //     } else {
  //       const oldestActivityTimestamp = Math.min(
  //         ...allActivities.map((a) => new Date(a.timestamp).getTime()),
  //       );
  //       newEndTime = oldestActivityTimestamp;
  //       newStartTime = newEndTime - 5 * 24 * 60 * 60 * 1000; // Fetch 5 more days
  //     }

  //     let drep;
  //     String(drepId).includes('drep')
  //       ? (drep = await getSingleDRepViaVoterId(
  //           drepId as string,
  //           stakeKeys,
  //           newEndTime,
  //           newStartTime,
  //         ))
  //       : (drep = await getSingleDRep(
  //           Number(drepId),
  //           stakeKeys,
  //           newEndTime,
  //           newStartTime,
  //         ));
  //     if (drep.activity && drep.activity.length > 0) {
  //       setlastBatch(drep.activity);

  //       setAllActivities((prevActivities) => {
  //         const uniqueActivitiesMap = new Map(
  //           [...prevActivities, ...drep.activity].map((activity) => [
  //             `${activity.timestamp}-${activity.type}`,
  //             activity,
  //           ]),
  //         );
  //         return Array.from(uniqueActivitiesMap.values()).sort(
  //           (a, b) =>
  //             new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  //         );
  //       });

  //       if (scrollDirection === 'up') {
  //         setHasMoreAbove(drep.activity.length > 1);
  //         // Maintain scroll position
  //         setTimeout(() => {
  //           const scrollableDiv = document.getElementById('scrollableDiv');
  //           if (scrollableDiv) {
  //             scrollableDiv.scrollTop += drep.activity.length * 100; // Adjust this value based on your item height
  //           }
  //         }, 0);
  //       }
  //       if (scrollDirection === 'down') {
  //         setHasMoreBelow(drep.activity.length > 1);
  //       }
  //       // Update time states
  //       setEndTime(newEndTime);
  //       setIsPreviousData(_.isEqual(drep.activity, lastBatch));
  //       setStartTime(newStartTime);
  //       setIsLoadingMore(false);
  //     } else {
  //       setHasMoreBelow(false);
  //       setIsLoadingMore(false);
  //       setHasMoreAbove(false);
  //     }
  //   }
  // }, [drepId, allActivities, scrollDirection]);
  return (
    <div className="flex h-full w-full flex-col gap-5 bg-white px-5 py-3">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div className="flex w-full justify-between">
          <p className="w-full text-2xl font-bold sm:w-auto lg:text-3xl">
            Timeline
          </p>
          {cexplorerDetails?.view == dRepIDBech32 && (
            <Button size="medium" className="flex w-fit items-center">
              <Link href={`/dreps/workflow/notes/new`}>Add a note</Link>
            </Button>
          )}
        </div>
      </div>

      {!cexplorerDetails?.view ? (
        <DRepTimelineLoader />
      ) : (
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col items-end gap-2">
            {!isAtLatestPoint && (
              <div
                className="flex cursor-pointer items-center gap-2 rounded border px-2 py-1 hover:bg-gray-200"
                onClick={loadNewerData}
              >
                <ReloadIcon color="black" width={20} height={18} />
                <p className="text-base font-medium text-orange-500 ">
                  Load Newer
                </p>
              </div>
            )}
            <p className="text-sm">
              Showing results from{' '}
              <span className="font-semibold">{startTimeFormatted}</span> to{' '}
              <span className="font-semibold">{endTimeFormatted}</span>
            </p>
          </div>

          {DRepActivity && DRepActivity.length > 0 && (
            <DrepTimelineWaterfall activity={DRepActivity} />
          )}

          <div className="flex w-full flex-col items-end gap-2">
            <p className="text-sm">
              Showing results from{' '}
              <span className="font-semibold">{startTimeFormatted}</span> to{' '}
              <span className="font-semibold">{endTimeFormatted}</span>
            </p>
            <div
              className="flex cursor-pointer items-center gap-2 rounded border px-2 py-1 hover:bg-gray-200"
              onClick={loadMoreData}
            >
              <ReloadIcon color="black" width={20} height={18} />
              <p className="text-base font-medium text-orange-500 ">
                Load Older
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DrepTimeline);
