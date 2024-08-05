'use client';

import { useEffect, useState } from 'react';
import { Box, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Collection, Scoop } from '@/types/Scoop';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import Link from 'next/link';
import CreateScoopModal from '@/components/modals/CreateScoopModal';

const ArticleTab = (props: { article: Scoop }) => {
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
  const [scoops, setScoops] = useState<Scoop[] | null>(null);

  useEffect(() => {
    // TODO: Fix query to allow more than 10 scoopIds
    const fetchScoops = async () => {
      const scoopQuery = query(
        collection(db, 'scoops'),
        where('id', 'in', props.collection.scoopIds)
      );
      const scoopQuerySnap = await getDocs(scoopQuery);
      let scoops: Scoop[] = [];
      scoopQuerySnap.forEach((doc) => {
        scoops.push(doc.data() as Scoop);
      });
      setScoops(scoops);
    };
    props.collection.scoopIds?.length > 0 && fetchScoops();
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
        <CreateScoopModal />
      </Stack>
      {scoops?.map((scoop: Scoop) => {
        if (
          scoop.title
            .toLowerCase()
            .trim()
            .includes(searchQuery.toLowerCase().trim())
        )
          switch (scoop.type) {
            case 'article':
              return <ArticleTab key={scoop.id} article={scoop as Scoop} />;
            case 'quest':
              return <ArticleTab key={scoop.id} article={scoop as Scoop} />;
            case 'collection':
              return (
                <CollectionTab
                  key={scoop.id}
                  collection={scoop as Collection}
                />
              );
            default:
              return <></>;
          }
      })}
    </Stack>
  );
};
export default CollectionSearch;
