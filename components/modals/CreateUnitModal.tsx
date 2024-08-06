'use client';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { generateUUID } from '@/utils/uuid';
import { Article, Collection, Section, Unit, UnitType } from '@/types/Unit';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { MODAL_STYLE } from '@/utils/globals';
import { useCampaign } from '@/hooks/useCampaign';

const CreateUnitModal = () => {
  const { isUserDm, currentUnit } = useCampaign();

  const [modalState, setModalState] = useState<UnitType | null>(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const handleClickMenu = (event: any) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const CreateUnitForm = () => {
    const [unitTitle, setUnitTitle] = useState('');
    const [isHiddenChecked, setHiddenChecked] = useState(false);
    const [displaySnackbar, setDisplaySnackbar] = useState(false);

    const params = useParams();
    const campaignId = params.id as string;
    const collectionId = params.collectionId as string;

    const unitDisplayValue = modalState
      ? modalState.charAt(0).toUpperCase() + modalState.slice(1)
      : '';

    const generateBreadcrumbs = (newUnitId: string) => {
      if (currentUnit?.type === 'collection') {
        let breadcrumbs = currentUnit.breadcrumbs;
        breadcrumbs.push({
          title: unitTitle,
          url: `/campaigns/${campaignId}/${modalState}s/${newUnitId}`,
        });
        return breadcrumbs;
      }
      return [];
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (modalState) {
        const newUnitId = generateUUID();
        let newUnitObj: Unit = {
          id: newUnitId,
          title: unitTitle,
          type: modalState,
          campaignId: campaignId,
          breadcrumbs: generateBreadcrumbs(newUnitId),
          hidden: isHiddenChecked,
        };

        if (modalState === 'article') {
          newUnitObj = {
            ...newUnitObj,
            imageUrls: [],
            sections: [
              {
                id: generateUUID(),
                title: unitTitle,
                body: '',
                isHeader: true,
              },
            ] as Section[],
          } as Article;
        } else if (modalState === 'collection') {
          newUnitObj = {
            ...newUnitObj,
            unitIds: [],
          } as Collection;
        }

        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'units', newUnitId), newUnitObj);
          transaction.update(doc(db, 'units', collectionId), {
            unitIds: arrayUnion(newUnitId),
          });
        });

        setDisplaySnackbar(true);
        setModalState(null);
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setUnitTitle(value);
    };

    // TODO: Route snackbar to new article and place outside of modal
    return (
      <>
        <form onSubmit={handleSubmit}>
          {modalState && (
            <Stack spacing={1}>
              <Typography>{unitDisplayValue} Title</Typography>
              <TextField
                variant={'outlined'}
                size={'small'}
                fullWidth
                onChange={handleInputChange}
              />
              {isUserDm && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isHiddenChecked}
                      onChange={(event) =>
                        setHiddenChecked(event.target.checked)
                      }
                    />
                  }
                  label="Hide From Players"
                />
              )}
              <Button type={'submit'}>Create new {unitDisplayValue}</Button>
            </Stack>
          )}
        </form>
        <Snackbar
          open={displaySnackbar}
          autoHideDuration={6000}
          onClose={() => setDisplaySnackbar(false)}
          message={unitDisplayValue + ' created'}
          action={
            <Link href={`/campaigns/${campaignId}/${modalState}s`}>
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
        <MenuItem disabled onClick={() => setModalState('quest')}>
          Create new Quest
        </MenuItem>
        <MenuItem onClick={() => setModalState('collection')}>
          Create new Sub-Collection
        </MenuItem>
      </Menu>
      <Modal open={Boolean(modalState)} onClose={() => setModalState(null)}>
        <Box sx={MODAL_STYLE}>
          <CreateUnitForm />
        </Box>
      </Modal>
    </>
  );
};

export default CreateUnitModal;
