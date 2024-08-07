'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Article, Collection, Quest, Unit } from '@/types/Unit';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import { useRouter } from 'next/navigation';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Masonry from '@mui/lab/Masonry';
import { useCampaign } from '@/hooks/useCampaign';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyIcon from '@mui/icons-material/Key';

const ArticleTab = (props: { article: Article }) => {
  const router = useRouter();
  return (
    <div
      onClick={() =>
        router.push(
          `/campaigns/${props.article.campaignId}/articles/${props.article.id}`
        )
      }
    >
      <Card
        variant={'outlined'}
        sx={{
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'rgba(255,255,255, .05)',
          },
        }}
      >
        {props.article.imageUrls.length > 0 && (
          <img
            style={{
              width: '100%',
              height: 'auto',
            }}
            src={props.article.imageUrls[0]}
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
          <Stack direction={'column'}>
            <DescriptionIcon />
            {props.article.hidden && (
              <Tooltip title={'Hidden from players'}>
                <VisibilityOffIcon style={{ color: '#555555' }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction={'column'}>
            <Typography fontWeight={BOLD_FONT_WEIGHT}>
              {props.article.title}
            </Typography>
            <Typography color={'grey'}>Article</Typography>
          </Stack>
        </Stack>
      </Card>
    </div>
  );
};

const QuestTab = (props: { quest: Quest }) => {
  const router = useRouter();
  return (
    <div
      onClick={() =>
        router.push(
          `/campaigns/${props.quest.campaignId}/quests/${props.quest.id}`
        )
      }
    >
      <Card
        variant={'outlined'}
        sx={{
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'rgba(255,255,255, .05)',
          },
        }}
      >
        <Stack
          direction={'row'}
          spacing={1}
          sx={{
            pl: 1,
            pr: 4,
            py: 1,
          }}
        >
          <Stack direction={'column'}>
            <KeyIcon />
            {props.quest.hidden && (
              <Tooltip title={'Hidden from players'}>
                <VisibilityOffIcon style={{ color: '#555555' }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction={'column'}>
            <Typography fontWeight={BOLD_FONT_WEIGHT}>
              {props.quest.title}
            </Typography>
            <Typography color={'grey'}>Quest</Typography>
          </Stack>
        </Stack>
      </Card>
    </div>
  );
};

const CollectionTab = (props: { collection: Collection }) => {
  const router = useRouter();
  return (
    <Card
      onClick={() =>
        router.push(
          `/campaigns/${props.collection.campaignId}/collections/${props.collection.id}`
        )
      }
      variant="outlined"
      sx={{
        cursor: 'pointer',
        ':hover': {
          backgroundColor: 'rgba(255,255,255, .05)',
        },
      }}
    >
      <Stack
        direction={'row'}
        spacing={1}
        sx={{
          pl: 1,
          pr: 4,
          py: 1,
        }}
      >
        <FolderIcon />
        <Stack direction={'column'}>
          <Typography fontWeight={BOLD_FONT_WEIGHT}>
            {props.collection.title}
          </Typography>
          <Typography color={'grey'}>Sub-Collection</Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

const CollectionSearch = (props: { unitIds: string[] }) => {
  const { isUserDm } = useCampaign();

  const [searchQuery, setSearchQuery] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);

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

  const handleInputChange = (event: Object) => {
    // @ts-ignore
    const value = event.target.value;
    setSearchQuery(value);
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
                      <CollectionTab collection={collection as Collection} />
                    </Box>
                  );
                })}
          </Box>
          {/* TODO: Make column count responsive */}
          <Masonry spacing={1} columns={3} sx={{ py: 1 }}>
            {units
              .filter((unit) => unit.type !== 'collection')
              .map((unit: Unit) => {
                if (
                  unit.title
                    .toLowerCase()
                    .trim()
                    .includes(searchQuery.toLowerCase().trim()) &&
                  (isUserDm || !unit.hidden)
                )
                  switch (unit.type) {
                    case 'article':
                      return (
                        <ArticleTab key={unit.id} article={unit as Article} />
                      );
                    case 'quest':
                      return <QuestTab key={unit.id} quest={unit as Quest} />;
                    default:
                      return null;
                  }
                return null;
              })}
          </Masonry>
        </>
      )}
    </>
  );
};
export default CollectionSearch;
