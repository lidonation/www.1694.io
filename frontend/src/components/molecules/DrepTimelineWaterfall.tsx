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

  // Function to group and sort activity items by epoch
  const groupAndSortByEpoch = (activity) => {
    const grouped = activity.reduce((acc, item) => {
      const epoch = item.voting_epoch;
      if (!acc[epoch]) {
        acc[epoch] = [];
      }
      acc[epoch].push(item);
      return acc;
    }, {});

    // Sort epochs from latest to earliest
    const sortedEpochs = Object.keys(grouped).sort(
      (a, b) => Number(b) - Number(a),
    );

    // Sort activities within each epoch from latest to earliest
    sortedEpochs.forEach((epoch) => {
      grouped[epoch].sort(
        (a, b) =>
          new Date(b.time_voted).getTime() - new Date(a.time_voted).getTime(),
      );
    });

    return { grouped, sortedEpochs };
  };

  const { grouped, sortedEpochs } = groupAndSortByEpoch(activity);

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
        sortedEpochs.map((epoch, epochIndex) => (
          <React.Fragment key={epochIndex}>
            {/* Render activity items for this epoch */}
            {grouped[epoch].map((item, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <DrepTimelineCard item={item} />
                </TimelineContent>
              </TimelineItem>
            ))}
            {/* Render epoch label */}
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <h4 className="font-bold ">Epoch {epoch}</h4>
              </TimelineContent>
            </TimelineItem>
          </React.Fragment>
        ))}
        {/* Default display  */}
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
