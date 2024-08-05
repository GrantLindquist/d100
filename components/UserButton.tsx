'use client';
import { useUser } from '@/hooks/useUser';
import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { clearSession } from '@/utils/userSession';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useCampaign } from '@/hooks/useCampaign';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

// TODO: Redirect unauthenticated users
const UserButton = () => {
  const { user, signOutUser } = useUser();
  const { isUserDm } = useCampaign();

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
        {isUserDm && <WorkspacePremiumIcon />}
      </Button>
      <Menu anchorEl={anchor} open={open} onClose={handleClose}>
        <MenuItem>Manage players</MenuItem>
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </>
  );
};

export default UserButton;
