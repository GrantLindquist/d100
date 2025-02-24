'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import SpotifyPlayer from '@/components/SpotifyPlayer';

const SpotifyPlayerContext = createContext<{
  spotifyAuthenticated: boolean;
  displayPlayer: boolean;
  setDisplayPlayer: Function;
  toggleDisplayPlayerSetting: Function;
  activeUnitId: string | null;
  setActiveUnitId: Function;
}>({
  spotifyAuthenticated: false,
  displayPlayer: false,
  setDisplayPlayer: () => {
  },
  toggleDisplayPlayerSetting: () => {
  },
  activeUnitId: null,
  setActiveUnitId: () => {
  },
});

export const SpotifyPlayerProvider = ({ children }: {
  children: ReactNode;
}) => {
  const { user } = useUser();
  const { campaign } = useCampaign();

  const [displayPlayer, setDisplayPlayer] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [trackUris, setTrackUris] = useState<string[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    user && setSpotifyAuthenticated(Boolean(user.spotifyRefreshToken));
  }, [user?.id]);

  useEffect(() => {
    campaign &&
    setDisplayPlayer(Boolean(campaign.settings.displaySpotifyPlayer));
  }, [campaign?.id]);

  useEffect(() => {
    async function fetchSpotifyItems(unitId: string) {
      const unitDocSnap = await getDoc(doc(db, 'units', unitId));
      if (unitDocSnap.exists()) {
        const data = unitDocSnap.data();
        const spotifyIds = [];
        for (let item of data.spotifyItems) {
          spotifyIds.push(`spotify:${item.type}:${item.id}`);
        }
        setTrackUris(spotifyIds);
        setPlaying(true);
      }
    }

    activeUnitId && fetchSpotifyItems(activeUnitId);
  }, [activeUnitId]);

  const toggleDisplayPlayerSetting = async () => {
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
      value={{
        spotifyAuthenticated,
        displayPlayer,
        setDisplayPlayer,
        toggleDisplayPlayerSetting,
        activeUnitId,
        setActiveUnitId,
      }}
    >
      {spotifyAuthenticated && displayPlayer && (
        <SpotifyPlayer trackUris={trackUris} playing={playing} />
      )}
      {children}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayer = () => {
  const context = useContext(SpotifyPlayerContext);
  if (!context)
    throw new Error(
      'useSpotifyPlayer must be used inside SpotifyPlayerProvider',
    );
  return context;
};
