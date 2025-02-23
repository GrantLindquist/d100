import { Box, Grid2, MenuItem, Modal, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import SpotifyItemList from '@/components/data-list/SpotifyItemList';
import { useAlert } from '@/hooks/useAlert';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { SpotifyBase } from '@/types/Spotify';

// TODO: Add drag and drop
const ThemeTrackModal = (props: { unitId: string }) => {
  const { displayAlert } = useAlert();

  const [open, setOpen] = useState(false);
  const [spotifyItems, setSpotifyItems] = useState<SpotifyBase[]>([]);

  useEffect(() => {
    async function fetchSpotifyItems() {
      const unitDocSnap = await getDoc(doc(db, 'units', props.unitId));
      if (unitDocSnap.exists()) {
        const data = unitDocSnap.data();
        data.spotifyItems && setSpotifyItems(data.spotifyItems);
      }
    }

    fetchSpotifyItems();
  }, []);

  const handleUpdateTracks = async () => {
    setOpen(false);
    if (spotifyItems.length > 0) {
      try {
        await updateDoc(doc(db, 'units', props.unitId), {
          spotifyItems: spotifyItems,
        });
      } catch (e: any) {
        displayAlert({
          isError: true,
          errorType: e.message,
          message: 'An error occurred while saving your Spotify tracks.',
        });
      }
    }
  };

  const modifyTrackList = (item: SpotifyBase, isDeletingTrack: boolean) => {
    if (isDeletingTrack) {
      setSpotifyItems([...spotifyItems].filter(i => i.id !== item.id));
    } else {
      let newItems = [...spotifyItems];
      newItems.push(item);
      setSpotifyItems(newItems);
    }
  };

  return (
    <>
      <MenuItem onClick={() => setOpen(true)}>
        Theme Track
      </MenuItem>
      <Modal open={open} onClose={handleUpdateTracks}>
        <Box sx={{
          ...MODAL_STYLE,
          width: '80%',
        }}>
          <Typography variant="h6" fontWeight={BOLD_FONT_WEIGHT}>
            Add Theme Track
          </Typography>
          <Grid2 container spacing={2}>
            <Grid2 size={5}>
              <Box sx={{
                maxHeight: '60vh',
                overflowY: 'auto',
              }}>
                <SpotifyItemList updateState={modifyTrackList} />
              </Box>
            </Grid2>
            <Grid2 size={7}>
              <SpotifyItemList isDeletingItem spotifyItems={spotifyItems} updateState={modifyTrackList} />
            </Grid2>
          </Grid2>
        </Box>
      </Modal>
    </>);
};
export default ThemeTrackModal;