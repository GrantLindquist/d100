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
import AddIcon from '@mui/icons-material/Add';
import { generateUUID } from '@/utils/uuid';
import { Campaign } from '@/types/Campaign';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Collection } from '@/types/Unit';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';

const CreateCampaignModal = () => {
  const [open, setOpen] = useState(false);

  const CreateCampaignForm = () => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [campaignTitle, setCampaignTitle] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      console.log(user);
      if (user) {
        const newCampaignId = generateUUID();
        const baseCollectionId = generateUUID();
        const newCampaign: Campaign = {
          id: newCampaignId,
          title: campaignTitle,
          baseCollectionId: baseCollectionId,
          dmId: user.id,
          playerIds: [user.id],
        };
        const baseCollection: Collection = {
          id: baseCollectionId,
          campaignId: newCampaignId,
          title: campaignTitle,
          type: 'collection',
          breadcrumbs: [
            {
              title: campaignTitle,
              url: `/campaigns/${newCampaignId}/collections/${baseCollectionId}`,
            },
          ],
          hidden: false,
          unitIds: [],
        };
        // TODO: Error handling
        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'campaigns', newCampaignId), newCampaign);
          transaction.set(doc(db, 'units', baseCollectionId), baseCollection);
          transaction.update(doc(db, 'users', user.id), {
            campaignIds: arrayUnion(newCampaignId),
          });
        });

        setOpen(false);
        displayAlert({
          message: `Successfully created campaign: ${campaignTitle}`,
          link: `/campaigns/${newCampaignId}/collections/${baseCollectionId}`,
        });
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setCampaignTitle(value);
    };

    return (
      <form onSubmit={handleSubmit}>
        <Stack spacing={1}>
          <InputLabel>Campaign Title</InputLabel>
          <TextField
            variant={'outlined'}
            size={'small'}
            fullWidth
            onChange={handleInputChange}
          />
          <Button type={'submit'}>Create new Campaign</Button>
        </Stack>
      </form>
    );
  };

  return (
    <>
      <Button startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        Create Campaign
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <CreateCampaignForm />
        </Box>
      </Modal>
    </>
  );
};
export default CreateCampaignModal;
