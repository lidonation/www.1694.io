'use client';
import React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import SingleNote from '@/components/dreps/notes/SingleNote';
import EpochTimelineCard from '@/components/atoms/EpochTimelineCard';
import DrepVoteTimelineCard from '@/components/atoms/DrepVoteTimelineCard';
import Link from 'next/link';
import { urls } from '@/constants';
import { ProfileClaimedChip } from '@/components/molecules/ProfileClaimedChip';
import DrepDelegatorCard from '@/components/atoms/DrepDelegatorCard';
import BundledDelegations from '@/components/molecules/BundledDelegations';

interface DrepTimelineDesktopProps {
  epochs: any[];
  isAtLatestPoint?: boolean;
  isAtOldestPoint?: boolean;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  stakeKeyBech32: string | undefined;
  isConnected: boolean;
  isOwner: boolean;
}

export default function DrepTimelineDesktop({
  epochs,
  isAtLatestPoint,
  isAtOldestPoint,
  onLoadNewer,
  onLoadOlder,
  stakeKeyBech32,
  isConnected,
  isOwner,
}: DrepTimelineDesktopProps) {

  // Flatten all epochs and items into a single sequence for rendering
  const { flattenedItems, totalItems } = React.useMemo(() => {
    const allRenderable: any[] = [];
    
    epochs.forEach((epoch) => {
      // Add epoch header FIRST
      allRenderable.push({ 
        type: 'epoch_header', 
        epochNo: epoch.epochNo, 
        startTime: epoch.startTime, 
        endTime: epoch.endTime,
        hasEvents: epoch.items.length > 0
      });

      // Then process items within epoch
      epoch.items.forEach((item) => {
        allRenderable.push({ ...item, epochNo: epoch.epochNo });
      });
    });

    // Assign side based on index from the TOP (newest-to-oldest) for stability when loading older data
    let itemCounter = 0;
    const itemsWithPositions = allRenderable.map((item) => {
      if (item.type === 'epoch_header') {
        return item;
      }
      // First item (newest) starts on the left
      const position = itemCounter % 2 === 0 ? 'left' : 'right';
      itemCounter++;
      return { ...item, position };
    });

    return { flattenedItems: itemsWithPositions, totalItems: itemCounter };
  }, [epochs]);

  return (
    <Timeline>
      {!isAtLatestPoint && onLoadNewer && (
        <TimelineItem position="right">
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector className="h-10 border-2 border-dotted border-gray-200" sx={{ backgroundColor: 'white' }} />
          </TimelineSeparator>
          <TimelineContent>
            <div
              className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors w-fit mx-auto shadow-sm bg-white"
              onClick={onLoadNewer}
            >
              <img src="/svgs/reload.svg" alt="reload" className="w-4 h-4" />
              <p className="text-sm font-semibold text-orange-500">
                Load Newer History
              </p>
            </div>
          </TimelineContent>
        </TimelineItem>
      )}

      {flattenedItems.map((item: any, index: number) => {
        if (item.type === 'epoch_header') {
          return (
            <div key={`header-${item.epochNo}`} className="flex w-full flex-col items-center space-y-2">
              <TimelineSeparator>
                <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
              </TimelineSeparator>
              <div className="w-full">
                <EpochTimelineCard 
                  hasEvents={item.hasEvents}
                  epoch={{
                    epoch_no: item.epochNo,
                    start_time: item.startTime,
                    end_time: item.endTime,
                    type: 'epoch'
                  }} 
                />
              </div>
              <TimelineSeparator>
                <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
              </TimelineSeparator>
            </div>
          );
        }

        return (
          <TimelineItem key={item.id} position={item.position}>
            <TimelineSeparator>
              {item.type === 'voting_activity' ? (
                <TimelineConnector className="border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white', height: '24px', flexGrow: 0 }} />
              ) : null}
              <TimelineDot sx={item.type === 'bundled_delegations' ? { bgcolor: 'primary.main' } : {}} />
              <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
            </TimelineSeparator>
            <TimelineContent sx={{ minWidth: 0 }}>
              {item.type === 'note' && (
                <SingleNote note={item} currentVoter={stakeKeyBech32} isConnected={isConnected} />
              )}
              {item.type === 'registration' && (
                <Link href={`${urls.cexplorerUrl}/tx/${item?.tx_hash}`} target="_blank">
                  <div className="flex flex-row items-center justify-center gap-2 text-nowrap text-gray-500 hover:cursor-pointer hover:text-gray-800">
                    <img src="/svgs/external-link.svg" alt="" />
                    <p className="text-sm sm:text-base">Registered, Epoch {item?.epochNo}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </Link>
              )}
              {item.type === 'claimed_profile' && (
                <ProfileClaimedChip claimedAddress={item.claimedDRepId} dateOfClaim={item.timestamp} />
              )}
              {item.type === 'voting_activity' && (
                <DrepVoteTimelineCard item={item} isVoteOwner={isOwner} />
              )}
              {item.type === 'delegation' && (
                <DrepDelegatorCard item={{ ...item, eventType: item.type }} />
              )}
              {item.type === 'undelegation' && (
                <DrepDelegatorCard item={{ ...item, eventType: item.type }} />
              )}
              {item.type === 'bundled_delegations' && (
                <BundledDelegations items={item.items} />
              )}
            </TimelineContent>
          </TimelineItem>
        );
      })}

      {!isAtOldestPoint && onLoadOlder && (
        <TimelineItem position={totalItems % 2 === 0 ? 'left' : 'right'}>
          <TimelineSeparator>
            <TimelineConnector className="h-10 border-2 border-dotted border-gray-200" sx={{ backgroundColor: 'white' }} />
            <TimelineDot color="primary" />
          </TimelineSeparator>
          <TimelineContent>
            <div
              className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors w-fit mx-auto shadow-sm bg-white"
              onClick={onLoadOlder}
            >
              <img src="/svgs/reload.svg" alt="reload" className="w-4 h-4" />
              <p className="text-sm font-semibold text-orange-500">
                Load Older History
              </p>
            </div>
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
}
;

