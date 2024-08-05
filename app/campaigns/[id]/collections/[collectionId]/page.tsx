'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Box, Container, Typography } from '@mui/material';
import CollectionSearch from '@/components/CollectionSearch';
import { Collection } from '@/types/Unit';

export default function CollectionPage({
  params,
}: {
  params: { collectionId: string };
}) {
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      const collectionDocSnap = await getDoc(
        doc(db, 'units', params.collectionId)
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
    <Container
      sx={{
        height: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {collection && (
        <Box
          sx={{
            minWidth: 350,
            width: '70%',
          }}
        >
          <Typography align="center" variant={'h3'} py={3}>
            {collection?.title}
          </Typography>
          <CollectionSearch collection={collection} />
        </Box>
      )}
    </Container>
  );
}
