import UserButton from '@/components/UserButton';
import { AppBar, Stack, Toolbar } from '@mui/material';
import Link from 'next/link';

const Navbar = () => {
  return (
    <AppBar position={'static'}>
      <Toolbar>
        <Stack direction={'row'} spacing={3} sx={{ flexGrow: 1 }}>
          <Link href={'/campaigns'}>Campaigns</Link>
        </Stack>
        <UserButton />
      </Toolbar>
    </AppBar>
  );
};
export default Navbar;
