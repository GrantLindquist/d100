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
import { Article, Scoop, ScoopType } from '@/types/Scoop';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { arrayUnion, doc, setDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';

const CreateNewForm = (props: { modalState: ScoopType | null }) => {
  const [scoopTitle, setScoopTitle] = useState('');
  const [displaySnackbar, setDisplaySnackbar] = useState(false);

  // TODO: turn [id] into [campaignId]
  const params = useParams();
  const campaignId = params.id as string;
  const collectionId = params.collectionId as string;

  const scoopDisplayValue = props.modalState
    ? props.modalState.charAt(0).toUpperCase() + props.modalState.slice(1)
    : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (props.modalState) {
      const newScoopId = generateUUID();
      let newScoopObj: Scoop = {
        id: newScoopId,
        title: scoopTitle,
        type: props.modalState,
        campaignId: campaignId,
      };

      if (props.modalState === 'article') {
        newScoopObj = {
          ...newScoopObj,
          sections: [
            {
              id: generateUUID(),
              title: scoopTitle,
              body: '',
            },
          ],
        } as Article;
      }

      // TODO: Make this a transaction?
      const newScoopRef = doc(db, 'scoops', newScoopId);
      await setDoc(newScoopRef, newScoopObj);

      const currentCollectionRef = doc(db, 'scoops', collectionId);
      await updateDoc(currentCollectionRef, {
        scoopIds: arrayUnion(newScoopId),
      });

      setDisplaySnackbar(true);
    }
  };

  const handleInputChange = (event: Object) => {
    // @ts-ignore
    const value = event.target.value;
    setScoopTitle(value);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {props.modalState && (
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
          <Link href={`/campaigns/${campaignId}/${props.modalState}s/${''}`}>
            <Button>View</Button>
          </Link>
        }
      />
    </>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const CreateNewModal = () => {
  const [modalState, setModalState] = useState<ScoopType | null>(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const handleClickMenu = (event: any) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  return (
    <div>
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
        <Box sx={modalStyle}>
          <CreateNewForm modalState={modalState} />
        </Box>
      </Modal>
    </div>
  );
};

export default CreateNewModal;
