'use client';
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
  const [epochs, setEpochs] = useState<any[]>([]);
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

  const [loadDirection, setLoadDirection] = useState<'older' | 'newer'>('older');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);

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
      setEpochs([]);
      setIsInitialLoad(true);
      setCursor(undefined);
      setHasNextPage(true);
      setHasPrevPage(false);
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
  ]);

  const { isLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.getDRepTimelineKey,
      idOrVoterId,
      cursor,
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
        undefined, // endTime
        undefined, // startTime
        cursor,
        filterValues,
        minItems,
        loadDirection,
      );
    },
    enabled: typeof window !== "undefined" && (!!idOrVoterId && filterValues !== null),
    refetchOnWindowFocus: false,
    onSuccess: (newData) => {
      const incomingEpochs = newData?.epochs || [];
      
      if (incomingEpochs.length === 0 && isInitialLoad) {
        addWarningAlert('No activity found for this DRep.');
        setIsInitialLoad(false);
        setHasNextPage(false);
        setHasPrevPage(false);
        return;
      }

      setNextCursor(newData.nextCursor);
      setPrevCursor(newData.prevCursor);
      setHasNextPage(!!newData.nextCursor);
      setHasPrevPage(!!newData.prevCursor);

      setEpochs((prevEpochs) => {
        if (prevEpochs.length < 1) {
          setIsInitialLoad(false);
          return incomingEpochs;
        }

        // Merge epochs logically
        const combined =
          loadDirection === 'newer'
            ? [...incomingEpochs, ...prevEpochs]
            : [...prevEpochs, ...incomingEpochs];

        // Deduplicate epochs by epochNo
        const seenEpochs = new Set();
        return combined.reduce((acc, epoch) => {
          if (!seenEpochs.has(epoch.epochNo)) {
            seenEpochs.add(epoch.epochNo);
            acc.push(epoch);
          } else {
            // Merge items into existing epoch if it's already there
            const existingEpoch = acc.find(e => e.epochNo === epoch.epochNo);
            if (existingEpoch) {
              const allItems = loadDirection === 'newer' 
                ? [...epoch.items, ...existingEpoch.items]
                : [...existingEpoch.items, ...epoch.items];
              
              // Deduplicate items by ID
              const seenItems = new Set();
              existingEpoch.items = allItems.filter(item => {
                if (seenItems.has(item.id)) return false;
                seenItems.add(item.id);
                return true;
              });
            }
          }
          return acc;
        }, [] as any[]).sort((a, b) => b.epochNo - a.epochNo);
      });
      setIsInitialLoad(false);
    },
  });

  return {
    DRepActivity: epochs, // Map epochs to activity for existing components to start with
    epochs,
    isDRepActivityLoading: isLoading,
    isInitialLoad: isInitialLoad,
    hasNextPage,
    hasPrevPage,
    nextCursor,
    prevCursor,
    setCursor,
    setLoadDirection,
    loadDirection,
  };
};
