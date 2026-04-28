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
  const [filterValues, setFilterValues] = useState<string[] | undefined>(
    undefined,
  );
  const {
    epochs,
    isDRepActivityLoading,
    isInitialLoad,
    hasNextPage,
    hasPrevPage,
    nextCursor,
    prevCursor,
    setCursor,
    setLoadDirection,
    loadDirection,
  } = useGetDRepTimelineQuery(drepid, filterValues, 20);

  const isLoadingNewerData = isDRepActivityLoading && nextCursor !== null && prevCursor !== null; 
  const isLoadingOlderData = isDRepActivityLoading && nextCursor !== null;

  const {
    user: { dRepProfilesClaimed },
  } = useWallet();

  const isOwner = dRepProfilesClaimed?.some(
    (item) =>
      item.claimedDRepBech32 ===
      convertDrepPhraseToCIP105Legacy(drepid.toString()),
  );
  
  const searchParams = useSearchParams();
  const { isMobile } = useScreenDimension();
  const params = new URLSearchParams(searchParams.toString());

  useEffect(() => {
    if (searchParams) {
      if (params.get('category')) {
        const itemFilters = params.get('category');
        const activeItems = itemFilters.split(',');
        if (JSON.stringify(activeItems) !== JSON.stringify(filterValues)) {
          setFilterValues(activeItems);
        }
      } else {
        if (filterValues !== undefined) {
          setFilterValues(undefined);
        }
      }
    }
  }, [searchParams]);

  const loadMoreData = () => {
    if (!hasNextPage || isDRepActivityLoading || !nextCursor) return;
    setLoadDirection('older');
    setCursor(nextCursor);
  };

  const loadNewerData = () => {
    if (!hasPrevPage || isDRepActivityLoading || !prevCursor) return;
    setLoadDirection('newer');
    setCursor(prevCursor);
  };

  const firstEpoch = epochs[0];
  const lastEpoch = epochs[epochs.length - 1];
  const latestTime = firstEpoch?.items?.[0]?.timestamp || firstEpoch?.startTime;
  const oldestTime = lastEpoch?.items?.[lastEpoch.items.length - 1]?.timestamp || lastEpoch?.startTime;

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
              <Box className="flex flex-col items-center">
                {!hasPrevPage && epochs.length > 0 && (
                  <Typography
                    variant="body1"
                    paragraph={true}
                    className="text-gray-500"
                  >
                    You're all caught up!
                  </Typography>
                )}
                {epochs.length > 0 && (
                  <Typography
                    variant="body1"
                    paragraph={true}
                    className="text-sm"
                  >
                    Showing results from{' '}
                    <span className="font-semibold">{formatNumberTimeToReadable(new Date(oldestTime).getTime())}</span> to{' '}
                    <span className="font-semibold">{formatNumberTimeToReadable(new Date(latestTime).getTime())}</span>
                  </Typography>
                )}
              </Box>
            </Box>
            {!epochs ||
              (epochs.length < 1 && (
                <div className="flex h-[50vh] flex-col items-center justify-center">
                  <div className="my-16 flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
                    <DatabaseNullIcon width={60} height={50} />
                    <span className="mt-2 block text-sm font-semibold text-gray-500">
                      No results found for this period
                    </span>
                  </div>
                </div>
              ))}

            {epochs && epochs.length > 0 && (
              <DrepTimelineWaterfall
                epochs={epochs}
                drepId={drepid as string}
                isAtLatestPoint={!hasPrevPage}
                isAtOldestPoint={!hasNextPage}
                onLoadNewer={loadNewerData}
                onLoadOlder={loadMoreData}
              />
            )}


            <Box className="flex w-full flex-col items-center gap-2">
              <Box className="flex flex-col items-center">
                {!hasNextPage && epochs.length > 0 && (
                  <p className="text-gray-500">No more history to load</p>
                )}
              </Box>
            </Box>
          </div>
        </Fade>
      )}
    </div>
  );
};

export default memo(DRepTimeline);
