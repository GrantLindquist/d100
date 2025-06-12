import { useEffect, useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Playlist } from '@/types/Spotify';
import { useCampaign } from '@/hooks/useCampaign';
import { useAlert } from '@/hooks/useAlert';
import { arrayRemove, collection, doc, onSnapshot, query, updateDoc, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import PlaylistModal from '@/components/modals/PlaylistModal';
import { SmallIconButton } from '@/components/buttons/SmallIconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { default as NextImage } from 'next/image';

const CustomPlaylistButton = () => {
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();
  const { activePlayingCollection, setActivePlayingCollection } = useSpotifyPlayer();

  const [anchor, setAnchor] = useState(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      const q = query(collection(db, 'playlists'), where('id', 'in', campaign!.playlistIds));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let playlists: Playlist[] = [];
        querySnapshot.forEach((doc) => {
          playlists.push(doc.data() as Playlist);
        });
        setPlaylists(playlists);
      });
      return () => unsubscribe();
    }

    campaign?.playlistIds && campaign.playlistIds.length > 0 && fetchPlaylists();
  }, [campaign?.id]);


  useEffect(() => {
    if (!anchor) {
      setSelectedPlaylist(null);
    }
  }, [anchor]);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleDeletePlaylist = async () => {
    try {
      if (selectedPlaylist) {
        await updateDoc(doc(db, 'campaigns', campaign!.id), {
          playlists: arrayRemove(selectedPlaylist),
        });
      }
    } catch (e: any) {
      displayAlert({
        errorType: e.message,
        message: 'An error occurred while deleting your playlist.',
      });
    }
  };

  return (
    <>
      <Tooltip title={'Custom Playlists'}>
        <IconButton onClick={handleClick}>
          <MusicNoteIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {playlists.length > 0 ? (
          <Box minWidth={200}>
            {playlists.map((playlist) => (
              <Stack
                key={playlist.id}
                direction="row"
                spacing={1}
                onClick={() => setSelectedPlaylist(playlist.id !== selectedPlaylist?.id ? playlist : null)}
                sx={{
                  pl: 3,
                  pr: 1.5,
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: playlist.id === selectedPlaylist?.id ? 'rgba(255, 255, 255, .1)' : 'transparent',
                }}
              >
                {
                  activePlayingCollection.id === playlist.id &&
                  <NextImage src={'/spotify_playing.svg'} width={16} height={16} style={{ paddingBottom: 4 }}
                             alt={'Playing Music'} />
                }
                <Typography
                  sx={{
                    py: 0.2,
                    flexGrow: 2,
                    maxWidth: '250px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {playlist.title}&nbsp;
                </Typography>
              </Stack>
            ))}
            <Stack px={2} pt={.5} direction={'row'} spacing={.5}>
              <PlaylistModal playlist={null} trigger={<SmallIconButton icon={<AddIcon />} onClick={() => {
              }} />} />
              <div style={{ pointerEvents: selectedPlaylist ? 'auto' : 'none' }}>
                <PlaylistModal playlist={selectedPlaylist}
                               trigger={<SmallIconButton icon={<EditIcon />} disabled={!selectedPlaylist}
                                                         onClick={() => {
                                                         }} />} />
              </div>
              <SmallIconButton disabled={!selectedPlaylist}
                               icon={selectedPlaylist?.id !== activePlayingCollection.id ? <PlayArrowIcon /> :
                                 <StopIcon />}
                               onClick={() => setActivePlayingCollection({
                                 id: selectedPlaylist?.id !== activePlayingCollection.id ? selectedPlaylist!.id : null,
                                 isPlaylistType: true,
                               })} />
              <Box flexGrow={1}></Box>
              <SmallIconButton disabled={!selectedPlaylist} icon={<DeleteIcon />} onClick={handleDeletePlaylist} />
            </Stack>
          </Box>
        ) : (
          <PlaylistModal playlist={null} trigger={<MenuItem>
            <AddIcon />
            &nbsp;Add Custom Playlist
          </MenuItem>} />
        )}
      </Menu>
    </>
  );
};
export default CustomPlaylistButton;
