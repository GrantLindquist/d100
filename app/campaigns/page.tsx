'use client';

import { Button, Container, Stack } from '@mui/material';
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

// TODO: Change [id] to [campaignId]
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

  // TODO: Find better way of sizing container to screen
  return (
    <Container
      sx={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {user ? (
        <Stack spacing={2} width={'70%'} minWidth={350}>
          <CampaignList />

          <Stack direction={'row'} spacing={2} justifyContent={'center'}>
            <JoinCampaignModal />
            <CreateCampaignModal />
          </Stack>
        </Stack>
      ) : (
        <Button onClick={handleSignIn}>Sign-in with Google</Button>
      )}
    </Container>
  );
}
