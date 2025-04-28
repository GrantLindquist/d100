'use client';
import { Box, Checkbox, Stack, Typography } from '@mui/material';
import { useUser } from '@/hooks/useUser';
import { getAdditionalUserInfo, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import db, { auth } from '@/utils/firebase';
import { User, UserBase } from '@/types/User';
import { doc, setDoc } from '@firebase/firestore';
import { setCookie } from '@/utils/cookie';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import { useEffect, useState } from 'react';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { outfit } from '@/components/AppWrapper';
import RoundButton from '@/components/buttons/RoundButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ThemeTooltip from '@/components/ThemeTooltip';

export default function AuthPage() {
  const { user, setListening } = useUser();
  const { displayAlert } = useAlert();
  const router = useRouter();
  const [cookieConsent, setCookieConsent] = useState(false);

  useEffect(() => {
    user && router.push('/campaigns');
  }, [user]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Define user values from Google
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
      await setCookie('session', session);
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
      sx={{
        height: '100vh',
        width: '100vw',
        backgroundImage: 'url(/d100-signin.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box maxWidth={{ xs: '80%', md: '60%' }} pt={'17%'} px={'10%'}>
        <Box pb={1}>
          <Typography
            variant={'h1'}
            sx={{
              fontFamily: outfit.style.fontFamily,
            }}
            fontWeight={BOLD_FONT_WEIGHT}
          >
            d100
          </Typography>
          <Typography pb={4} color="grey">
            D&D campaign wiki creator, note tracker, information repository, etc.
            etc. etc. Whatever you want to use it for, really.
          </Typography>
          <RoundButton disabled={!cookieConsent} onClick={handleSignIn}>Sign In With Google</RoundButton>
          <Stack direction={'row'} alignItems={'center'} pt={1} sx={{ cursor: 'pointer' }}
                 onClick={() => setCookieConsent(!cookieConsent)}>
            <Checkbox
              checked={cookieConsent}
            />
            <Typography variant={'subtitle2'} color={'grey'} pr={1}>
              Consent to session cookies
            </Typography>
            <ThemeTooltip
              title={'Session cookies are required for the app to function. d100 does not store any sensitive data.'}>
              <InfoOutlinedIcon
                sx={{ color: 'grey', height: 20, width: 20 }}
              />
            </ThemeTooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
