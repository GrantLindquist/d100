'use client';
import {
  Box,
  Button,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Modal,
  Snackbar,
  Stack,
  TextField,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { generateUUID } from '@/utils/uuid';
import { Article, Scoop, ScoopType, Section } from '@/types/Scoop';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { MODAL_STYLE } from '@/utils/globals';

const CreateScoopModal = () => {
  const [modalState, setModalState] = useState<ScoopType | null>(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const handleClickMenu = (event: any) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const CreateScoopForm = () => {
    const [scoopTitle, setScoopTitle] = useState('');
    const [displaySnackbar, setDisplaySnackbar] = useState(false);

    // TODO: turn [id] into [campaignId]
    const params = useParams();
    const campaignId = params.id as string;
    const collectionId = params.collectionId as string;

    const scoopDisplayValue = modalState
      ? modalState.charAt(0).toUpperCase() + modalState.slice(1)
      : '';

    // TODO: Breadcrumbs
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (modalState) {
        const newScoopId = generateUUID();
        let newScoopObj: Scoop = {
          id: newScoopId,
          title: scoopTitle,
          type: modalState,
          campaignId: campaignId,
          breadcrumbs: null,
        };

        if (modalState === 'article') {
          newScoopObj = {
            ...newScoopObj,
            sections: [
              {
                id: generateUUID(),
                title: scoopTitle,
                body: '',
                isHeader: true,
              },
            ] as Section[],
          } as Article;
        }

        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'scoops', newScoopId), newScoopObj);
          transaction.update(doc(db, 'scoops', collectionId), {
            scoopIds: arrayUnion(newScoopId),
          });
        });

        setDisplaySnackbar(true);
        setModalState(null);
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setScoopTitle(value);
    };

    // TODO: Route snackbar to new article and place outside of modal
    return (
      <>
        <form onSubmit={handleSubmit}>
          {modalState && (
            <Stack direction={'column'} spacing={1}>
              <InputLabel>{scoopDisplayValue} Title</InputLabel>
              <TextField
                variant={'outlined'}
                size={'small'}
                fullWidth
                onChange={handleInputChange}
              />
              <Button type={'submit'}>Create new {scoopDisplayValue}</Button>
            </Stack>
          )}
        </form>
        <Snackbar
          open={displaySnackbar}
          autoHideDuration={6000}
          onClose={() => setDisplaySnackbar(false)}
          message={scoopDisplayValue + ' created'}
          action={
            <Link href={`/campaigns/${campaignId}/${modalState}s/${''}`}>
              <Button>View</Button>
            </Link>
          }
        />
      </>
    );
  };

  return (
    <>
      <IconButton color={'primary'} onClick={handleClickMenu}>
        <AddIcon />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={handleCloseMenu}>
        <MenuItem onClick={() => setModalState('article')}>
          Create new Article
        </MenuItem>
        <MenuItem onClick={() => setModalState('quest')}>
          Create new Quest
        </MenuItem>
        <MenuItem onClick={() => setModalState('collection')}>
          Create new Sub-Collection
        </MenuItem>
      </Menu>
      <Modal open={Boolean(modalState)} onClose={() => setModalState(null)}>
        <Box sx={MODAL_STYLE}>
          <CreateScoopForm />
        </Box>
      </Modal>
    </>
  );
};

export default CreateScoopModal;
