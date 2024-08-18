'use client';
import { useUser } from '@/hooks/useUser';
import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { clearSession } from '@/utils/userSession';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';

const UserButton = () => {
  const router = useRouter();
  const { user, signOutUser, setListening } = useUser();
  const { displayAlert } = useAlert();

  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleSignOut = async () => {
    try {
      handleClose();
      signOutUser();
      await signOut(auth);
      await clearSession();
      router.push('/');
      setListening(false);
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while signing out.',
        isError: true,
        errorType: e.name,
      });
    }
  };

  return (
    <>
      <Button onClick={handleClick}>
        <Avatar
          src={user?.photoURL ?? ''}
          alt={'Current User'}
          sx={{
            width: 30,
            height: 30,
            marginRight: 1,
          }}
        />
        {user?.displayName}
      </Button>
      <Menu anchorEl={anchor} open={open} onClose={handleClose}>
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </>
  );
};

export default UserButton;
