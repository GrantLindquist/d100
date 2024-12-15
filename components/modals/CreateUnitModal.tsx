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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { generateUUID } from '@/utils/uuid';
import {
  Article,
  Breadcrumb,
  Collection,
  Quest,
  Section,
  Unit,
  UnitType,
} from '@/types/Unit';
import { useParams } from 'next/navigation';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { MODAL_STYLE } from '@/utils/globals';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyIcon from '@mui/icons-material/Key';
import FolderIcon from '@mui/icons-material/Folder';

const CreateUnitModal = (props: { breadcrumbs: Breadcrumb[] }) => {
  const { isUserDm } = useCampaign();

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
    const { user } = useUser();
    const { campaign } = useCampaign();
    const { displayAlert } = useAlert();
    const [unitTitle, setUnitTitle] = useState('');
    const [isHiddenChecked, setHiddenChecked] = useState(false);

    const params = useParams();
    const collectionId = params.collectionId as string;

    const unitDisplayValue = modalState
      ? modalState.charAt(0).toUpperCase() + modalState.slice(1)
      : '';

    const generateBreadcrumbs = (newUnitId: string) => {
      if (campaign) {
        let breadcrumbs = props.breadcrumbs;
        breadcrumbs.push({
          unitId: newUnitId,
          url: `/campaigns/${campaign.id}/${modalState}s/${newUnitId}`,
        });
        return breadcrumbs;
      }
      return [];
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (modalState && user && campaign) {
        try {
          const newUnitId = generateUUID();
          let newUnitObj: Unit = {
            id: newUnitId,
            title: unitTitle,
            type: modalState,
            campaignId: campaign.id,
            breadcrumbs: generateBreadcrumbs(newUnitId),
            hidden: isHiddenChecked,
          };
          const defaultSection: Section = {
            id: generateUUID(),
            title: unitTitle,
            body: [
              {
                type: 'paragraph',
                children: [{ text: '' }],
              },
            ],
            isHeader: true,
            authorId: user.id,
          };

          if (modalState === 'article') {
            newUnitObj = {
              ...newUnitObj,
              imageUrls: [],
              sections: [defaultSection],
            } as Article;
          } else if (modalState === 'quest') {
            newUnitObj = {
              ...newUnitObj,
              imageUrls: [],
              loot: [],
              sections: [defaultSection],
              complete: false,
            } as Quest;
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

          displayAlert({
            message: `Successfully created ${unitDisplayValue}: ${unitTitle}`,
            link: `/campaigns/${campaign?.id}/${modalState}s/${newUnitId}`,
          });
        } catch (e: any) {
          displayAlert({
            message: `An error occurred while creating the ${modalState}.`,
            isError: true,
            errorType: e.message,
          });
        }
        setModalState(null);
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setUnitTitle(value);
    };

    return (
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
                    onChange={(event) => setHiddenChecked(event.target.checked)}
                  />
                }
                label="Hide From Players"
              />
            )}
            <Button type={'submit'}>Create new {unitDisplayValue}</Button>
          </Stack>
        )}
      </form>
    );
  };

  return (
    <>
      <IconButton color={'primary'} onClick={handleClickMenu}>
        <AddIcon />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={handleCloseMenu}>
        <MenuItem onClick={() => setModalState('quest')}>
          <KeyIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Create new Quest
        </MenuItem>
        <MenuItem onClick={() => setModalState('article')}>
          <DescriptionIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Create new Article
        </MenuItem>
        <MenuItem onClick={() => setModalState('collection')}>
          <FolderIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Create new Sub-Collection
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
