'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Modal,
  Stack,
  TextareaAutosize,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Article, Collection, Quest, Unit } from '@/types/Unit';
import { arrayRemove, collection, doc, getDocs, query, runTransaction, updateDoc, where } from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import { useCampaign } from '@/hooks/useCampaign';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAlert } from '@/hooks/useAlert';
import { deleteObject, listAll, ref } from '@firebase/storage';
import { outfit } from '@/components/AppWrapper';
import MoveUnitsModal from '@/components/modals/MoveUnitsModal';
import { SmallIconButton, SmallIconButtonGroup } from '@/components/buttons/SmallIconButton';
import { CondensedUnitTab, UnitTab } from '@/components/UnitTab';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import Image from 'next/image';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { truncate } from '@/utils/string';

// TODO: Make  a caching system that uses lastEditedDate to avoid fetching units every time
const CollectionSearch = (props: {
  unitIds: string[];
  collection: Collection;
}) => {
  const { isUserDm, campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [collectionTitle, setCollectionTitle] = useState(props.collection.title);

  const [units, setUnits] = useState<Unit[]>([]);

  const [isEditing, setEditing] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const selectedUnitIds = selectedUnits.map((unit) => unit.id);
  const selectedUnitsIncludeCollection = selectedUnits.filter((unit) => unit.type === 'collection').length > 0;

  const [displayDeleteWarningModal, setDisplayDeleteWarningModal] = useState(false);
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);

  const fetchUnits = async (unitIds: string[]) => {
    try {
      let units: Unit[] = [];
      const chunkSize = 30;
      const chunks = [];
      for (let i = 0; i < unitIds.length; i += chunkSize) {
        chunks.push(unitIds.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const unitQuery = query(
          collection(db, 'units'),
          where('id', 'in', chunk),
        );
        const unitQuerySnap = await getDocs(unitQuery);
        unitQuerySnap.forEach((doc) => {
          units.push(doc.data() as Unit);
        });
      }
      return units;
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while fetching articles.',
        errorType: e.message,
      });
    }
  };

  useEffect(() => {
    async function initializeState() {
      if (props.unitIds.length > 0) {
        const response = await fetchUnits(props.unitIds);
        setUnits(response ?? []);
      } else {
        setUnits([]);
      }
    }

    initializeState();
  }, [props.unitIds]);

  // Resets selected unit ids when done editing
  useEffect(() => {
    setSelectedUnits([]);
  }, [isEditing]);

  const updateSelectedUnits = (removeId: boolean, unit: Unit) => {
    if (!removeId) {
      let newSelectedUnits = [...selectedUnits];
      newSelectedUnits.push(unit);
      setSelectedUnits(newSelectedUnits);
    } else {
      let newSelectedUnits = [...selectedUnits].filter(
        (selectedUnit) => selectedUnit.id !== unit.id,
      );
      setSelectedUnits(newSelectedUnits);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
  };

  const recursiveDelete = async (units: Unit[]) => {
    let deletedItemCount = 0;
    for (let unit of units) {
      if (unit.type === 'collection') {
        const response = await fetchUnits((unit as Collection).unitIds) ?? [];
        deletedItemCount += await recursiveDelete(response);
      }
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'units', props.collection.id), {
          unitIds: arrayRemove(unit.id),
        });
        transaction.delete(doc(db, 'units', unit.id));
        deletedItemCount += 1;
      });
    }
    const allItems = await listAll(ref(storage, campaign!.id));
    await Promise.all(
      allItems.items.map(async (itemRef) => {
        if (selectedUnitIds.includes(itemRef.name.split('-')[0])) {
          await deleteObject(itemRef);
        }
      }),
    );
    return deletedItemCount;
  };

  const handleDeleteUnits = async (bypassWarning: boolean) => {
    if (!bypassWarning && selectedUnitsIncludeCollection) {
      setDisplayDeleteWarningModal(true);
    } else {
      try {
        const deletedItemCount = await recursiveDelete(selectedUnits);
        displayAlert({
          message: `Successfully deleted ${deletedItemCount} item${deletedItemCount > 1 ? 's' : ''}`,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while deleting articles.',
          errorType: e.message,
        });
      }
      setEditing(false);
    }
  };

  const toggleHideCollection = async (toggle: boolean) => {
    try {
      await updateDoc(doc(db, 'units', props.collection.id), {
        hidden: toggle,
      });
      displayAlert({
        message: `Collection is ${toggle ? 'now' : 'no longer'} hidden from players.`,
      });
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while hiding this content.`,
        errorType: e.message,
      });
    }
  };

  const confirmChanges = async () => {
    if (props.collection.title !== collectionTitle) {
      await updateDoc((doc(db, 'units', props.collection.id)), {
        title: collectionTitle,
      });
    }
    setEditing(false);
  };

  const handleActionMenuOpen = (event: any) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const searchResults = units.filter((unit) => unit.type !== 'collection') ?? [];
  const truncatedCollectionTitle = truncate(props.collection.title, 15);

  return (
    <Box mb={4}>
      <Box mt={{ md: 6 }} alignItems={'center'} display={'flex'} flexDirection={'column'}>
        <Box maxWidth={600} width={'100%'}>
          <Stack direction={'row'} px={1}>
            {isEditing ? (
              <TextareaAutosize
                value={collectionTitle}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 50) {
                    setCollectionTitle(e.target.value);
                  }
                }}
                autoFocus
                minRows={1}
                maxRows={4}
                style={{
                  color: 'white',
                  border: 'none',
                  outline: 'none',
                  lineHeight: 1.1,
                  backgroundColor: 'transparent',
                  fontSize: '3rem',
                  fontWeight: BOLD_FONT_WEIGHT,
                  fontFamily: outfit.style.fontFamily,
                  width: '100%',
                  cursor: 'text',
                  overflow: 'hidden',
                  resize: 'none',
                  padding: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              />
            ) : (
              <Typography
                variant="h3"
                fontWeight={BOLD_FONT_WEIGHT}
                flexGrow={1}
                sx={{
                  fontFamily: outfit.style.fontFamily,
                  lineHeight: 1.1,
                  paddingBottom: .5,
                }}
              >
                {props.collection.title}
              </Typography>
            )}

            <Box minWidth={150} py={1} alignSelf={'flex-end'}>
              <SmallIconButtonGroup>
                <CreateUnitModal
                  breadcrumbs={props.collection.breadcrumbs}
                />
                {!isEditing ? (
                  <Tooltip title={'Edit Items'} placement={'left'}>
                    <SmallIconButton icon={<EditIcon />} onClick={() => setEditing(true)} />
                  </Tooltip>
                ) : (
                  <>
                    <Divider orientation={'vertical'} flexItem />
                    <Tooltip title={'Save Changes'} placement={'left'}>
                      <SmallIconButton
                        onClick={confirmChanges}
                        icon={<CheckIcon />}
                      />
                    </Tooltip>
                    <Tooltip title={'More Actions'} placement={'left'}>
                      <SmallIconButton
                        icon={<MoreVertIcon />}
                        onClick={handleActionMenuOpen}
                      />
                    </Tooltip>
                  </>
                )}
              </SmallIconButtonGroup>
            </Box>
          </Stack>
          <TextField
            variant={'outlined'}
            size={'small'}
            onChange={handleInputChange}
            fullWidth
            placeholder={'Search'}
            sx={{
              backgroundColor: '#222222',
              borderRadius: 50,
              color: '#DDDDDD',
              '& fieldset': { border: 'none' },
            }}
            slotProps={{
              input: {
                startAdornment: <SearchIcon style={{ marginRight: 6 }} />,
              },
            }}
          />
        </Box>
      </Box>
      {units && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
          }} py={2} width={750}>
            {units
              .filter((unit) => unit.type === 'collection')
              .map((collection) => {
                if (!isUserDm && collection.hidden) {
                  return null;
                }
                return (
                  <CondensedUnitTab
                    key={collection.id}
                    unit={collection}
                    icon={<FolderIcon />}
                    isEditing={isEditing}
                    updateState={updateSelectedUnits}
                    checked={selectedUnitIds.includes(collection.id)}
                  />
                );
              })}
          </Box>
          <ResponsiveMasonry columnsCountBreakPoints={{ 200: 1, 400: 2, 600: 3, 800: 4 }}>
            <Masonry>
              {searchResults.map((unit: Unit, index) => {
                if (
                  unit.title
                    .toLowerCase()
                    .trim()
                    .includes(searchQuery.toLowerCase().trim()) &&
                  (isUserDm || !unit.hidden)
                ) {
                  return (
                    <UnitTab
                      key={index}
                      unit={unit}
                      checked={selectedUnitIds.includes(unit.id)}
                      icon={(() => {
                        switch (unit.type) {
                          case 'quest':
                            return <KeyIcon />;
                          case 'encounter':
                            return <Image src={'/encounter-icon.png'} alt={'Encounter'}
                                          style={{ marginRight: '-2px' }} width={24}
                                          height={24} />;
                          default:
                            return <DescriptionIcon />;
                        }
                      })()}
                      isEditing={isEditing}
                      updateState={updateSelectedUnits}
                      {...(unit.type === 'article' ||
                      (unit.type === 'quest' &&
                        (unit as Article | Quest).imageUrls[0])
                        ? { imageUrl: (unit as Article | Quest).imageUrls[0] }
                        : {})}
                    />
                  );
                }
                return null;
              })}
            </Masonry>
          </ResponsiveMasonry>
        </Box>
      )}

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem
          disabled={selectedUnitIds.length === 0 || selectedUnitsIncludeCollection}
        >
          <MoveUnitsModal
            selectedUnitIds={selectedUnitIds}
            disabled={selectedUnitIds.length === 0 || selectedUnitsIncludeCollection}
            setEditing={setEditing}
            currentCollection={props.collection}
            closeMenu={handleActionMenuClose}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            toggleHideCollection(!props.collection.hidden);
            handleActionMenuClose();
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityOffIcon />
            {props.collection.hidden ? `Show ${truncatedCollectionTitle}` : `Hide ${truncatedCollectionTitle}`}
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteUnits(false);
            handleActionMenuClose();
          }}
          disabled={selectedUnitIds.length === 0}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Delete Items
          </Box>
        </MenuItem>
      </Menu>

      <Modal open={displayDeleteWarningModal} onClose={() => setDisplayDeleteWarningModal(false)}>
        <Box sx={MODAL_STYLE} width={600}>
          <Typography variant={'h4'} fontWeight={BOLD_FONT_WEIGHT}>WARNING</Typography>
          <Box py={2}>
            <Typography>You have selected a Sub-Collection for deletion. Deleting a Sub-Collection will result in
              each
              child item also being deleted.</Typography>
            <Typography fontWeight={BOLD_FONT_WEIGHT}>This includes other
              Sub-Collections.</Typography>
            <Typography pt={1}>Do you wish to proceed?</Typography>
          </Box>
          <Button disabled={confirmButtonDisabled} onClick={() => {
            setConfirmButtonDisabled(true);
            handleDeleteUnits(true).then(() => {
              setDisplayDeleteWarningModal(false);
            }).finally(() => setConfirmButtonDisabled(false));
          }}>Yes</Button>
          <Button onClick={() => setDisplayDeleteWarningModal(false)}>On second thought...</Button>
        </Box>
      </Modal>
    </Box>
  );
};
export default CollectionSearch;
