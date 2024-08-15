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
import Link from 'next/link';

export default function AuthPage() {
  const { user, setListening } = useUser();
  const router = useRouter();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(async (result) => {
      // Define user values from google
      const user = result.user;
      let session = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        id: user.uid,
      } as UserBase;
      // If creating account, set new user doc w/ default values
      const additionalUserInfo = getAdditionalUserInfo(result);
      if (additionalUserInfo?.isNewUser) {
        session = {
          ...session,
          campaignIds: [],
          createdAt: Date.now(),
        } as User;
        await setDoc(doc(db, 'users', user.uid), session);
      } else {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        session = {
          ...session,
          campaignIds: userDocSnap.data()?.campaignIds ?? [],
          createdAt: userDocSnap.data()?.createdAt ?? Date.now(),
        } as User;
      }
      // Set session
      await setUserSession(session);
      setListening(true);
      router.push('/campaigns');
    });
  };

  return (
    <Box p={5}>
      {user ? (
        <>
          <Typography>You are already signed in. </Typography>
          <Link href={'/campaigns'}>Go to your Campaigns</Link>
        </>
      ) : (
        <Button onClick={handleSignIn}>Sign-in with Google</Button>
      )}
    </Box>
  );
}
