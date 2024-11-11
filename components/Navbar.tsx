'use client';
import UserButton from '@/components/UserButton';
import {
  AppBar,
  Divider,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import SettingsButton from '@/components/SettingsButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';
import { usePathname, useRouter } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/NotificationButton';
import { LINK_STYLE } from '@/utils/globals';

const Navbar = () => {
  const { campaign, isUserDm } = useCampaign();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  if (pathname !== '/') {
    return (
      <AppBar position={'fixed'} sx={{ backgroundColor: 'black' }}>
        <Toolbar>
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
      </AppBar>
    );
  }
  return null;
};
export default Navbar;
