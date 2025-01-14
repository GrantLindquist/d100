'use client';
import {
  Box,
  Button,
  InputLabel,
  Modal,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { MODAL_STYLE, PLAYER_INVITATIONS_FEATURE_FLAG } from '@/utils/globals';
import { FormEvent, useState } from 'react';
import { arrayUnion, doc, getDoc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useUser } from '@/hooks/useUser';
import LoginIcon from '@mui/icons-material/Login';
import { useAlert } from '@/hooks/useAlert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RoundButton from '@/components/buttons/RoundButton';

const JoinCampaignModal = () => {
  const [open, setOpen] = useState(false);

  const JoinCampaignForm = () => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [campaignId, setCampaignId] = useState('');
    const [displayErrorMsg, setDisplayErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        const id = campaignId.trim();
        if (!user.campaignIds.includes(id)) {
          try {
            const campaignDocSnap = await getDoc(doc(db, 'campaigns', id));
            if (campaignDocSnap.exists()) {
              await runTransaction(db, async (transaction) => {
                transaction.update(doc(db, 'campaigns', id), {
                  [PLAYER_INVITATIONS_FEATURE_FLAG
                    ? 'pendingPlayers'
                    : 'players']: arrayUnion({
                    id: user.id,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                  }),
                });
                if (!PLAYER_INVITATIONS_FEATURE_FLAG) {
                  transaction.update(doc(db, 'users', user.id), {
                    campaignIds: arrayUnion(id),
                  });
                }
              });
              setOpen(false);
              displayAlert({
                message: `Request to join "${campaignDocSnap.data().title}" sent.`,
              });
            } else {
              setDisplayErrorMsg('There is no existing campaign of this ID');
            }
          } catch (e: any) {
            displayAlert({
              message: 'An error occurred while joining the campaign.',
              isError: true,
              errorType: e.message,
            });
          }
        } else {
          setDisplayErrorMsg('You are already a member of this campaign.');
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
            <Stack direction={'row'} spacing={1} alignItems={'center'}>
              <InputLabel>Campaign ID</InputLabel>
              <Tooltip
                title={`A campaign's ID can be found by accessing Settings > Invite Players inside a campaign.`}
                placement={'top'}
              >
                <InfoOutlinedIcon
                  sx={{ color: 'grey', height: 20, width: 20 }}
                />
              </Tooltip>
            </Stack>
            <TextField
              variant={'outlined'}
              size={'small'}
              fullWidth
              onChange={handleInputChange}
              error={Boolean(displayErrorMsg)}
              helperText={displayErrorMsg}
            />
            <Button disabled={!campaignId.trim()} type={'submit'}>
              Join Campaign
            </Button>
          </Stack>
        </form>
      </>
    );
  };

  return (
    <>
      <RoundButton icon={<LoginIcon />} onClick={() => setOpen(true)}>
        Join Campaign
      </RoundButton>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <JoinCampaignForm />
        </Box>
      </Modal>
    </>
  );
};
export default JoinCampaignModal;
