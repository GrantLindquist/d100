'use client';
import { Box, Container, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Quest, Section } from '@/types/Unit';
import { useCampaign } from '@/hooks/useCampaign';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import {
  EditableSection,
  SectionComponent,
} from '@/components/EditableSection';

export default function QuestPage() {
  const { currentUnit } = useCampaign();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isAdding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    currentUnit?.type === 'quest' && setQuest(currentUnit as Quest);
  }, [currentUnit]);

  return (
    <Container sx={{ paddingY: 3 }}>
      {quest && (
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Box width={'100%'}>
              <p>quest shit</p>
            </Box>
          </Grid>
          <Grid item xs={8}>
            <Box pl={3}>
              {quest.hidden && (
                <Typography color={'grey'} variant={'subtitle2'}>
                  Hidden from players
                </Typography>
              )}
              <Timeline
                sx={{
                  [`& .${timelineItemClasses.root}:before`]: {
                    flex: 0,
                    padding: 0,
                  },
                }}
              >
                {quest.sections.map((section: Section, index) => {
                  return (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot />
                        {index !== quest.sections.length - 1 && (
                          <TimelineConnector />
                        )}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Box
                          sx={
                            isEditing ||
                            (section.title.length <= 0 &&
                              section.body.length <= 0)
                              ? {}
                              : { display: 'none' }
                          }
                        >
                          <EditableSection section={section} />
                        </Box>
                        <Box sx={!isEditing ? {} : { display: 'none' }}>
                          <SectionComponent section={section} />
                        </Box>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
