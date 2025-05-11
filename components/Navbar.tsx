'use client';
import UserButton from '@/components/buttons/UserButton';
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Menu,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SettingsButton from '@/components/buttons/SettingsButton';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import NotificationButton from '@/components/buttons/NotificationButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';
import Image from 'next/image';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { outfit } from '@/components/AppWrapper';
import SaveCheckLink from '@/components/SaveCheckLink';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';

export const NavbarContainer = () => {
  const theme = useTheme();
  const isCondensed = !useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <>
      <Box sx={{ paddingTop: '64px' }}></Box>
      <AppBar position="static" elevation={1}>
        <Toolbar
          sx={{
            position: 'fixed',
            zIndex: 2,
            top: 0,
            width: '100%',
            backgroundColor: '#111',
          }}
        >
          {isCondensed ? <NavbarCondensed /> : <Navbar />}
        </Toolbar>
      </AppBar>
    </>
  );
};

const NavbarBrand = () => {
  return <Tooltip title={'View All Campaigns'}>
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
  </Tooltip>;
};

const Navbar = () => {
  const { campaign, isUserDm } = useCampaign();
  const pathname = usePathname();

  if (pathname !== '/') {
    return (
      <>
        <Stack
          direction={'row'}
          spacing={2}
          sx={{ flexGrow: 1, alignItems: 'center' }}
        >
          <NavbarBrand />

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
      </>
    );
  }
  return null;
};

const NavbarCondensed = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <NavbarBrand />
      <Box flexGrow={1}></Box>
      <Stack direction={'row'} spacing={1} alignItems="center">
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <Stack direction={'column'} p={1}>
            <NotificationButton includeText />
            <SettingsButton includeText />
            <UserButton />
          </Stack>
        </Menu>
      </Stack>
    </>
  );
};

export default NavbarCondensed;