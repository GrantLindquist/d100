import 'server-only';

import { NextResponse } from 'next/server';
import { getCookie, setCookie } from '@/utils/cookie';
import { SpotifyAccessToken, UserBase } from '@/types/User';
import { adminDB } from '@/utils/firebase-admin';

export async function GET() {
  const userSession: { obj: UserBase } = await getCookie('session');
  let data = undefined;
  try {
    const userDoc = await adminDB
      .collection('users')
      .doc(userSession.obj.id)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json({
        status: '404',
        message: 'User not found',
      });
    }
    if (!userDoc.data()!.spotifyRefreshToken) {
      return NextResponse.json({
        status: '404',
        message: 'User refresh token not found',
      });
    }
    data = userDoc.data();
  } catch (e) {
    return NextResponse.json(e);
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: data!.spotifyRefreshToken,
    }),
  };
  const tokenResponse = await fetch(
    'https://accounts.spotify.com/api/token',
    options
  );
  const tokenData = await tokenResponse.json();
  await setCookie('spotify_access_token', {
    token: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  } as SpotifyAccessToken);
  return NextResponse.json(tokenData.access_token);
}
