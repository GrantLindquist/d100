import { NextRequest, NextResponse } from 'next/server';
import { getCookie, setCookie } from '@/utils/cookie';
import { adminDB } from '@/utils/firebase-admin';
import { UserBase } from '@/types/User';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (state === null) {
    throw new Error('Invalid state -- access denied.');
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/music/register-token`;
  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      code: code!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  };
  try {
    const tokenResponse = await fetch(
      'https://accounts.spotify.com/api/token',
      authOptions
    );
    const tokenData = await tokenResponse.json();
    await setCookie('spotify_access_token', tokenData.access_token);

    const userSession: { obj: UserBase } = await getCookie('session');
    await adminDB
      .collection('users')
      .doc(userSession.obj.id)
      .update({ spotifyRefreshToken: tokenData.refresh_token });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/campaigns`
    );
  } catch (e) {
    return NextResponse.json(e);
  }
}
