'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Article, Collection, Unit } from '@/types/Unit';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import Link from 'next/link';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import { useRouter } from 'next/navigation';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Masonry from '@mui/lab/Masonry';
import { useCampaign } from '@/hooks/useCampaign';

const ArticleTab = (props: { article: Article }) => {
  return (
    <Link
      href={`/campaigns/${props.article.campaignId}/articles/${props.article.id}`}
    >
      <Card variant={'outlined'}>
        {props.article.imageUrls.length > 0 && (
          // <CardMedia sx={{ height: 300 }} image={props.article.imageUrls[0]} />
          <img
            style={{
              width: '100%',
              height: 'auto',
            }}
            src={props.article.imageUrls[0]}
          />
        )}
        <CardContent>
          <Typography>{props.article.title}</Typography>
        </CardContent>
      </Card>
    </Link>
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
          <Typography>Sub-Collection</Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

// TODO: Fix bug that occurs when entering an empty collection
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
              py: 2,
              gap: 1,
            }}
          >
            {units
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
          <Divider />
          {/* TODO: Make column count responsive */}
          <Masonry spacing={1} columns={3} sx={{ py: 2 }}>
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
                      return (
                        <ArticleTab key={unit.id} article={unit as Article} />
                      );
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
