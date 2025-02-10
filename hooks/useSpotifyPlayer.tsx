'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { Box } from '@mui/material';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';

const SpotifyPlayerContext = createContext<{
  spotifyAuthenticated: boolean;
  displayPlayer: boolean;
  setDisplayPlayer: Function;
}>({
  spotifyAuthenticated: false,
  displayPlayer: false,
  setDisplayPlayer: () => {},
});

export const SpotifyPlayerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useUser();
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [displayPlayer, setDisplayPlayer] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);

  useEffect(() => {
    user && setSpotifyAuthenticated(Boolean(user.spotifyRefreshToken));
  }, [user?.id]);

  useEffect(() => {
    campaign &&
      setDisplayPlayer(Boolean(campaign.settings.displaySpotifyPlayer));
  }, [campaign?.id]);

  return (
    <SpotifyPlayerContext.Provider
      value={{ spotifyAuthenticated, displayPlayer, setDisplayPlayer }}
    >
      {spotifyAuthenticated && displayPlayer && (
        <Box
          sx={{
            backgroundColor: 'white',
            width: 200,
            height: 100,
            position: 'absolute',
            bottom: 10,
            left: 10,
          }}
        ></Box>
      )}
      {children}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayer = () => {
  const context = useContext(SpotifyPlayerContext);
  if (!context)
    throw new Error(
      'useSpotifyPlayer must be used inside SpotifyPlayerProvider'
    );
  return context;
};
