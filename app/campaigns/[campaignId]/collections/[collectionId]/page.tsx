'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import CollectionSearch from '@/components/CollectionSearch';
import { Collection } from '@/types/Unit';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function CollectionPage({
  params,
}: {
  params: { collectionId: string };
}) {
  const { user } = useUser();
  const { campaign } = useCampaign();
  const router = useRouter();
  const { currentUnit } = useCampaign();
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    if (campaign && user) {
      if (!user.campaignIds.includes(campaign.id)) {
        router.push('/campaigns/unauthorized');
      } else {
        currentUnit?.type === 'collection' &&
          setCollection(currentUnit as Collection);
      }
    }
  }, [currentUnit, user?.id, campaign?.id]);

  return (
    <Container>
      {collection && (
        <Box
          sx={{
            pt: 12,
            px: { xs: 2, sm: 4, md: 8, lg: 12 },
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
