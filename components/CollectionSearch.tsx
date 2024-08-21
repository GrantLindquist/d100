'use client';

import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  Card,
  Checkbox,
  Fab,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { Article, Quest, Unit, UnitDisplayValues } from '@/types/Unit';
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

const UnitTab = (props: {
  unit: Unit;
  icon: ReactNode;
  isEditing: boolean;
  updateState: (removeId: boolean, unitId: string) => void;
  imageUrl?: string;
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
          cursor: 'pointer',
          ':hover': !props.isEditing
            ? {
                backgroundColor: 'rgba(255,255,255, .05)',
              }
            : {},
        }}
      >
        {props.imageUrl && (
          <img
            style={{
              width: '100%',
              height: 'auto',
            }}
            src={props.imageUrl}
            alt={''}
          />
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
  collectionId: string;
}) => {
  const { isUserDm, campaign } = useCampaign();
  const { displayAlert } = useAlert();

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
          errorType: e.name,
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
            transaction.update(doc(db, 'units', props.collectionId), {
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
          errorType: e.name,
        });
      }
    }
    setEditing(false);
  };

  return (
    <>
      <Stack direction={'row'} justifyContent="center">
        <TextField
          variant={'outlined'}
          size={'small'}
          onChange={handleInputChange}
          InputProps={{
            startAdornment: <SearchIcon />,
            endAdornment: <CreateUnitModal />,
          }}
          sx={{
            width: '70%',
          }}
        />
      </Stack>
      {units && (
        <>
          <Grid container spacing={1} py={2} pr={1}>
            {searchQuery.trim().length === 0 &&
              units
                .filter((unit) => unit.type === 'collection')
                .map((collection) => {
                  if (!isUserDm && collection.hidden) {
                    return null;
                  }
                  return (
                    <Grid key={collection.id} item xs={12} sm={6} lg={4}>
                      <UnitTab
                        unit={collection}
                        icon={<FolderIcon />}
                        isEditing={isEditing}
                        updateState={updateSelectedUnitIds}
                      />
                    </Grid>
                  );
                })}
          </Grid>
          <Masonry spacing={1} columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
            {units
              .filter((unit) => unit.type !== 'collection')
              .map((unit: Unit, index) => {
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
            spacing={1}
            p={3}
            sx={{
              position: 'fixed',
              right: 16,
              bottom: 16,
            }}
          >
            {!isEditing ? (
              <Tooltip title={'Edit Items'} placement={'left'}>
                <Fab size="small" onClick={() => setEditing(true)}>
                  <EditIcon />
                </Fab>
              </Tooltip>
            ) : (
              <>
                <Tooltip title={'Save Changes'} placement={'left'}>
                  <Fab size="small" onClick={() => setEditing(false)}>
                    <CheckIcon />
                  </Fab>
                </Tooltip>
                <Tooltip title={'Move Items'} placement={'left'}>
                  <span>
                    <Fab
                      size="small"
                      disabled
                      onClick={() => setEditing(false)}
                    >
                      <DriveFileMoveIcon />
                    </Fab>
                  </span>
                </Tooltip>
                <Tooltip title={'Delete Items'} placement={'left'}>
                  <span>
                    <Fab
                      size="small"
                      disabled={selectedUnitIds.length === 0}
                      onClick={handleDeleteUnits}
                    >
                      <DeleteIcon />
                    </Fab>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
        </>
      )}
    </>
  );
};
export default CollectionSearch;
