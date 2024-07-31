'use client';
import { useUser } from '@/hooks/useUser';
import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { clearSession } from '@/utils/userSession';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';

// TODO: Redirect unauthenticated users
const UserButton = () => {
  const { user, signOutUser } = useUser();

  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleSignOut = async () => {
    handleClose();
    signOutUser();
    await signOut(auth);
    await clearSession();
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        sx={{
          position: 'fixed',
          right: 0,
          marginY: 2,
          marginX: 4,
        }}
      >
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
        <MenuItem>Manage players</MenuItem>
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </div>
  );
};

export default UserButton;
