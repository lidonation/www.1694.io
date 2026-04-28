'use client';
import React from 'react';
import { Box } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
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

interface DrepTimelineMobileProps {
  epochs: any[];
  isAtLatestPoint?: boolean;
  isAtOldestPoint?: boolean;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  stakeKeyBech32: string | undefined;
  isConnected: boolean;
  isOwner: boolean;
}

export default function DrepTimelineMobile({
  epochs,
  isAtLatestPoint,
  isAtOldestPoint,
  onLoadNewer,
  onLoadOlder,
  stakeKeyBech32,
  isConnected,
  isOwner,
}: DrepTimelineMobileProps) {

  return (
    <Box sx={{ width: '100%', position: 'relative', px: 1 }}>
      <Timeline
        sx={{
          padding: 0,
          margin: 0,
          [`& .${timelineItemClasses.root}:before`]: {
            display: 'none',
          },
          '& .MuiTimelineItem-root': {
            minHeight: '40px',
          },
        }}
      >
        {!isAtLatestPoint && onLoadNewer && (
          <TimelineItem sx={{ minHeight: 'auto' }}>
            <TimelineSeparator sx={{ width: '30px', flexShrink: 0, alignItems: 'center' }}>
              <TimelineDot variant="outlined" color="primary" sx={{ m: 0, p: '2px', border: '1px solid', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-1 h-1 rounded-full bg-orange-500" />
              </TimelineDot>
              <TimelineConnector sx={{ 
                width: '1.5px', 
                backgroundColor: 'transparent', 
                backgroundImage: 'linear-gradient(to bottom, #E5E7EB 50%, rgba(255,255,255,0) 0%)',
                backgroundPosition: 'center',
                backgroundSize: '1.5px 8px',
                backgroundRepeat: 'repeat-y',
                minHeight: '20px' 
              }} />
            </TimelineSeparator>
            <TimelineContent sx={{ py: '6px', px: 1 }}>
              <button
                className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-50/50 px-3 py-1 rounded-full border border-orange-100/50"
                onClick={onLoadNewer}
              >
                Load Newer
              </button>
            </TimelineContent>
          </TimelineItem>
        )}

        {epochs.map((epoch: any, epochIndex: number) => (
          <React.Fragment key={epoch.epochNo}>
            {/* Epoch Header */}
            <TimelineItem sx={{ minHeight: 'auto' }}>
              <TimelineSeparator sx={{ width: '30px', flexShrink: 0, alignItems: 'center' }}>
                {epochIndex === 0 && isAtLatestPoint ? (
                  <div className="h-4" />
                ) : (
                  <TimelineConnector sx={{ 
                    width: '1.5px', 
                    backgroundColor: 'transparent', 
                    backgroundImage: 'linear-gradient(to bottom, #D1D5DB 50%, rgba(255,255,255,0) 0%)',
                    backgroundPosition: 'center',
                    backgroundSize: '1.5px 8px',
                    backgroundRepeat: 'repeat-y'
                  }} />
                )}
                <TimelineDot
                  sx={{
                    m: 0,
                    p: 0,
                    boxShadow: 'none',
                    bgcolor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '12px',
                    height: '12px',
                    minWidth: '12px',
                    zIndex: 2
                  }}
                >
                  <div className="w-3 h-3 rounded-full border-2 border-primary bg-white ring-4 ring-primary/10" />
                </TimelineDot>
                <TimelineConnector sx={{ 
                  width: '1.5px', 
                  backgroundColor: 'transparent', 
                  backgroundImage: 'linear-gradient(to bottom, #D1D5DB 50%, rgba(255,255,255,0) 0%)',
                  backgroundPosition: 'center',
                  backgroundSize: '1.5px 8px',
                  backgroundRepeat: 'repeat-y'
                }} />
              </TimelineSeparator>
              <TimelineContent sx={{ py: 2, px: 1, pr: 0 }}>
                <EpochTimelineCard 
                  hasEvents={epoch.items.length > 0}
                  epoch={{
                    epoch_no: epoch.epochNo,
                    start_time: epoch.startTime,
                    end_time: epoch.endTime,
                    type: 'epoch'
                  }} 
                  minimal={true} 
                />
              </TimelineContent>
            </TimelineItem>

            {/* Epoch Items */}
            {epoch.items.map((item: any) => (
              <TimelineItem key={item.id} sx={{ minHeight: 'auto' }}>
                <TimelineSeparator sx={{ width: '30px', flexShrink: 0, alignItems: 'center' }}>
                  <TimelineConnector sx={{ 
                    width: '1.5px', 
                    backgroundColor: 'transparent', 
                    backgroundImage: 'linear-gradient(to bottom, #D1D5DB 50%, rgba(255,255,255,0) 0%)',
                    backgroundPosition: 'center',
                    backgroundSize: '1.5px 8px',
                    backgroundRepeat: 'repeat-y'
                  }} />
                  <TimelineDot
                    sx={{
                      m: 0,
                      p: 0,
                      boxShadow: 'none',
                      bgcolor: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '12px',
                      height: '12px',
                      minWidth: '12px',
                      zIndex: 2
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full border ${item.type === 'bundled_delegations' ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`} />
                  </TimelineDot>
                  <TimelineConnector sx={{ 
                    width: '1.5px', 
                    backgroundColor: 'transparent', 
                    backgroundImage: 'linear-gradient(to bottom, #D1D5DB 50%, rgba(255,255,255,0) 0%)',
                    backgroundPosition: 'center',
                    backgroundSize: '1.5px 8px',
                    backgroundRepeat: 'repeat-y'
                  }} />
                </TimelineSeparator>

                <TimelineContent sx={{ py: 1.5, px: 1, pr: 0 }}>
                  <Box sx={{ width: '100%' }}>
                    {item.type === 'note' && <SingleNote note={item} currentVoter={stakeKeyBech32} isConnected={isConnected} />}
                    {item.type === 'registration' && (
                      <Link href={`${urls.cexplorerUrl}/tx/${item?.tx_hash}`} target="_blank">
                        <div className="text-[10px] font-bold text-gray-500 py-1 bg-gray-50 px-3 rounded-full border border-gray-100 w-fit shadow-sm">
                          Registered, Epoch {item?.epoch_no}
                        </div>
                      </Link>
                    )}
                    {item.type === 'claimed_profile' && <ProfileClaimedChip claimedAddress={item.claimedDRepId} dateOfClaim={item.timestamp} />}
                    {item.type === 'voting_activity' && <DrepVoteTimelineCard item={item} isVoteOwner={isOwner} minimal={true} />}
                    {item.type === 'delegation' && <DrepDelegatorCard item={item} />}
                    {item.type === 'bundled_delegations' && <BundledDelegations items={item.items} />}
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </React.Fragment>
        ))}

        {!isAtOldestPoint && onLoadOlder && (
          <TimelineItem sx={{ minHeight: 'auto' }}>
            <TimelineSeparator sx={{ width: '30px', flexShrink: 0, alignItems: 'center' }}>
              <TimelineConnector sx={{ 
                width: '1.5px', 
                backgroundColor: 'transparent', 
                backgroundImage: 'linear-gradient(to bottom, #E5E7EB 50%, rgba(255,255,255,0) 0%)',
                backgroundPosition: 'center',
                backgroundSize: '1.5px 8px',
                backgroundRepeat: 'repeat-y',
                minHeight: '20px' 
              }} />
              <TimelineDot variant="outlined" color="primary" sx={{ m: 0, p: '2px', border: '1px solid', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-1 h-1 rounded-full bg-orange-500" />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent sx={{ py: '6px', px: 1 }}>
              <button
                className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-50/50 px-3 py-1 rounded-full border border-orange-100/50"
                onClick={onLoadOlder}
              >
                Load Older
              </button>
            </TimelineContent>
          </TimelineItem>
        )}
      </Timeline>
    </Box>
  );
}

