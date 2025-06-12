'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import SpotifyPlayer, { refreshAccessToken } from '@/components/SpotifyPlayer';
import { getCookie } from '@/utils/cookie';
import { useAlert } from '@/hooks/useAlert';
import { SpotifyBase } from '@/types/Spotify';

type ActivePlayingCollection = {
  id: string | null;
  isPlaylistType: boolean;
}

// TODO: Add activeUnitId as a campaign attribute and listen to it w/ Firebase
const SpotifyPlayerContext = createContext<{
  spotifyAuthenticated: boolean;
  displayPlayer: boolean;
  setDisplayPlayer: Function;
  toggleDisplayPlayerSetting: Function;
  activePlayingCollection: ActivePlayingCollection;
  setActivePlayingCollection: (apc: ActivePlayingCollection) => void;
}>({
  spotifyAuthenticated: false,
  displayPlayer: false,
  setDisplayPlayer: () => {
  },
  toggleDisplayPlayerSetting: () => {
  },
  activePlayingCollection: { id: null, isPlaylistType: false },
  setActivePlayingCollection: () => {
  },
});

export const SpotifyPlayerProvider = ({ children }: {
  children: ReactNode;
}) => {
  const { user } = useUser();
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [displayPlayer, setDisplayPlayer] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [trackUris, setTrackUris] = useState<string[]>([]);
  const [activePlayingCollection, setActivePlayingCollection] = useState<ActivePlayingCollection>({
    id: null,
    isPlaylistType: false,
  });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    user && setSpotifyAuthenticated(Boolean(user.spotifyRefreshToken));
  }, [user?.id]);

  useEffect(() => {
    if (user?.spotifyRefreshToken) {
      campaign &&
      setDisplayPlayer(Boolean(campaign.settings.displaySpotifyPlayer));
    } else {
      setDisplayPlayer(false);
    }
  }, [campaign?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchItem(item: SpotifyBase, accessToken: { token: string }) {
      const spotifyIds = [];
      if (item.type === 'playlist') {
        let nextUrl = `https://api.spotify.com/v1/playlists/${item.id}?limit=100`;

        while (nextUrl) {
          const response = await fetch(nextUrl, {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + accessToken.token,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.statusText}`);
          }

          const playlistData = await response.json();
          for (let trackData of playlistData.tracks.items) {
            spotifyIds.push(`spotify:track:${trackData.track.id}`);
          }
          nextUrl = playlistData.tracks.next;
        }
      } else {
        spotifyIds.push(`spotify:track:${item.id}`);
      }
      return spotifyIds;
    }

    async function fetchSpotifyItems(id: string, isCustomPlaylistContext: boolean) {
      try {
        let accessToken;
        const tokenCookie = await getCookie('spotify_access_token');

        if (tokenCookie && tokenCookie.obj && tokenCookie.obj.expiresAt) {
          if (Date.now() > tokenCookie.obj.expiresAt) {
            accessToken = await refreshAccessToken();
          } else {
            accessToken = tokenCookie.obj;
          }

          let spotifyIds: string[] = [];
          const docSnap = await getDoc(doc(db, isCustomPlaylistContext ? 'playlists' : 'units', id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            for (let item of data.spotifyItems) {
              // Handle case where custom playlist is included in theme track context
              if ('spotifyItems' in item) {
                for (const spotifyItem of item.spotifyItems) {
                  const response = await fetchItem(spotifyItem, accessToken);
                  spotifyIds.push(...response);
                }
              } else {
                const response = await fetchItem(item, accessToken);
                spotifyIds.push(...response);
              }
            }

            if (!isCancelled) {
              setTrackUris(spotifyIds);
              setPlaying(true);
            }
          } else {
            if (!isCancelled) {
              setTrackUris([]);
              setPlaying(false);
            }
          }
        } else {
          displayAlert({
            errorType: 'No accessToken found',
            message: 'An error occurred while connecting to your Spotify.',
          });
        }
      } catch (error) {
        displayAlert({
          errorType: 'Fetch Error',
          message: 'An error occurred while fetching Spotify items.',
        });
      }
    }

    if (activePlayingCollection.id) {
      fetchSpotifyItems(activePlayingCollection.id, activePlayingCollection.isPlaylistType);
    } else {
      setTrackUris([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [activePlayingCollection.id, activePlayingCollection.isPlaylistType]);

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
        activePlayingCollection: activePlayingCollection,
        setActivePlayingCollection: setActivePlayingCollection,
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
