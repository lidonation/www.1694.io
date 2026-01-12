import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepTimeline } from '@/services/requests/getDRepTimeline';
import { useEffect, useRef, useState } from 'react';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { convertDrepPhraseToCIP105, formatNumberTimeToReadable } from '@/lib';
import { useWallet } from '@/context/globalContext';

export const useGetDRepTimelineQuery = (
  idOrVoterId: string | string[] | undefined,
  filterValues?: string[] | undefined,
  minItems: number = 10,
) => {
  const [timeLineData, setTimeLineData] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const {
    wallet: { stakeKey, stakeKeyBech32 },
  } = useWallet();
  const { addWarningAlert } = useGlobalNotifications();

  const queryParamsRef = useRef({
    filterValues,
    stakeKey,
    stakeKeyBech32,
    idOrVoterId,
  });

  const now = Date.now();
  const [queryEndTime, setQueryEndTime] = useState(now);
  const [queryStartTime, setQueryStartTime] = useState(
    now - 30 * 24 * 60 * 60 * 1000,
  );

  const [timelineEndTime, setTimelineEndTime] = useState(queryEndTime);
  const [timelineStartTime, setTimelineStartTime] = useState(queryStartTime);
  const [loadDirection, setLoadDirection] = useState('older');

  useEffect(() => {
    const prevQueryParams = queryParamsRef.current;

    const paramsHaveChanged =
      JSON.stringify(prevQueryParams.filterValues) !==
        JSON.stringify(filterValues) ||
      prevQueryParams.stakeKey !== stakeKey ||
      prevQueryParams.stakeKeyBech32 !== stakeKeyBech32 ||
      JSON.stringify(prevQueryParams.idOrVoterId) !==
        JSON.stringify(idOrVoterId);

    if (paramsHaveChanged) {
      setTimeLineData([]);
      setIsInitialLoad(true);
      setTimelineEndTime(queryEndTime);
      setTimelineStartTime(queryStartTime);
    }

    queryParamsRef.current = {
      filterValues,
      stakeKey,
      stakeKeyBech32,
      idOrVoterId,
    };
  }, [
    filterValues,
    stakeKey,
    stakeKeyBech32,
    idOrVoterId,
    queryEndTime,
    queryStartTime,
  ]);

  const { isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getDRepTimelineKey,
      idOrVoterId,
      queryEndTime,
      queryStartTime,
      filterValues,
      stakeKey,
      stakeKeyBech32,
      minItems,
      loadDirection,
    ],
    queryFn: async () => {
      const cip105Id = convertDrepPhraseToCIP105(idOrVoterId as string);
      return await getDRepTimeline(
        cip105Id,
        stakeKey,
        stakeKeyBech32,
        queryEndTime,
        queryStartTime,
        filterValues,
        minItems,
        loadDirection,
      );
    },
    enabled:
      !!idOrVoterId &&
      !!queryEndTime &&
      !!queryStartTime &&
      filterValues !== null,
    refetchOnWindowFocus: false,
    onSuccess: (newData) => {
      if (newData?.entries?.length === 0) {
        addWarningAlert(
          `No results found for period between ${formatNumberTimeToReadable(queryStartTime)} and ${formatNumberTimeToReadable(queryEndTime)}`,
        );
        setIsInitialLoad(false);
        return;
      }

      setTimeLineData((prevData) => {
        if (prevData.length < 1) {
          setIsInitialLoad(false);
          return newData?.entries;
        }

        const isNewer =
          newData?.entries?.[newData?.entries?.length - 1]?.timestamp >
          prevData?.[0]?.timestamp;
        if (isNewer) {
          return [...newData?.entries, ...prevData];
        } else {
          return [...prevData, ...newData?.entries];
        }
      });

      if (loadDirection === 'older') {
        setTimelineStartTime(newData?.appliedStartTime);
      } else if (loadDirection === 'newer') {
        setTimelineEndTime(newData?.appliedEndTime);
      }
    },
  });

  return {
    DRepActivity: timeLineData,
    isDRepActivityLoading: isLoading,
    isInitialLoad: isInitialLoad,
    queryEndTime,
    setQueryEndTime,
    queryStartTime,
    setQueryStartTime,
    timelineEndTime,
    setTimelineEndTime,
    timelineStartTime,
    setTimelineStartTime,
    setLoadDirection,
  };
};
