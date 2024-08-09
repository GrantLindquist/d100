'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import CollectionSearch from '@/components/CollectionSearch';
import { Collection } from '@/types/Unit';
import { useCampaign } from '@/hooks/useCampaign';

export default function CollectionPage({
  params,
}: {
  params: { collectionId: string };
}) {
  const { currentUnit } = useCampaign();
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    currentUnit?.type === 'collection' &&
      setCollection(currentUnit as Collection);
  }, [currentUnit]);

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
          <CollectionSearch
            unitIds={collection.unitIds}
            collectionId={collection.id}
          />
        </Box>
      )}
    </Container>
  );
}
