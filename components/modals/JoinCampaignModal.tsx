'use client';
import {
  Box,
  Button,
  InputLabel,
  Modal,
  Stack,
  TextField,
} from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';
import { FormEvent, useState } from 'react';
import { arrayUnion, doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useUser } from '@/hooks/useUser';
import LoginIcon from '@mui/icons-material/Login';

const JoinCampaignModal = () => {
  const [open, setOpen] = useState(false);

  const JoinCampaignForm = () => {
    const { user } = useUser();
    const [campaignId, setCampaignId] = useState('');
    const [displayAlert, setDisplayAlert] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        const campaignDocSnap = await getDoc(doc(db, 'campaigns', campaignId));
        if (campaignDocSnap.exists()) {
          await updateDoc(doc(db, 'users', user.id), {
            campaignIds: arrayUnion(campaignId),
          });
          setOpen(false);
        } else {
          setDisplayAlert(true);
        }
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setCampaignId(value);
    };

    // TODO: Route snackbar to new article and place outside of modal
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Stack direction={'column'} spacing={1}>
            <InputLabel>Campaign ID</InputLabel>
            <TextField
              variant={'outlined'}
              size={'small'}
              fullWidth
              onChange={handleInputChange}
              error={displayAlert}
              helperText={
                displayAlert
                  ? 'There is no existing campaign with this ID.'
                  : ''
              }
            />
            <Button type={'submit'}>Join Campaign</Button>
          </Stack>
        </form>
      </>
    );
  };

  return (
    <>
      <Button startIcon={<LoginIcon />} onClick={() => setOpen(true)}>
        Join Campaign
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <JoinCampaignForm />
        </Box>
      </Modal>
    </>
  );
};
export default JoinCampaignModal;
