import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepTimeline } from '@/services/requests/getDRepTimeline';
import { useCardano } from '@/context/walletContext';
import { StakeKeys } from '../../types/commonTypes';
import { useState } from 'react';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { formatNumberTimeToReadable } from '@/lib';

export const useGetDRepTimelineQuery = (
  idOrVoterId: string | string[] | undefined,
  endTimeCursor?: number,
  startTimeCursor?: number,
) => {
  const [timeLineData, setTimeLineData] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { stakeKey, stakeKeyBech32 } = useCardano();
  const { addWarningAlert } = useGlobalNotifications();
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };

  const { isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getDRepTimelineKey,
      idOrVoterId,
      endTimeCursor,
      startTimeCursor,
    ],
    queryFn: async () =>
      await getDRepTimeline(
        String(idOrVoterId),
        stakeKeys,
        endTimeCursor,
        startTimeCursor,
      ),
    enabled:
      !!idOrVoterId &&
      !!endTimeCursor &&
      !!startTimeCursor &&
      stakeKey !== null &&
      stakeKeyBech32 !== null,
    refetchOnWindowFocus: false,
    onSuccess: (newData) => {
      if (newData.length === 0) {
        addWarningAlert(
          `No results found for period between ${formatNumberTimeToReadable(startTimeCursor)} and ${formatNumberTimeToReadable(endTimeCursor)}`,
        );
        return;
      }
      setTimeLineData((prevData) => {
        if (prevData.length < 1) {
          setIsInitialLoad(false);
        }
        const isNewer =
          newData?.[newData.length - 1]?.timestamp > prevData?.[0]?.timestamp;
        if (isNewer) {
          return [...newData, ...prevData];
        } else {
          return [...prevData, ...newData];
        }
      });
    },
  });

  return {
    DRepActivity: timeLineData,
    isDRepActivityLoading: isLoading,
    isInitialLoad: isInitialLoad,
  };
};
