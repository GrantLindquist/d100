'use client';

// TODO: Delete functionality does not work properly
import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Checkbox,
  Fab,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Article, Quest, Unit, UnitDisplayValues } from '@/types/Unit';
import {
  arrayRemove,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@firebase/firestore';
import db from '@/utils/firebase';
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
            {props.icon}
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
  const { isUserDm } = useCampaign();

  const [searchQuery, setSearchQuery] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);

  const [isEditing, setEditing] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Fix query to allow more than 10 unitIds
    const fetchUnits = async () => {
      const unitQuery = query(
        collection(db, 'units'),
        where('id', 'in', props.unitIds)
      );
      const unitQuerySnap = await getDocs(unitQuery);
      let units: Unit[] = [];
      unitQuerySnap.forEach((doc) => {
        units.push(doc.data() as Unit);
      });
      setUnits(units);
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
    setEditing(false);
    for (let unitId of selectedUnitIds) {
      await updateDoc(doc(db, 'units', props.collectionId), {
        unitIds: arrayRemove(unitId),
      });
    }
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
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              pt: 2,
              pb: 1,
              gap: 1,
            }}
          >
            {searchQuery.trim().length === 0 &&
              units
                .filter((unit) => unit.type === 'collection')
                .map((collection) => {
                  if (!isUserDm && collection.hidden) {
                    return null;
                  }
                  return (
                    <Box key={collection.id} flexGrow={1} minWidth={'20%'}>
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
          {/* TODO: Make column count responsive */}
          <Masonry spacing={1} columns={3} sx={{ py: 1 }}>
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
              <Fab size="small" onClick={() => setEditing(true)}>
                <EditIcon />
              </Fab>
            ) : (
              <>
                <Fab size="small" onClick={() => setEditing(false)}>
                  <CheckIcon />
                </Fab>
                <Fab size="small" disabled onClick={() => setEditing(false)}>
                  <DriveFileMoveIcon />
                </Fab>
                <Fab
                  size="small"
                  disabled={selectedUnitIds.length === 0}
                  onClick={handleDeleteUnits}
                >
                  <DeleteIcon />
                </Fab>
              </>
            )}
          </Stack>
        </>
      )}
    </>
  );
};
export default CollectionSearch;
