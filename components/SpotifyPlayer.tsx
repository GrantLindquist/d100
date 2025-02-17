import { getCookie } from '@/utils/cookie';
import { CallbackState, default as Player } from 'react-spotify-web-playback';
import { useEffect, useState } from 'react';
import { SpotifyAccessToken } from '@/types/User';
import { Box, useTheme } from '@mui/material';

const SpotifyPlayer = (props: { trackUris: string[] }) => {
  const theme = useTheme();
  console.log(theme.palette.primary.main);

  const [accessToken, setAccessToken] = useState<SpotifyAccessToken | null>(
    null,
  );
  const [playerState, setPlayerState] = useState<CallbackState | null>(null);

  useEffect(() => {
    async function initAccessToken() {
      const token = await getCookie('spotify_access_token');
      if (Date.now() > token.obj.expiresAt) {
        refreshToken();
      } else {
        setAccessToken(token.obj);
      }
    }

    initAccessToken();
  }, []);

  const refreshToken = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/music/refresh-token`,
    );
    const data = await response.json();
    console.log(data);
    setAccessToken(data);
  };

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
          callback={(state) => {
            if (Date.now() > accessToken.expiresAt) {
              refreshToken();
            }
            setPlayerState(state);
          }}
          inlineVolume={false}
          styles={{
            activeColor: '#fff',
            bgColor: '#111',
            color: '#fff',
            loaderColor: '#fff',
            sliderColor: theme.palette.primary.main,
            trackArtistColor: 'grey',
            trackNameColor: '#fff',
          }}
        />
      )}
    </Box>
  );
};
export default SpotifyPlayer;
