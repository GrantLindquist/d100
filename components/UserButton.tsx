'use client';
import { useUser } from '@/hooks/useUser';
import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { clearSession } from '@/utils/userSession';
import db, { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import LogoutIcon from '@mui/icons-material/Logout';
import { useCampaign } from '@/hooks/useCampaign';
import { arrayRemove, doc, runTransaction } from '@firebase/firestore';
import { UserBase } from '@/types/User';

const UserButton = () => {
  const router = useRouter();
  const { user, signOutUser, setListening } = useUser();
  const { campaign, isUserDm } = useCampaign();
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

  const handleLeaveCampaign = async (campaignId: string) => {
    if (user) {
      try {
        handleClose();
        await runTransaction(db, async (transaction) => {
          transaction.update(doc(db, 'campaigns', campaignId), {
            players: arrayRemove({
              id: user.id,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            } as UserBase),
          });
          transaction.update(doc(db, 'users', user.id), {
            campaignIds: arrayRemove(campaignId),
          });
        });
        router.push('/campaigns');
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while leaving the campaign.',
          isError: true,
          errorType: e.name,
        });
      }
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
        <MenuItem onClick={handleSignOut}>
          <LogoutIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Sign out
        </MenuItem>
        {campaign && !isUserDm && (
          <MenuItem onClick={() => handleLeaveCampaign(campaign.id)}>
            <LogoutIcon sx={{ width: 20, height: 20 }} />
            &nbsp; Leave Campaign
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default UserButton;
