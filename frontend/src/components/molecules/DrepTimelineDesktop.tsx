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

  return (<Timeline position="alternate-reverse">
    {!isAtLatestPoint && onLoadNewer && (
      <TimelineItem>
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

    {epochs.map((epoch: any) => (
      <React.Fragment key={epoch.epochNo}>
        {/* Epoch Header */}
        <div className="flex w-full flex-col items-center space-y-2">
          <TimelineSeparator>
            <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
          </TimelineSeparator>
          <div className="w-full">
            <EpochTimelineCard 
              hasEvents={epoch.items.length > 0}
              epoch={{
                epoch_no: epoch.epochNo,
                start_time: epoch.startTime,
                end_time: epoch.endTime,
                type: 'epoch'
              }} 
            />
          </div>
          <TimelineSeparator>
            <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
          </TimelineSeparator>
        </div>

        {/* Epoch Items */}
        {epoch.items.map((item: any) => (
          <React.Fragment key={item.id}>
            {item.type === 'note' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <SingleNote note={item} currentVoter={stakeKeyBech32} isConnected={isConnected} />
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'registration' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <Link href={`${urls.cexplorerUrl}/tx/${item?.tx_hash}`} target="_blank">
                    <div className="flex flex-row items-center justify-center gap-2 text-nowrap text-gray-500 hover:cursor-pointer hover:text-gray-800">
                      <img src="/svgs/external-link.svg" alt="" />
                      <p className="text-sm sm:text-base">Registered, Epoch {item?.epoch_no}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  </Link>
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'claimed_profile' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <ProfileClaimedChip claimedAddress={item.claimedDRepId} dateOfClaim={item.timestamp} />
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'voting_activity' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineConnector className="border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white', height: '24px', flexGrow: 0 }} />
                  <TimelineDot />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <DrepVoteTimelineCard item={item} isVoteOwner={isOwner} />
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'delegation' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <DrepDelegatorCard item={item} />
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'bundled_delegations' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: 'primary.main' }} />
                  <TimelineConnector className="h-10 border-2 border-dotted border-gray-300" sx={{ backgroundColor: 'white' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0 }}>
                  <BundledDelegations items={item.items} />
                </TimelineContent>
              </TimelineItem>
            )}
          </React.Fragment>
        ))}
      </React.Fragment>
    ))}

    {!isAtOldestPoint && onLoadOlder && (
      <TimelineItem>
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
  </Timeline>)
};

