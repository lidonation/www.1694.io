import * as React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import DrepTimelineCard from '../atoms/DrepTimelineCard';
import { useScreenDimension } from '@/hooks';

export default function DrepTimelineWaterfall() {
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
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot />
          <TimelineConnector  />
        </TimelineSeparator>
        <TimelineContent>
          <DrepTimelineCard />
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <DrepTimelineCard />
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot />
        </TimelineSeparator>
        <TimelineContent>
          <DrepTimelineCard />
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}