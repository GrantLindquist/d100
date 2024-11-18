'use client';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useUser } from '@/hooks/useUser';
import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import db, { auth } from '@/utils/firebase';
import { User, UserBase } from '@/types/User';
import { doc, setDoc } from '@firebase/firestore';
import { setUserSession } from '@/utils/userSession';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import { useEffect } from 'react';

export default function AuthPage() {
  const { user, setListening } = useUser();
  const { displayAlert } = useAlert();
  const router = useRouter();

  useEffect(() => {
    user && router.push('/campaigns');
  }, [user]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Define user values from Google
      console.log(result.user);
      const user = result.user;
      let session: UserBase = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        id: user.uid,
      };

      // If creating account, set new user doc with default values
      const additionalUserInfo = getAdditionalUserInfo(result);
      if (additionalUserInfo?.isNewUser) {
        session = {
          ...session,
          campaignIds: [],
          createdAt: Date.now(),
        } as User;
        await setDoc(doc(db, 'users', user.uid), session);
      }

      // Set session
      await setUserSession(session);
      setListening(true);
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while signing in.',
        isError: true,
        errorType: e.message,
      });
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      sx={{
        backgroundImage: 'url(/images/bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Card elevation={3} sx={{ p: 4, width: 400 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5">Sign In</Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Sign in with your Google account to start managing your campaigns.
            </Typography>
            <Button onClick={handleSignIn} variant="contained" fullWidth>
              Sign in with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
