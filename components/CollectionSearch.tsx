'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Collection, Unit } from '@/types/Unit';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import Link from 'next/link';
import CreateUnitModal from '@/components/modals/CreateUnitModal';
import { useRouter } from 'next/navigation';
import FolderIcon from '@mui/icons-material/Folder';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Masonry from '@mui/lab/Masonry';

const ArticleTab = (props: { article: Unit }) => {
  return (
    <Link
      href={`/campaigns/${props.article.campaignId}/articles/${props.article.id}`}
    >
      <Box sx={{ backgroundColor: 'grey' }}>
        <p>{props.article.title}</p>
      </Box>
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
          <Typography>Collection</Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

const CollectionSearch = (props: { collection: Collection }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [units, setUnits] = useState<Unit[] | null>(null);

  useEffect(() => {
    // TODO: Fix query to allow more than 10 unitIds
    const fetchUnits = async () => {
      const unitQuery = query(
        collection(db, 'units'),
        where('id', 'in', props.collection.unitIds)
      );
      const unitQuerySnap = await getDocs(unitQuery);
      let units: Unit[] = [];
      unitQuerySnap.forEach((doc) => {
        units.push(doc.data() as Unit);
      });
      setUnits(units);
    };
    props.collection.unitIds.length > 0 && fetchUnits();
  }, []);

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
          {' '}
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
                return (
                  <Box key={collection.id} flexGrow={1} minWidth={'20%'}>
                    <CollectionTab collection={collection as Collection} />
                  </Box>
                );
              })}
          </Box>
          <Divider />
          {/* TODO: Make column count responsive */}
          <Masonry spacing={1}>
            {units
              .filter((unit) => unit.type !== 'collection')
              .map((unit: Unit) => {
                if (
                  unit.title
                    .toLowerCase()
                    .trim()
                    .includes(searchQuery.toLowerCase().trim())
                )
                  switch (unit.type) {
                    case 'article':
                      return (
                        <ArticleTab key={unit.id} article={unit as Unit} />
                      );
                    case 'quest':
                      return (
                        <ArticleTab key={unit.id} article={unit as Unit} />
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
