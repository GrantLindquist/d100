import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineOppositeContentClasses,
  TimelineSeparator,
} from '@mui/lab';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';

const QuestTimeline = (props: { questId: string }) => {
  const [rows, setRows] = useState<string[]>(['thing a', 'thing b', 'thing c']);

  return (
    <>
      <Typography
        id={'Quest Timeline'}
        fontWeight={BOLD_FONT_WEIGHT}
        variant="h2"
        pb={2}
      >
        Quest Timeline
      </Typography>
      <Timeline
        sx={{
          [`& .${timelineOppositeContentClasses.root}`]: {
            flex: 0.2,
          },
        }}
      >
        {rows.map((row, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot />
              {index < rows.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>{row}</TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  );
};
export default QuestTimeline;
