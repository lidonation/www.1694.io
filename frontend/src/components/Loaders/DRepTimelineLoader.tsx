import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Skeleton } from '@mui/material';
import React from 'react';

function DRepTimelineLoader() {
  return (
    <div className="h-screen">
      <Timeline position="alternate-reverse">
        <div className="flex w-full flex-col items-center space-y-2">
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <Skeleton variant="rounded" className="w-full" height={150} />
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
        </div>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <TimelineContent>
            <Skeleton variant="rounded" className="w-full" height={120} />
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <TimelineContent>
            <Skeleton variant="rounded" className="w-full" height={120} />
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <TimelineContent>
            <Skeleton variant="rounded" className="w-full" height={120} />
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <TimelineContent>
            <Skeleton variant="rounded" className="w-full" height={120} />
          </TimelineContent>
        </TimelineItem>
        <div className="flex w-full flex-col items-center space-y-2">
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector
              className="h-10 border-2 border-dotted border-gray-300"
              sx={{ backgroundColor: 'white' }}
            />
          </TimelineSeparator>
          <Skeleton variant="rounded" className="w-full" height={76} />
        </div>
      </Timeline>
    </div>
  );
}

export default DRepTimelineLoader;
