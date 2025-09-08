'use client';
import { useUser } from '@/hooks/useUser';
import { Avatar, Button, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { clearCookie } from '@/utils/cookie';
import db, { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import LogoutIcon from '@mui/icons-material/Logout';
import ClearIcon from '@mui/icons-material/Clear';
import { useCampaign } from '@/hooks/useCampaign';
import { arrayRemove, doc, runTransaction, updateDoc } from '@firebase/firestore';
import { UserBase } from '@/types/User';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import Image from 'next/image';

const UserButton = () => {
  const router = useRouter();
  const { user, signOutUser, setListening } = useUser();
  const { campaign, isUserDm } = useCampaign();
  const { displayAlert } = useAlert();
  const { spotifyAuthenticated } = useSpotifyPlayer();

  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleConnectSpotify = async () => {
    try {
      window.location.href = '/api/music/auth-music-player';
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while connecting your Spotify account.`,
        errorType: e.message,
      });
    }
  };

  const handleSignOut = async () => {
    try {
      handleClose();
      signOutUser();
      setListening(false);
      await updateDoc(doc(db, 'users', user!.id), {
        spotifyRefreshToken: null,
      });
      await signOut(auth);
      await clearCookie('session');
      await clearCookie('spotify_access_token');
      router.push('/');
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while signing out.',
        errorType: e.message,
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
          errorType: e.message,
        });
      }
    }
  };

  return (
    <>
      {user && (
        <>
          <Button onClick={handleClick}>
            <Avatar
              src={user?.photoURL ?? '-'}
              alt={'Current User'}
              sx={{
                width: 30,
                height: 30,
                marginRight: 1,
              }}
            >
              {user?.displayName ? user.displayName[0] : ''}
            </Avatar>
            <Typography color={'white'} variant={'subtitle2'}>
              {user?.displayName}
            </Typography>
          </Button>
          <Menu
            anchorEl={anchor}
            open={open}
            onClose={handleClose}
            disableScrollLock
          >
            <MenuItem
              disabled={spotifyAuthenticated}
              onClick={handleConnectSpotify}
            >
              <Stack direction={'row'} alignItems={'center'}>
                <Image src={'/spotify.svg'} alt={'Spotify Logo'} width={22} height={22} style={{ marginRight: 6 }} />
                {spotifyAuthenticated ? 'Connected' : 'Connect Spotify'}
              </Stack>
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <LogoutIcon sx={{ width: 20, height: 20 }} />
              &nbsp; Sign out
            </MenuItem>
            {campaign && !isUserDm && (
              <MenuItem onClick={() => handleLeaveCampaign(campaign.id)}>
                <ClearIcon sx={{ width: 20, height: 20 }} />
                &nbsp; Leave Campaign
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </>
  );
};

export default UserButton;
