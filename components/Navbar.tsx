'use client';
import UserButton from '@/components/UserButton';
import { AppBar, Divider, Stack, Toolbar } from '@mui/material';
import Link from 'next/link';
import SettingsButton from '@/components/SettingsButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/NotificationButton';

const Navbar = () => {
  const { campaign, isUserDm } = useCampaign();
  const pathname = usePathname();
  if (pathname !== '/') {
    return (
      <AppBar position={'fixed'} sx={{ backgroundColor: 'black' }}>
        <Toolbar>
          <Stack direction={'row'} spacing={2} sx={{ flexGrow: 1 }}>
            <Link href={'/campaigns'}>All Campaigns</Link>
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
