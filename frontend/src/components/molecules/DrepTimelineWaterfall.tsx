import * as React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import DrepTimelineCard from '../atoms/DrepTimelineCard';
import { useScreenDimension } from '@/hooks';

export default function DrepTimelineWaterfall({
  activity = [],
  epochOfRegistration = 0,
}: {
  activity: any[];
  epochOfRegistration: number;
}) {
  const { isMobile, screenWidth } = useScreenDimension();

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
        activity.map((item, epochIndex) => (
          <TimelineItem key={epochIndex}>
            <TimelineSeparator>
              {item?.no ? (
                <h4 className="text-nowrap font-bold py-2">Epoch {item?.no}</h4>
              ) : (
                <TimelineDot />
              )}
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              {item.type === 'note' && <p>Note here</p>}
              {item.type === 'voting_activity' && (
                <DrepTimelineCard item={item} />
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      {/* Default display */}
      {epochOfRegistration !== null && (
        <TimelineItem>
          <TimelineSeparator>
            <div className="flex flex-row items-center justify-center gap-2 text-nowrap text-gray-500">
              <img src="/svgs/loader.svg" alt="" />
              <p>Registered, Epoch {epochOfRegistration}</p>
            </div>
          </TimelineSeparator>
          <TimelineContent></TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
}
