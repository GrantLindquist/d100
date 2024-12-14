'use client';

import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Checkbox,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import {
  Article,
  Collection,
  ImageUrl,
  Quest,
  Unit,
  UnitDisplayValues,
} from '@/types/Unit';
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
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import { useRouter } from 'next/navigation';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Masonry from '@mui/lab/Masonry';
import { useCampaign } from '@/hooks/useCampaign';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAlert } from '@/hooks/useAlert';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { deleteObject, listAll, ref } from '@firebase/storage';
import ImageFrame from '@/components/content/ImageFrame';
import { outfit } from '@/components/AppWrapper';

// TODO: Create a skeleton for this
const UnitTab = (props: {
  unit: Unit;
  icon: ReactNode;
  isEditing: boolean;
  updateState: (removeId: boolean, unitId: string) => void;
  imageUrl?: ImageUrl;
}) => {
  const router = useRouter();
  // Changing this state re-renders entire component
  const [isSelected, setSelected] = useState(false);

  const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelected(checked);
    props.updateState(!checked, props.unit.id);
  };
  return (
    <div
      onClick={() =>
        !props.isEditing &&
        router.push(
          `/campaigns/${props.unit.campaignId}/${props.unit.type}s/${props.unit.id}`
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
          {props.isEditing && props.unit.type !== 'collection' && (
            <Checkbox
              checked={isSelected}
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
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        let units: Unit[] = [];
        const chunkSize = 30;
        const chunks = [];
        for (let i = 0; i < props.unitIds.length; i += chunkSize) {
          chunks.push(props.unitIds.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
          const unitQuery = query(
            collection(db, 'units'),
            where('id', 'in', chunk)
          );
          const unitQuerySnap = await getDocs(unitQuery);
          unitQuerySnap.forEach((doc) => {
            units.push(doc.data() as Unit);
          });
        }
        setUnits(units);
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while fetching articles.',
          isError: true,
          errorType: e.message,
        });
      }
    };

    props.unitIds.length > 0 ? fetchUnits() : setUnits([]);
  }, [props.unitIds]);

  const updateSelectedUnitIds = (removeId: boolean, unitId: string) => {
    if (!removeId) {
      let newSelectedUnitIds = [...selectedUnitIds];
      newSelectedUnitIds.push(unitId);
      setSelectedUnitIds(newSelectedUnitIds);
    } else {
      let newSelectedUnitIds = [...selectedUnitIds].filter(
        (id) => id !== unitId
      );
      setSelectedUnitIds(newSelectedUnitIds);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
  };

  const handleDeleteUnits = async () => {
    if (campaign) {
      try {
        await runTransaction(db, async (transaction) => {
          for (let unitId of selectedUnitIds) {
            transaction.update(doc(db, 'units', props.collection.id), {
              unitIds: arrayRemove(unitId),
            });
          }
          listAll(ref(storage, campaign.id)).then((res) => {
            res.items.forEach(async (itemRef) => {
              if (selectedUnitIds.includes(itemRef.name.split('-')[0])) {
                await deleteObject(itemRef);
              }
            });
          });
        });

        displayAlert({
          message: `Successfully deleted ${selectedUnitIds.length} item${selectedUnitIds.length > 1 ? 's' : ''}`,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while deleting articles.',
          isError: true,
          errorType: e.message,
        });
      }
    }
    setEditing(false);
  };

  const searchResults =
    units.filter((unit) => unit.type !== 'collection') ?? [];

  return (
    <Grid container columns={24} spacing={3}>
      <Grid item md={11}>
        <Box
          sx={{
            [theme.breakpoints.up('md')]: {
              position: 'fixed',
              height: '80vh',
              width: '50vh',
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
              sx={{
                paddingBottom: 5,
              }}
              InputProps={{
                startAdornment: <SearchIcon />,
                endAdornment: (
                  <CreateUnitModal breadcrumbs={props.collection.breadcrumbs} />
                ),
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
                        updateState={updateSelectedUnitIds}
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
              sx={{ width: '100% ' }}
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
                      icon={
                        unit.type === 'quest' ? (
                          <KeyIcon />
                        ) : (
                          <DescriptionIcon />
                        )
                      }
                      isEditing={isEditing}
                      updateState={updateSelectedUnitIds}
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
                    <IconButton size="large" onClick={() => setEditing(false)}>
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={'Move Items'} placement={'left'}>
                    <span>
                      <IconButton
                        size="large"
                        disabled
                        onClick={() => setEditing(false)}
                      >
                        <DriveFileMoveIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={'Delete Items'} placement={'left'}>
                    <span>
                      <IconButton
                        size="large"
                        disabled={selectedUnitIds.length === 0}
                        onClick={handleDeleteUnits}
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
    </Grid>
  );
};
export default CollectionSearch;
