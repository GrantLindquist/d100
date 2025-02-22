'use client';
import UserButton from '@/components/buttons/UserButton';
import { Divider, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import SettingsButton from '@/components/buttons/SettingsButton';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/buttons/NotificationButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';
import Image from 'next/image';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { outfit } from '@/components/AppWrapper';
import SaveCheckLink from '@/components/SaveCheckLink';

// TODO: Make campaign-wide searchbar in here
// TODO: Make responsive
const Navbar = () => {
  const { campaign, isUserDm } = useCampaign();
  const pathname = usePathname();

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
              : '#010101',
        }}
      >
        <Stack
          direction={'row'}
          spacing={2}
          sx={{ flexGrow: 1, alignItems: 'center' }}
        >
          <Tooltip title={'View All Campaigns'}>
            <SaveCheckLink href={'/campaigns'}>
              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                <Image
                  src="/d100.png"
                  width={46}
                  height={30}
                  alt="All Campaigns"
                />
                <Typography
                  fontWeight={BOLD_FONT_WEIGHT}
                  variant={'h5'}
                  sx={{
                    fontFamily: outfit.style.fontFamily,
                  }}
                >
                  d100
                </Typography>
              </Stack>
            </SaveCheckLink>
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
