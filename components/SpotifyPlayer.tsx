import { getCookie } from '@/utils/cookie';
import { default as Player } from 'react-spotify-web-playback';
import { useEffect, useState } from 'react';
import { SpotifyAccessToken } from '@/types/User';
import { Box } from '@mui/material';

export const refreshAccessToken = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/music/refresh-token`,
  );
  return await response.json();
};

// TODO: Spotify auth fails when first logging in, but works after refreshing
const SpotifyPlayer = (props: { trackUris: string[]; playing: boolean }) => {
  const [accessToken, setAccessToken] = useState<SpotifyAccessToken | null>(
    null,
  );

  useEffect(() => {
    async function initAccessToken() {
      const token = await getCookie('spotify_access_token');
      if (Date.now() > token.obj.expiresAt) {
        const data = await refreshAccessToken();
        setAccessToken(data);
      } else {
        setAccessToken(token.obj);
      }
    }

    initAccessToken();
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        width: {
          xs: '100%',
          sm: '80%',
          md: '60%',
          lg: '50%',
        },
        transform: {
          sm: 'translateX(12%)',
          md: 'translateX(40%)',
          lg: 'translateX(50%)',
        },
        zIndex: 1000,
      }}
    >
      {accessToken && (
        <Player
          token={accessToken.token}
          uris={props.trackUris}
          callback={() => {
            if (Date.now() > accessToken.expiresAt) {
              refreshAccessToken();
            }
          }}
          play={props.playing}
          inlineVolume={false}
          styles={{
            activeColor: '#fff',
            bgColor: '#111',
            color: '#fff',
            loaderColor: '#fff',
            sliderColor: '#ff6a48',
            trackArtistColor: 'grey',
            trackNameColor: '#fff',
          }}
        />
      )}
    </Box>
  );
};
export default SpotifyPlayer;
