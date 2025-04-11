'use client';

import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Grid,
  IconButton,
  Modal,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { Article, Collection, ImageUrl, Quest, Unit, UnitDisplayValues } from '@/types/Unit';
import { arrayRemove, collection, doc, getDocs, query, runTransaction, where } from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import { useRouter } from 'next/navigation';
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
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { deleteObject, listAll, ref } from '@firebase/storage';
import ImageFrame from '@/components/content/ImageFrame';
import { outfit } from '@/components/AppWrapper';
import MoveUnitsModal from '@/components/modals/MoveUnitsModal';

// TODO: Collection search needs new UI. One that doesn't use mui/masonry

// TODO: Include sub-collections inside unit selection
// TODO: CollectionSearch UI is buggy when loading images, horizontal scrollbar pops into view and images flicker
const UnitTab = (props: {
  unit: Unit;
  checked?: boolean;
  icon: ReactNode;
  isEditing: boolean;
  updateState: (removeId: boolean, unit: Unit) => void;
  imageUrl?: ImageUrl;
}) => {
  const router = useRouter();

  const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
    props.updateState(!event.target.checked, props.unit);
  };
  return (
    <div
      onClick={() =>
        !props.isEditing &&
        router.push(
          `/campaigns/${props.unit.campaignId}/${props.unit.type}s/${props.unit.id}`,
        )
      }
    >
      <Card
        variant="outlined"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: '#444444',
          borderWidth: '2px',
          cursor: 'pointer',
          ':hover': !props.isEditing
            ? {
              backgroundColor: 'rgba(28, 28, 28)',
            }
            : {},
        }}
      >
        {props.imageUrl && (
          <ImageFrame image={props.imageUrl} alt={props.unit.title} />
        )}
        <Stack
          direction={'row'}
          spacing={1}
          sx={{
            pl: 1,
            pr: 4,
            py: 1,
          }}
        >
          <Stack direction={'row'} spacing={1} flexGrow={1}>
            <Stack direction={'column'}>
              {props.icon}
              {props.unit.hidden && (
                <Tooltip title={'Hidden from players'}>
                  <VisibilityOffIcon sx={{ color: 'grey' }} />
                </Tooltip>
              )}
            </Stack>
            <Stack direction={'column'}>
              <Typography fontWeight={BOLD_FONT_WEIGHT}>
                {props.unit.title}
              </Typography>
              <Typography color={'grey'}>
                {UnitDisplayValues[props.unit.type]}
              </Typography>
            </Stack>
          </Stack>
          {props.isEditing && (
            <Checkbox
              checked={props.checked}
              onChange={handleCheck}
              sx={{
                p: 0,
                ':hover': {
                  backgroundColor: 'rgba(0,0,0,0)',
                },
              }}
            />
          )}
        </Stack>
      </Card>
    </div>
  );
};

const CollectionSearch = (props: {
  unitIds: string[];
  collection: Collection;
}) => {
  const { isUserDm, campaign } = useCampaign();
  const { displayAlert } = useAlert();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
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

  const searchResults =
    units.filter((unit) => unit.type !== 'collection') ?? [];

  return (
    <Grid container columns={24} spacing={3}>
      <Grid item xs={24} md={11}>
        <Box
          sx={{
            [theme.breakpoints.up('md')]: {
              position: 'fixed',
              height: '80vh',
              width: '30vw',
            },
          }}
        >
          <Box pt={{ md: 12 }}>
            <Typography variant={'subtitle2'} color={'grey'}>
              Collection
            </Typography>
            <Typography
              variant={'h3'}
              fontWeight={BOLD_FONT_WEIGHT}
              pb={2}
              sx={{
                fontFamily: outfit.style.fontFamily,
              }}
            >
              {props.collection.title}
            </Typography>
            <TextField
              variant={'outlined'}
              size={'small'}
              onChange={handleInputChange}
              fullWidth
              placeholder={'Search'}
              sx={{
                marginBottom: 5,
                backgroundColor: '#222222',
                borderRadius: 50,
                color: '#DDDDDD',
                '& fieldset': { border: 'none' },
              }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon style={{ marginRight: 6 }} />,
                  endAdornment: (
                    <CreateUnitModal
                      breadcrumbs={props.collection.breadcrumbs}
                    />
                  ),
                },
              }}
            />
            <Box
              sx={{
                maxHeight: '40vh',
                overflowY: 'auto',
              }}
            >
              {units
                .filter((unit) => unit.type === 'collection')
                .map((collection) => {
                  if (!isUserDm && collection.hidden) {
                    return null;
                  }
                  return (
                    <Box key={collection.id} py={0.75} maxWidth={'80%'}>
                      <UnitTab
                        unit={collection}
                        icon={<FolderIcon />}
                        isEditing={isEditing}
                        updateState={updateSelectedUnits}
                        checked={selectedUnitIds.includes(collection.id)}
                      />
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid item md={13}>
        {units && (
          <>
            <Masonry
              spacing={1}
              columns={
                searchResults.length > 2
                  ? { xs: 1, sm: 2, md: 3 }
                  : searchResults.length
              }
              sx={{ width: '100%' }}
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
            <Stack
              direction="column"
              p={3}
              sx={{
                position: 'fixed',
                right: 16,
                bottom: 16,
              }}
            >
              {!isEditing ? (
                <Tooltip title={'Edit Items'} placement={'left'}>
                  <IconButton size="large" onClick={() => setEditing(true)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title={'Save Changes'} placement={'left'}>
                    <IconButton
                      size="large"
                      onClick={() => {
                        setEditing(false);
                      }}
                    >
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={'Move Items'} placement={'left'}>
                    <span>
                      <MoveUnitsModal
                        selectedUnitIds={selectedUnitIds}
                        disabled={selectedUnitIds.length === 0 || selectedUnitsIncludeCollection}
                        setEditing={setEditing}
                        currentCollection={props.collection}
                      />
                    </span>
                  </Tooltip>
                  <Tooltip title={'Delete Items'} placement={'left'}>
                    <span>
                      <IconButton
                        size="large"
                        disabled={selectedUnitIds.length === 0}
                        onClick={() => handleDeleteUnits(false)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Stack>
          </>
        )}
      </Grid>
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
    </Grid>
  );
};
export default CollectionSearch;
