'use client';

import { useEffect, useState } from 'react';
import { Box, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Collection, Unit } from '@/types/Unit';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import Link from 'next/link';
import CreateUnitModal from '@/components/modals/CreateUnitModal';

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
  return (
    <Link
      href={`/campaigns/${props.collection.campaignId}/collections/${props.collection.id}`}
    >
      <Box sx={{ backgroundColor: 'grey' }}>
        <p>collection: {props.collection.title}</p>
      </Box>
    </Link>
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
    <Stack direction={'column'}>
      <Stack direction={'row'} spacing={1}>
        <TextField
          variant={'outlined'}
          size={'small'}
          fullWidth
          onChange={handleInputChange}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
        />
        <CreateUnitModal />
      </Stack>
      {units?.map((unit: Unit) => {
        if (
          unit.title
            .toLowerCase()
            .trim()
            .includes(searchQuery.toLowerCase().trim())
        )
          switch (unit.type) {
            case 'article':
              return <ArticleTab key={unit.id} article={unit as Unit} />;
            case 'quest':
              return <ArticleTab key={unit.id} article={unit as Unit} />;
            case 'collection':
              return (
                <CollectionTab key={unit.id} collection={unit as Collection} />
              );
            default:
              return <></>;
          }
      })}
    </Stack>
  );
};
export default CollectionSearch;
