'use client';

import { Box, Button, Divider, Stack } from '@mui/material';
import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import db, { auth } from '@/utils/firebase';
import { UserFunctional, UserSession } from '@/types/User';
import { doc, setDoc } from '@firebase/firestore';
import { useUser } from '@/hooks/useUser';
import { useEffect } from 'react';
import CampaignList from '@/components/CampaignList';
import LoginIcon from '@mui/icons-material/Login';
import AddIcon from '@mui/icons-material/Add';
import { setUserSession } from '@/utils/userSession';

export default function CampaignsPage() {
  const { user, fetchUser } = useUser();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      // Add user to firestore if it does not exist
      .then(async (result) => {
        const user = result.user;
        const sessionUser: UserSession = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          id: user.uid,
        };
        await setUserSession(sessionUser);
        fetchUser();

        const additionalUserInfo = getAdditionalUserInfo(result);
        if (additionalUserInfo?.isNewUser) {
          const userDoc = doc(db, 'users', user.uid);
          await setDoc(userDoc, {
            ...sessionUser,
            createdAt: Date.now(),
            campaignIds: [],
          } as UserFunctional);
        }
      });
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {user ? (
        <Stack direction={'column'} spacing={2} width={'40%'} minWidth={350}>
          <CampaignList />
          <Divider />
          <Stack direction={'row'} spacing={2} justifyContent={'center'}>
            <Button startIcon={<LoginIcon />}>Join Campaign</Button>
            <Button startIcon={<AddIcon />}>Create Campaign</Button>
          </Stack>
        </Stack>
      ) : (
        <Button onClick={handleSignIn}>Sign-in with Google</Button>
      )}
    </Box>
  );
}
