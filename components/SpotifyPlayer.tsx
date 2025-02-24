import { getCookie } from '@/utils/cookie';
import { default as Player, spotifyApi } from 'react-spotify-web-playback';
import { useEffect, useState } from 'react';
import { SpotifyAccessToken } from '@/types/User';
import { Box } from '@mui/material';

export const refreshAccessToken = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/music/refresh-token`,
  );
  return await response.json();
};

const SpotifyPlayer = (props: { trackUris: string[]; playing: boolean }) => {
  const [accessToken, setAccessToken] = useState<SpotifyAccessToken | null>(
    null,
  );

  useEffect(() => {
    async function initAccessToken() {
      const token = await getCookie('spotify_access_token');
      if (!token || Date.now() > token.obj.expiresAt) {
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
        bottom: -1,
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
        border: 'solid 2px #222',
        borderTopRightRadius: 3,
        borderTopLeftRadius: 3,
        zIndex: 1000,
      }}
    >
      {accessToken && (
        <Player
          token={accessToken.token}
          uris={props.trackUris}
          callback={async (state) => {
            if (Date.now() > accessToken.expiresAt) {
              const data = await refreshAccessToken();
              setAccessToken(data);
            }
            if (state.currentDeviceId !== '' && state.repeat !== 'context') {
              await spotifyApi.repeat(accessToken.token, 'context');
            }
          }}
          play={props.playing}
          inlineVolume={false}
          styles={{
            activeColor: '#fff',
            bgColor: '#111',
            color: '#fff',
            loaderColor: '#ff6a48',
            sliderColor: '#ff6a48',
            sliderHandleColor: '#fff',
            trackArtistColor: 'grey',
            trackNameColor: '#fff',
          }}
        />
      )}
    </Box>
  );
};
export default SpotifyPlayer;
