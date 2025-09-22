'use client';
import { Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import CampaignList from '@/components/data-list/CampaignList';
import CreateCampaignModal from '@/components/modals/CreateCampaignModal';
import JoinCampaignModal from '@/components/modals/JoinCampaignModal';
import { outfit } from '@/components/AppWrapper';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';

// TODO: Fix loading with some kind of global state or something. This is hideous
export default function CampaignsPage() {
  const theme = useTheme();
  const isMobile = !useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Container>
        <Box
          sx={{
            pt: { xs: 0, md: 8 },
            px: { xs: 2, sm: 4, md: 8, lg: 12 },
          }}
        >
          <Stack spacing={2}>
            <Typography
              sx={{
                fontFamily: outfit.style.fontFamily,
              }}
              fontWeight={BOLD_FONT_WEIGHT}
              align={'center'}
              variant={isMobile ? 'h4' : 'h3'}
            >
              Your Campaigns
            </Typography>
            <CampaignList />

            <Stack
              direction={isMobile ? 'column' : 'row'}
              spacing={2}
              justifyContent={'center'}
              sx={{
                width: '80%',
                position: 'fixed',
                bottom: 48,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <JoinCampaignModal />
              <CreateCampaignModal />
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
