'use client';
import UserButton from '@/components/UserButton';
import { Divider, Stack, Toolbar, Tooltip, useTheme } from '@mui/material';
import SettingsButton from '@/components/SettingsButton';
import { usePathname, useRouter } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/NotificationButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';
import Image from 'next/image';

// TODO: Make responsive
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
              : '#000000',
        }}
      >
        <Stack direction={'row'} spacing={2} sx={{ flexGrow: 1 }}>
          <Tooltip title={'View All Campaigns'}>
            <div
              onClick={() => router.push('/campaigns')}
              style={{ cursor: 'pointer' }}
            >
              <Image
                src="/d100.svg"
                width={26}
                height={26}
                alt="All Campaigns"
              />
            </div>
          </Tooltip>

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
