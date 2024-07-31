'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Box, Stack } from '@mui/material';
import CollectionSearch from '@/components/CollectionSearch';
import { Collection } from '@/types/Scoop';

export default function CollectionPage({
  params,
}: {
  params: { collectionId: string };
}) {
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      const collectionDocSnap = await getDoc(
        doc(db, 'scoops', params.collectionId)
      );
      if (collectionDocSnap.exists()) {
        setCollection(collectionDocSnap.data() as Collection);
      } else {
        setCollection(null);
      }
    };

    fetchCollection();
  }, [params.collectionId]);

  // TODO: Figure out best way to handle page loading state, maybe skeleton?
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {collection && (
        <Stack
          direction={'column'}
          justifyContent={'center'}
          width={'45%'}
          minWidth={350}
        >
          {/* @ts-ignore */}
          <h1 align={'center'}>{collection.title}</h1>
          <CollectionSearch collection={collection} />
        </Stack>
      )}
    </Box>
  );
}
