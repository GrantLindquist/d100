'use client';
import UserButton from '@/components/UserButton';
import { AppBar, Divider, Stack, Toolbar } from '@mui/material';
import Link from 'next/link';
import SettingsButton from '@/components/SettingsButton';
import NavBreadcrumbs from '@/components/NavBreadcrumbs';

const Navbar = () => {
  return (
    <AppBar position={'static'} sx={{ backgroundColor: 'black' }}>
      <Toolbar>
        <Stack direction={'row'} spacing={2} sx={{ flexGrow: 1 }}>
          <Link href={'/campaigns'}>All Campaigns</Link>
          <Divider orientation={'vertical'} flexItem />
          <NavBreadcrumbs />
        </Stack>
        <Stack direction={'row'} spacing={1}>
          <SettingsButton />
          <Divider orientation={'vertical'} flexItem />
          <UserButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
export default Navbar;
