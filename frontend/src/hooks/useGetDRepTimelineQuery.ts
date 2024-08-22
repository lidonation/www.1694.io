import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQuery } from 'react-query';
import { getDRepTimeline } from '@/services/requests/getDRepTimeline';
import { useCardano } from '@/context/walletContext';
import { StakeKeys } from '../../types/commonTypes';
import { useState } from 'react';

export const useGetDRepTimelineQuery = (
  idOrVoterId: string | string[] | undefined,
  startTimeCursor?: number,
  endTimeCursor?: number,
) => {
  const { stakeKey, stakeKeyBech32 } = useCardano();
  const stakeKeys: StakeKeys = { stakeKey, stakeKeyBech32 };

  const [timeLineData, setTimeLineData] = useState([]);

  const { isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getDRepTimelineKey,
      idOrVoterId,
      startTimeCursor,
      endTimeCursor,
    ],
    queryFn: async () =>
      await getDRepTimeline(
        String(idOrVoterId),
        stakeKeys,
        startTimeCursor,
        endTimeCursor,
      ),
    enabled: true,
    refetchOnWindowFocus: false,
    onSuccess: (newData) => {
      if (newData.length === 0) return;
      setTimeLineData((prevData) => {
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

  return { DRepActivity: timeLineData, isDRepActivityLoading: isLoading };
};
