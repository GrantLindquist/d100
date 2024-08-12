'use client';

import { Box, Button, Container, Stack } from '@mui/material';
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
import { setUserSession } from '@/utils/userSession';
import CreateCampaignModal from '@/components/modals/CreateCampaignModal';
import JoinCampaignModal from '@/components/modals/JoinCampaignModal';

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
    <Container>
      <Box
        sx={{
          pt: 16,
          px: { xs: 2, sm: 4, md: 8, lg: 12 },
          minHeight: '100vh',
        }}
      >
        {user ? (
          <Stack spacing={2} minWidth={350}>
            <CampaignList />

            <Stack
              direction={'row'}
              spacing={2}
              justifyContent={'center'}
              sx={{
                position: 'fixed',
                bottom: 48,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <JoinCampaignModal />
              <CreateCampaignModal />
            </Stack>
          </Stack>
        ) : (
          <Button onClick={handleSignIn}>Sign-in with Google</Button>
        )}
      </Box>
    </Container>
  );
}
