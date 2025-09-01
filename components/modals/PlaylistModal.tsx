import { Box, Button, Grid2, Modal, Stack, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import SpotifyItemList from '@/components/data-list/SpotifyItemList';
import { useAlert } from '@/hooks/useAlert';
import { Playlist, SpotifyBase } from '@/types/Spotify';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { generateUUID } from '@/utils/uuid';
import { useCampaign } from '@/hooks/useCampaign';
import { arrayMove } from '@dnd-kit/sortable';

const defaultPlaylist = {
  id: '',
  title: '',
  spotifyItems: [],
};

// TODO: Find a way to combine this component with ThemeTrackModal
const PlaylistModal = (props: { playlist: Playlist | null, trigger: ReactNode }) => {
  const { displayAlert } = useAlert();
  const { campaign } = useCampaign();

  const [open, setOpen] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist>(defaultPlaylist);

  useEffect(() => {
    if (props.playlist) {
      setPlaylist(props.playlist);
    } else {
      setPlaylist(defaultPlaylist);
    }
  }, [props.playlist]);

  const handleSavePlaylist = async () => {
    setOpen(false);
    try {
      await runTransaction(db, async (transaction) => {
        if (!props.playlist) {
          const playlistId = generateUUID();
          transaction.update(doc(db, 'campaigns', campaign!.id), {
            playlistIds: arrayUnion(playlistId),
          });
          transaction.set(doc(db, 'playlists', playlistId), {
            ...playlist,
            id: playlistId,
          });
        } else {
          transaction.set(doc(db, 'playlists', playlist.id), {
            ...playlist,
          });
        }
      });
      displayAlert({
        message: props.playlist ? `Changes to ${playlist.title} have been saved.` : `${playlist.title} has been created.`,
      });
    } catch (e: any) {
      displayAlert({
        errorType: e.message,
        message: 'An error occurred while saving your Spotify tracks.',
      });
    }
  };

  const modifyTrackList = (item: SpotifyBase, deleteIndex: number | null) => {
    let newItems = [...playlist.spotifyItems];
    if (deleteIndex) {
      newItems.splice(deleteIndex, 1);
    } else {
      newItems.push(item);
    }
    setPlaylist({
      ...playlist,
      spotifyItems: newItems,
    });
  };

  const sortTrackList = (activeId: string, overId: string) => {
    const currentList = playlist.spotifyItems;
    const oldIndex = currentList.findIndex((item) => item.id === activeId);
    const newIndex = currentList.findIndex((item) => item.id === overId);

    const newItems = arrayMove(currentList, oldIndex, newIndex);
    setPlaylist({
      ...playlist,
      spotifyItems: newItems,
    });
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {props.trigger}
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{
          ...MODAL_STYLE,
          width: { sm: '90%', md: '75%', lg: '60%' },
        }}>
          <Box py={2} px={1}>
            <Typography variant="subtitle2" sx={{ color: 'grey' }}>
              Custom Playlist
            </Typography>
            <input
              value={playlist.title}
              onChange={(e) => setPlaylist({
                ...playlist,
                title: e.target.value,
              })}
              placeholder={'Playlist Title'}
              autoFocus
              style={{
                all: 'unset',
                fontSize: '3rem',
                height: '3.7rem',
                fontWeight: BOLD_FONT_WEIGHT,
                width: '100%',
                cursor: 'text',
              }}
            />
          </Box>
          <Grid2 container spacing={2}>
            <Grid2 size={7}>
              <Box sx={{
                maxHeight: '60vh',
                overflowY: 'auto',
              }}>
                <SpotifyItemList updateState={modifyTrackList} />
              </Box>
            </Grid2>
            <Grid2 size={5}>
              {playlist.spotifyItems.length > 0 && <>
                <Typography variant={'subtitle2'} color={'grey'} mt={-3}>
                  Saved Tracks
                </Typography>
                <SpotifyItemList isDeletingItem items={playlist.spotifyItems}
                                 updateState={modifyTrackList} sortTrackList={sortTrackList} /></>}
            </Grid2>
          </Grid2>
          <Stack direction={'row'}>
            <Box flexGrow={1}></Box>
            <Button onClick={handleSavePlaylist}
                    disabled={playlist.title.length === 0 || playlist.spotifyItems.length === 0}>Save Playlist</Button>
          </Stack>
        </Box>
      </Modal>
    </>);
};
export default PlaylistModal;