import { Box, Grid2, MenuItem, Modal, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import SpotifyItemList from '@/components/data-list/SpotifyItemList';
import { useAlert } from '@/hooks/useAlert';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { SpotifyBase } from '@/types/Spotify';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useCampaign } from '@/hooks/useCampaign';

const ThemeTrackModal = (props: { unitId: string }) => {
  const { displayAlert } = useAlert();
  const { spotifyAuthenticated } = useSpotifyPlayer();
  const { isUserDm } = useCampaign();

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
      <MenuItem disabled={!spotifyAuthenticated || !isUserDm} onClick={() => setOpen(true)}>
        Theme Track
      </MenuItem>
      <Modal open={open} onClose={handleUpdateTracks}>
        <Box sx={{
          ...MODAL_STYLE,
          width: '80%',
        }}>
          <Typography variant="h4" fontWeight={BOLD_FONT_WEIGHT} py={2} px={1}>
            Theme Tracks
          </Typography>
          <Grid2 container spacing={2}>
            <Grid2 size={6}>
              <Box sx={{
                maxHeight: '60vh',
                overflowY: 'auto',
              }}>
                <SpotifyItemList updateState={modifyTrackList} />
              </Box>
            </Grid2>
            <Grid2 size={6}>
              {spotifyItems.length > 0 && <>
                <Typography variant={'subtitle2'} color={'grey'} mt={-3}>
                  Saved Tracks
                </Typography>
                <SpotifyItemList isDeletingItem spotifyItems={spotifyItems} updateState={modifyTrackList} /></>}
            </Grid2>
          </Grid2>
        </Box>
      </Modal>
    </>);
};
export default ThemeTrackModal;