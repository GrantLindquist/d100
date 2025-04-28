'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { Box, Button, Divider, Modal, Stack, TextField, Tooltip, Typography } from '@mui/material';

import { Article, Collection, Quest, Unit } from '@/types/Unit';
import { arrayRemove, collection, doc, getDocs, query, runTransaction, updateDoc, where } from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import Masonry from '@mui/lab/Masonry';
import { useCampaign } from '@/hooks/useCampaign';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useAlert } from '@/hooks/useAlert';
import { deleteObject, listAll, ref } from '@firebase/storage';
import { outfit } from '@/components/AppWrapper';
import MoveUnitsModal from '@/components/modals/MoveUnitsModal';
import { SmallIconButton, SmallIconButtonGroup } from '@/components/buttons/SmallIconButton';
import { CondensedUnitTab, UnitTab } from '@/components/UnitTab';

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
        isError: true,
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
          isError: true,
          errorType: e.message,
        });
      }
      setEditing(false);
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

  const searchResults =
    units.filter((unit) => unit.type !== 'collection') ?? [];

  return (
    <>
      <Box pt={{ md: 12 }} alignItems={'center'} display={'flex'} flexDirection={'column'}>
        <Box maxWidth={600} width={'100%'}>
          <Stack direction={'row'} px={1}>
            {isEditing ? (
              <input
                value={collectionTitle}
                onChange={(e) => setCollectionTitle(e.target.value)}
                autoFocus
                style={{
                  all: 'unset',
                  fontSize: '2.9rem',
                  fontWeight: BOLD_FONT_WEIGHT,
                  fontFamily: outfit.style.fontFamily,
                  flexGrow: 1,
                  width: '50%',
                  cursor: 'text',
                }}
              />
            ) : (
              <Typography
                variant="h3"
                fontWeight={BOLD_FONT_WEIGHT}
                flexGrow={1}
                pb={0.5}
                sx={{
                  fontFamily: outfit.style.fontFamily,
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
                    <Tooltip title={'Move Items'} placement={'left'}>
                      <MoveUnitsModal
                        selectedUnitIds={selectedUnitIds}
                        disabled={selectedUnitIds.length === 0 || selectedUnitsIncludeCollection}
                        setEditing={setEditing}
                        currentCollection={props.collection}
                      />
                    </Tooltip>
                    <Tooltip title={'Delete Items'} placement={'left'}>
                      <SmallIconButton

                        disabled={selectedUnitIds.length === 0}
                        onClick={() => handleDeleteUnits(false)}
                        icon={<DeleteIcon />}
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
          <Masonry
            spacing={1}
            columns={
              searchResults.length > 2
                ? { xs: 1, sm: 2, md: 3, lg: 4 }
                : searchResults.length
            }
          >
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
                          return <AutoFixHighIcon />;
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
        </Box>
      )}

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
          <Button onClick={() => {
            handleDeleteUnits(true).then(() => setDisplayDeleteWarningModal(false));
          }}>Yes</Button>
          <Button onClick={() => setDisplayDeleteWarningModal(false)}>On second thought...</Button>
        </Box>
      </Modal>
    </>
  );
};
export default CollectionSearch;
