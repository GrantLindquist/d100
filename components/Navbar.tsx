'use client';
import UserButton from '@/components/UserButton';
import { Divider, Stack, Toolbar, Typography, useTheme } from '@mui/material';
import SettingsButton from '@/components/SettingsButton';
import { usePathname, useRouter } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/NotificationButton';
import { LINK_STYLE } from '@/utils/globals';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';

const Navbar = () => {
  const { campaign, isUserDm } = useCampaign();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  if (pathname !== '/') {
    return (
      <Toolbar
        sx={{
          position: 'fixed',
          zIndex: 2,
          top: 0,
          width: '100%',
          backgroundColor:
            pathname.includes('articles') || pathname.includes('quests')
              ? '#111111'
              : 'none',
        }}
      >
        <Stack direction={'row'} spacing={2} sx={{ flexGrow: 1 }}>
          <Typography
            onClick={() => router.push('/campaigns')}
            sx={LINK_STYLE}
            color={theme.palette.primary.main}
          >
            All Campaigns
          </Typography>
          {campaign && (
            <>
              <Divider orientation={'vertical'} flexItem />
              <NavBreadcrumbs />
            </>
          )}
        </Stack>
        <Stack direction={'row'} spacing={1}>
          {isUserDm && (
            <>
              <NotificationButton />
              <SettingsButton />
              <Divider orientation={'vertical'} flexItem />
            </>
          )}
          <UserButton />
        </Stack>
      </Toolbar>
    );
  }
  return null;
};
export default Navbar;
