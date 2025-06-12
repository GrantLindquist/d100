'use client';
import { getCookie } from '@/utils/cookie';
import { default as Player, spotifyApi } from 'react-spotify-web-playback';
import { useEffect, useRef, useState } from 'react';
import { SpotifyAccessToken } from '@/types/User';
import { Box } from '@mui/material';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

// TODO: Create more effective way of sharing multiple spotify tracks between articles
export const refreshAccessToken = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/music/refresh-token`,
  );
  return await response.json();
};

const SpotifyPlayer = (props: { trackUris: string[]; playing: boolean }) => {
  const [accessToken, setAccessToken] = useState<SpotifyAccessToken | null>(null);
  const [hovering, setHovering] = useState(true);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<any | null>(null);

  const { displayPlayer } = useSpotifyPlayer();

  useEffect(() => {
    const tokenRef = { current: null as SpotifyAccessToken | null };
    let interval: NodeJS.Timeout;

    async function fetchInitialToken() {
      const token = await getCookie('spotify_access_token');
      let usableToken = token?.obj;
      if (!token || Date.now() > token.obj.expiresAt) {
        usableToken = await refreshAccessToken();
      }
      tokenRef.current = usableToken;
      setAccessToken(usableToken);
    }

    fetchInitialToken();

    interval = setInterval(async () => {
      const currentToken = tokenRef.current;
      if (!currentToken) return;

      const timeLeft = currentToken.expiresAt - Date.now();
      if (timeLeft < 60 * 1000) {
        const newToken = await refreshAccessToken();
        tokenRef.current = newToken;
        setAccessToken(newToken);
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Temporarily displays player on-mount
  useEffect(() => {
    setHovering(true);
    setTimeout(() => {
      setHovering(false);
    }, 500);
  }, [displayPlayer]);

  useEffect(() => {
    if (!hovering) {
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 4000);
    } else {
      clearTimeout(hideTimeoutRef.current!);
      setVisible(true);
    }

    return () => {
      clearTimeout(hideTimeoutRef.current!);
    };
  }, [hovering]);

  return (
    <>
      <Box
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
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
          height: '90px',
          zIndex: 20,
        }}
      />

      {/* Spotify Player */}
      <Box
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
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
          zIndex: 21,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.5s ease',
        }}
      >
        {accessToken && (
          <Player
            name={'d100'}
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
    </>
  );
};

export default SpotifyPlayer;
