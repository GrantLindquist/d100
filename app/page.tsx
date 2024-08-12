'use client';
import { Box, Button, Typography } from '@mui/material';
import { useUser } from '@/hooks/useUser';
import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import db, { auth } from '@/utils/firebase';
import { User, UserBase } from '@/types/User';
import { doc, getDoc, setDoc } from '@firebase/firestore';
import { setUserSession } from '@/utils/userSession';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const { user, fetchUser } = useUser();
  const router = useRouter();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(async (result) => {
      // Define user values from google
      const user = result.user;
      let session: UserBase = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        id: user.uid,
      };
      // If creating account, set new user doc w/ default values
      const additionalUserInfo = getAdditionalUserInfo(result);
      if (additionalUserInfo?.isNewUser) {
        session = {
          ...session,
          createdAt: Date.now(),
          campaignIds: [],
        } as User;
        await setDoc(doc(db, 'users', user.uid), session);
      }
      // If signing in, fetch values from
      else {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        if (userDocSnap.exists()) {
          session = {
            ...session,
            createdAt: userDocSnap.data().createdAt,
            campaignIds: userDocSnap.data().campaignIds,
          } as User;
        }
        // Set session
        await setUserSession(session);
        fetchUser();
        router.push('/campaigns');
      }
    });
  };

  return (
    <Box p={10}>
      {user ? (
        <Typography>you are signed in already</Typography>
      ) : (
        <Button onClick={handleSignIn}>Sign-in with Google</Button>
      )}
    </Box>
  );
}
