import * as React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { useScreenDimension } from '@/hooks';
import SingleNote from '../dreps/notes/SingleNote';
import EpochTimelineCard from '../atoms/EpochTimelineCard';
import DrepVoteTimelineCard from '../atoms/DrepVoteTimelineCard';
import Link from 'next/link';
import { urls } from '@/constants';
import { ProfileClaimedChip } from './ProfileClaimedChip';
import DrepDelegatorCard from '../atoms/DrepDelegatorCard';
import { TimelineItem as DRepTimelineItem } from '../../../types/timeline';
import { useWallet } from '@/context/globalContext';

const DrepTimelineWaterfall = ({
  activity = [],
  drepId,
}: {
  activity: any[];
  drepId: string;
}) => {
  const { isMobile, screenWidth } = useScreenDimension();
  const { wallet:{stakeKeyBech32, isConnected}, user:{dRepProfilesClaimed} } = useWallet();
  const isOwner = dRepProfilesClaimed?.some(
    (drep) => drep.claimedDRepBech32 === drepId,
  );

  return (
    <Timeline
      sx={{
        ...((isMobile || screenWidth < 1024) && {
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }),
      }}
      position={screenWidth < 1024 ? 'right' : 'alternate-reverse'}
    >
      {activity &&
        activity.length > 0 &&
        activity.map((item: DRepTimelineItem, epochIndex) => (
          <React.Fragment key={epochIndex}>
            {item.type === 'note' && (
              <div className="flex w-full flex-col items-center space-y-2">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <div className="w-full">
                  <SingleNote
                    note={item}
                    currentVoter={stakeKeyBech32}
                    isConnected={isConnected}
                  />
                </div>
                <TimelineSeparator>
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
              </div>
            )}
            {item.type === 'epoch' && (
              <div className="flex w-full flex-col items-center space-y-2">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <EpochTimelineCard epoch={item} />
                <TimelineSeparator>
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
              </div>
            )}
            {item.type === 'registration' && (
              <div className="flex w-full flex-col items-center space-y-2">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <Link
                  href={`${urls.cexplorerUrl}/tx/${item?.tx_hash}`}
                  target="_blank"
                >
                  <div className="flex flex-row items-center justify-center gap-2 text-nowrap text-gray-500 hover:cursor-pointer hover:text-gray-800">
                    <img src="/svgs/external-link.svg" alt="" />
                    <p>Registered, Epoch {item?.epoch_no}</p>
                  </div>
                </Link>
              </div>
            )}
            {item.type === 'claimed_profile' && (
              <div className="flex w-full flex-col items-center space-y-2">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <ProfileClaimedChip
                  claimedAddress={item.claimedDRepId}
                  dateOfClaim={item.timestamp}
                />
              </div>
            )}
            {item.type === 'voting_activity' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <TimelineContent>
                  <DrepVoteTimelineCard
                    item={item}
                    isVoteOwner={isOwner}
                  />
                </TimelineContent>
              </TimelineItem>
            )}
            {item.type === 'delegation' && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector
                    className="h-10 border-2 border-dotted border-gray-300"
                    sx={{ backgroundColor: 'white' }}
                  />
                </TimelineSeparator>
                <TimelineContent>
                  <DrepDelegatorCard item={item} />
                </TimelineContent>
              </TimelineItem>
            )}
          </React.Fragment>
        ))}
    </Timeline>
  );
};
export default React.memo(DrepTimelineWaterfall);
