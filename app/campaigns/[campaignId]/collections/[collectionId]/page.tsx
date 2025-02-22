'use client';

import { useEffect, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import CollectionSearch from '@/components/CollectionSearch';
import { Breadcrumb, Collection } from '@/types/Unit';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';

export default function CollectionPage() {
  const { user } = useUser();
  const { campaign, setBreadcrumbs } = useCampaign();
  const router = useRouter();
  const pathname = usePathname();

  const theme = useTheme();
  const displayBgImage = useMediaQuery(theme.breakpoints.up('md'));

  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    if (campaign && user) {
      if (!user.campaignIds.includes(campaign.id)) {
        router.push('/campaigns/unauthorized');
      } else {
        const url = pathname.split('/').slice(1);
        const unitId = getCurrentUnitIdFromUrl(url);
        if (unitId) {
          const unsubscribe = onSnapshot(
            doc(db, 'units', unitId),
            (unitDocSnap) => {
              if (unitDocSnap.exists()) {
                setCollection(unitDocSnap.data() as Collection);
                setBreadcrumbs(unitDocSnap.data().breadcrumbs as Breadcrumb[]);
              }
            }
          );
          return () => {
            unsubscribe();
          };
        }
      }
    }
  }, [user?.id, campaign?.id]);

  return (
    <>
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'fixed',
        }}
      >
        {displayBgImage && (
          <img src={'/d100-grey.svg'} style={{ width: '50%' }} />
        )}
      </Box>
      {collection && (
        <Box
          sx={{
            pt: 12,
            px: { xs: 2, sm: 4, md: 8, lg: 12 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <CollectionSearch
            unitIds={collection.unitIds}
            collection={collection}
          />
        </Box>
      )}
    </>
  );
}
