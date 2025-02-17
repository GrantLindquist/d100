'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import SpotifyPlayer from '@/components/SpotifyPlayer';

const SpotifyPlayerContext = createContext<{
  spotifyAuthenticated: boolean;
  displayPlayer: boolean;
  toggleDisplayPlayer: Function;
}>({
  spotifyAuthenticated: false,
  displayPlayer: false,
  toggleDisplayPlayer: () => {},
});

export const SpotifyPlayerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useUser();
  const { campaign } = useCampaign();

  const [displayPlayer, setDisplayPlayer] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [trackUris, setTrackUris] = useState<string[]>([
    'spotify:track:0RgjEkSbeuStKfT2Pa4Zai',
    'spotify:track:6Ljp2oy8zR8EhutqBdLYnt',
  ]);

  useEffect(() => {
    user && setSpotifyAuthenticated(Boolean(user.spotifyRefreshToken));
  }, [user?.id]);

  useEffect(() => {
    campaign &&
      setDisplayPlayer(Boolean(campaign.settings.displaySpotifyPlayer));
  }, [campaign?.id]);

  const toggleDisplayPlayer = async () => {
    await updateDoc(doc(db, 'campaigns', campaign!.id), {
      settings: {
        ...campaign!.settings,
        displaySpotifyPlayer: !displayPlayer,
      },
    });
    setDisplayPlayer(!displayPlayer);
  };

  return (
    <SpotifyPlayerContext.Provider
      value={{ spotifyAuthenticated, displayPlayer, toggleDisplayPlayer }}
    >
      {spotifyAuthenticated && displayPlayer && (
        <SpotifyPlayer trackUris={trackUris} />
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
