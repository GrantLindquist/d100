'use client';
import {
  Box,
  Button,
  InputLabel,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';
import { useAlert } from '@/hooks/useAlert';
import { FormEvent, useState } from 'react';
import { Campaign } from '@/types/Campaign';
import {
  arrayRemove,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import { useUser } from '@/hooks/useUser';
import { deleteObject, listAll, ref } from '@firebase/storage';

const EditCampaignForm = (props: {
  campaign: Campaign;
  handleClose: Function;
}) => {
  const { displayAlert } = useAlert();
  const [campaignTitle, setCampaignTitle] = useState('');
  const handleUpdateCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'campaigns', props.campaign.id), {
          title: campaignTitle,
        });
        transaction.update(doc(db, 'units', props.campaign.baseCollectionId), {
          title: campaignTitle,
        });
      });
      props.handleClose();
      displayAlert({
        message: 'Your campaign has been successfully updated.',
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while updating your campaign.',
        isError: true,
        errorType: e.message,
      });
    }
  };

  return (
    <form onSubmit={handleUpdateCampaign}>
      <Stack spacing={1}>
        <InputLabel>Update Campaign Title</InputLabel>
        <TextField
          variant={'outlined'}
          size={'small'}
          fullWidth
          defaultValue={props.campaign.title}
          onChange={(event) => setCampaignTitle(event.target.value)}
        />
        <Button
          type={'submit'}
          disabled={
            !campaignTitle.trim() || campaignTitle === props.campaign.title
          }
        >
          Update Campaign
        </Button>
      </Stack>
    </form>
  );
};

const DeleteCampaignForm = (props: {
  campaign: Campaign;
  handleClose: Function;
}) => {
  const { displayAlert } = useAlert();
  const { user } = useUser();
  const [input, setInput] = useState('');

  const handleDeleteCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (user) {
      try {
        const deleteQuery = query(
          collection(db, 'units'),
          where('campaignId', '==', props.campaign.id)
        );

        await runTransaction(db, async (transaction) => {
          // Gets all players enrolled in campaign (firebase requires all transaction reads to go before writes)
          let players = [];
          const campaignDoc = await transaction.get(
            doc(db, 'campaigns', props.campaign.id)
          );
          if (campaignDoc.exists()) {
            players = campaignDoc.data().players;
          }

          // Deletes every document of campaignId = campaign.id
          const deleteQuerySnap = await getDocs(deleteQuery);
          deleteQuerySnap.forEach((doc) => {
            transaction.delete(doc.ref);
          });
          transaction.delete(doc(db, 'campaigns', props.campaign.id));

          // Removes campaign from player's campaignIds array
          for (let player of players) {
            transaction.update(doc(db, 'users', player.id), {
              campaignIds: arrayRemove(props.campaign.id),
            });
          }

          // Removes every firebase storage item associated with campaign
          listAll(ref(storage, props.campaign.id)).then((res) => {
            res.items.forEach(async (itemRef) => {
              await deleteObject(itemRef);
            });
          });
        });

        props.handleClose();
        displayAlert({
          message: `"${props.campaign.title}" has been deleted.`,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while deleting your campaign.',
          isError: true,
          errorType: e.message,
        });
      }
    }
  };

  return (
    <form onSubmit={handleDeleteCampaign}>
      <Stack spacing={1}>
        <Typography>
          WARNING: Deleting this campaign will permanently erase all associated
          articles, quests, and sub-collections.
        </Typography>
        <Typography>
          <b>This is an irreversible action</b>. If you are certain that you
          want to delete {props.campaign.title}, then enter the campaign title
          in the text field below.
        </Typography>
        <TextField
          variant={'outlined'}
          size={'small'}
          fullWidth
          placeholder={props.campaign.title}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button type={'submit'} disabled={input !== props.campaign.title}>
          Delete Campaign
        </Button>
      </Stack>
    </form>
  );
};

const CampaignActionsModal = (props: {
  campaign: Campaign;
  modalState: 'edit' | 'delete' | null;
  handleClose: () => void;
}) => {
  return (
    <>
      <Modal open={Boolean(props.modalState)} onClose={props.handleClose}>
        <Box sx={MODAL_STYLE}>
          {(() => {
            switch (props.modalState) {
              case 'edit':
                return (
                  <EditCampaignForm
                    campaign={props.campaign}
                    handleClose={props.handleClose}
                  />
                );
              case 'delete':
                return (
                  <DeleteCampaignForm
                    campaign={props.campaign}
                    handleClose={props.handleClose}
                  />
                );
              default:
                return <></>;
            }
          })()}
        </Box>
      </Modal>
    </>
  );
};
export default CampaignActionsModal;
