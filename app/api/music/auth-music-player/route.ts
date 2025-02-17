import { generateRandomString } from '@/utils/uuid';
import { NextResponse } from 'next/server';

// TODO: Make sure this works in prod (adjust urls for both envs)
export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope:
      'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control playlist-read-private playlist-read-collaborative user-read-playback-position streaming',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/music/register-token`,
    state: generateRandomString(16),
    show_dialog: 'true',
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
