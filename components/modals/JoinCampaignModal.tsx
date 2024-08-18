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
import { arrayUnion, doc, getDoc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useUser } from '@/hooks/useUser';
import LoginIcon from '@mui/icons-material/Login';
import { useAlert } from '@/hooks/useAlert';

const JoinCampaignModal = () => {
  const [open, setOpen] = useState(false);

  const JoinCampaignForm = () => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [campaignId, setCampaignId] = useState('');
    const [displayErrorMsg, setDisplayErrorMsg] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        try {
          const campaignDocSnap = await getDoc(
            doc(db, 'campaigns', campaignId.trim())
          );
          if (campaignDocSnap.exists()) {
            await runTransaction(db, async (transaction) => {
              transaction.update(doc(db, 'campaigns', campaignId), {
                pendingPlayers: arrayUnion({
                  id: user.id,
                  displayName: user.displayName,
                  email: user.email,
                  photoURL: user.photoURL,
                }),
              });
            });
            setOpen(false);
            displayAlert({
              message: `Request to join "${campaignDocSnap.data().title}" sent.`,
            });
          } else {
            setDisplayErrorMsg(true);
          }
        } catch (e: any) {
          displayAlert({
            message: 'An error occurred while joining the campaign.',
            isError: true,
            errorType: e.name,
          });
        }
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setCampaignId(value);
    };

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
              error={displayErrorMsg}
              helperText={
                displayErrorMsg
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
