'use client';
import React, { memo, useEffect, useState } from 'react';
import DrepTimelineWaterfall from './DrepTimelineWaterfall';
import Link from 'next/link';
import Button from '../atoms/Button';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import _ from 'lodash';
import { useGetDRepTimelineQuery } from '@/hooks/useGetDRepTimelineQuery';
import DRepTimelineLoader from '../Loaders/DRepTimelineLoader';
import ReloadIcon from '../atoms/svgs/ReloadIcon';
import {
  convertDrepPhraseToCIP105Legacy,
  formatNumberTimeToReadable,
} from '@/lib';
import { Box, Fade, Grow } from '@mui/material';
import DRepTimeLIneFilters from './DRepTimeLineFilters';
import DatabaseNullIcon from '../atoms/svgs/DatabaseNullIcon';
import { useScreenDimension } from '@/hooks';
import Typography from '@mui/material/Typography';
import { useWallet } from '@/context/globalContext';

const DRepTimeline = ({ drep }: { drep: any }) => {
  const { drepid } = useParams();
  const [filterValues, setFilterValues] = useState<string[]>(null);
  const {
    DRepActivity,
    isDRepActivityLoading,
    isInitialLoad,
    setQueryEndTime,
    setQueryStartTime,
    timelineEndTime,
    setTimelineEndTime,
    timelineStartTime,
    setTimelineStartTime,
    setLoadDirection,
  } = useGetDRepTimelineQuery(drepid, filterValues, 10);

  const [isAtLatestPoint, setIsAtLatestPoint] = useState(false);
  const [isAtOldestPoint, setIsAtOldestPoint] = useState(false);

  const [isLoadingNewerData, setIsLoadingNewerData] = useState(false);
  const [isLoadingOlderData, setIsLoadingOlderData] = useState(false);

  const {
    latestEpoch,
    firstEpoch,
    user: { dRepProfilesClaimed },
  } = useWallet();

  const isOwner = dRepProfilesClaimed?.some(
    (drep) =>
      drep.claimedDRepBech32 ===
      convertDrepPhraseToCIP105Legacy(drepid.toString()),
  );
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();
  const params = new URLSearchParams(searchParams.toString());
  const { isMobile } = useScreenDimension();
  const startTimeFormatted = formatNumberTimeToReadable(timelineStartTime);
  const endTimeFormatted = formatNumberTimeToReadable(timelineEndTime);

  useEffect(() => {
    if (searchParams) {
      if (params.get('start')) {
        const startTime = Number(params.get('start'));
        setQueryStartTime(startTime);
        setTimelineStartTime(startTime);
      }
      if (params.get('end')) {
        const endTime = Number(params.get('end'));
        setQueryEndTime(endTime);
        setTimelineEndTime(endTime);
      }
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      if (params.get('category')) {
        const itemFilters = params.get('category');
        const activeItems = itemFilters.split(',');
        setFilterValues(activeItems);
      } else {
        setFilterValues(undefined);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isDRepActivityLoading) {
      setIsLoadingOlderData(false);
      setIsLoadingNewerData(false);
    }
  }, [isDRepActivityLoading]);

  useEffect(() => {
    if (DRepActivity?.length > 0) {
      const epochs = DRepActivity.filter((item) => item.type === 'epoch');

      if (epochs.length === 0) return;

      const timelineLatestEpoch = epochs.reduce((latest, current) => {
        return new Date(current.timestamp) > new Date(latest.timestamp)
          ? current
          : latest;
      }, epochs[0]);

      const timelineOldestEpoch = epochs.reduce((oldest, current) => {
        return new Date(current.timestamp) < new Date(oldest.timestamp)
          ? current
          : oldest;
      }, epochs[0]);

      !!timelineLatestEpoch && timelineLatestEpoch.no === latestEpoch
        ? setIsAtLatestPoint(true)
        : setIsAtLatestPoint(false);

      !!timelineOldestEpoch && timelineOldestEpoch.no === firstEpoch
        ? setIsAtOldestPoint(true)
        : setIsAtOldestPoint(false);
    }
  }, [DRepActivity]);

  const loadMoreData = () => {
    setIsLoadingOlderData(true);
    setLoadDirection('older');
    const newEndTime = timelineStartTime - 1 * 24 * 60 * 60 * 1000;

    const newStartTime = newEndTime - 3 * 24 * 60 * 60 * 1000;

    setQueryEndTime(newEndTime);
    setQueryStartTime(newStartTime);
    setTimelineStartTime(newStartTime);

    updateURL(newStartTime, newEndTime);
  };

  const loadNewerData = () => {
    const currentTime = Date.now();

    if (timelineEndTime >= currentTime) {
      setIsAtLatestPoint(true);
      return;
    }
    setIsLoadingNewerData(true);
    setLoadDirection('newer');

    const newStartTime = timelineEndTime + 1 * 24 * 60 * 60 * 1000;

    const newEndTime = Math.min(
      newStartTime + 3 * 24 * 60 * 60 * 1000,
      currentTime,
    );

    setQueryStartTime(newStartTime);
    setQueryEndTime(newEndTime);
    setTimelineEndTime(newEndTime);

    updateURL(newStartTime, newEndTime);
  };

  const updateURL = (startTime?: number, endTime?: number) => {
    if (startTime) {
      params.set('start', String(startTime));
    }
    if (endTime) {
      params.set('end', String(endTime));
    }
    replace(`${pathName}?${params.toString()}`, { scroll: false });
  };

  console.log({ DRepActivity });
  

  return (
    <div className="flex h-full w-full flex-col gap-5 bg-white">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div className="flex w-full justify-end">
          <div className="flex items-center gap-4">
            {isOwner && drep?.drep_id && (
              <Button size="medium" className="flex w-fit items-center">
                <Link href={`/dreps/workflow/notes/new`}>
                  {isMobile ? (
                    <img
                      src="/svgs/file-plus.svg"
                      alt="plus"
                      title="Add a note"
                    />
                  ) : (
                    'Add a note'
                  )}
                </Link>
              </Button>
            )}
            <DRepTimeLIneFilters />
          </div>
        </div>
      </div>

      {isInitialLoad ? (
        <DRepTimelineLoader />
      ) : (
        <Fade
          in={!isInitialLoad}
          style={{ transformOrigin: 'top' }}
          {...(!isInitialLoad ? { timeout: 400 } : {})}
        >
          <div className="flex w-full flex-col gap-2">
            <Box className="flex w-full flex-col items-center gap-2">
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

              <Box className="flex flex-col items-center">
                {isAtLatestPoint && DRepActivity.length > 0 && (
                  <Typography
                    variant="body1"
                    paragraph={true}
                    className="text-gray-500"
                  >
                    You're all caught up!
                  </Typography>
                )}
                <Typography
                  variant="body1"
                  paragraph={true}
                  className="text-sm"
                >
                  Showing results from{' '}
                  <span className="font-semibold">{startTimeFormatted}</span> to{' '}
                  <span className="font-semibold">{endTimeFormatted}</span>
                </Typography>
              </Box>
            </Box>
            {isLoadingNewerData && (
              <Grow
                in={isLoadingNewerData}
                style={{ transformOrigin: 'top' }}
                {...(isLoadingNewerData ? { timeout: 300 } : {})}
              >
                <div>
                  <DRepTimelineLoader />
                </div>
              </Grow>
            )}
            {!DRepActivity ||
              (DRepActivity.length < 1 && (
                <div className="flex h-[50vh] flex-col items-center justify-center">
                  <div className="my-16 flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
                    <DatabaseNullIcon width={60} height={50} />
                    <span className="mt-2 block text-sm font-semibold text-gray-500">
                      No results found for this period try loading newer or
                      older
                    </span>
                  </div>
                </div>
              ))}

            {DRepActivity && DRepActivity.length > 0 && (
              <DrepTimelineWaterfall
                activity={DRepActivity}
                drepId={drepid as string}
              />
            )}

            {isLoadingOlderData && (
              <Grow
                in={isLoadingOlderData}
                style={{ transformOrigin: 'top' }}
                {...(isLoadingOlderData ? { timeout: 300 } : {})}
              >
                <div>
                  <DRepTimelineLoader />
                </div>
              </Grow>
            )}

            <Box className="flex w-full flex-col items-center gap-2">
              <Box className="flex flex-col items-center">
                <Typography
                  variant="body1"
                  paragraph={true}
                  className="text-sm"
                >
                  Showing results from{' '}
                  <span className="font-semibold">{startTimeFormatted}</span> to{' '}
                  <span className="font-semibold">{endTimeFormatted}</span>
                </Typography>
                {isAtOldestPoint && DRepActivity.length > 0 && (
                  <p className="text-gray-500">You're all caught up!</p>
                )}
              </Box>
              {!isAtOldestPoint && (
                <Box
                  className="flex cursor-pointer items-center gap-2 rounded border px-2 py-1 hover:bg-gray-200"
                  onClick={loadMoreData}
                >
                  <ReloadIcon color="black" width={20} height={18} />
                  <p className="text-base font-medium text-orange-500 ">
                    Load Older
                  </p>
                </Box>
              )}
            </Box>
          </div>
        </Fade>
      )}
    </div>
  );
};

export default memo(DRepTimeline);
