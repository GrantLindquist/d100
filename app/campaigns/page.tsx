import { Box, Container, Stack } from '@mui/material';
import CampaignList from '@/components/data-list/CampaignList';
import CreateCampaignModal from '@/components/modals/CreateCampaignModal';
import JoinCampaignModal from '@/components/modals/JoinCampaignModal';

export default function CampaignsPage() {
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
            <CampaignList />

            <Stack
              direction={'row'}
              spacing={2}
              justifyContent={'center'}
              sx={{
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
