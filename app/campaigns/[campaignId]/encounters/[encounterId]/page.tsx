'use client';

import { useEffect, useState } from 'react';
import { Breadcrumb } from '@/types/Unit';
import { useCampaign } from '@/hooks/useCampaign';
import { useUser } from '@/hooks/useUser';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Encounter } from '@/types/Encounter';
import { Box, Container, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import EncounterTokenField from '@/components/data-list/EncounterTokenField';
import EncounterAside from '@/components/content/EncounterAside';

export default function EncounterPage() {
  const { user } = useUser();
  const { campaign, setBreadcrumbs } = useCampaign();
  const router = useRouter();
  const pathname = usePathname();

  const [encounter, setEncounter] = useState<Encounter | null>(null);

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
                setEncounter(unitDocSnap.data() as Encounter);
                setBreadcrumbs(unitDocSnap.data().breadcrumbs as Breadcrumb[]);
              }
            },
          );
          return () => {
            unsubscribe();
          };
        }
      }
    }
  }, [user?.id, campaign?.id]);

  if (!encounter) return null;
  return (
    <Box display={'flex'}>
      <Box width={'75%'}>
        <Container>
          <Box
            sx={{
              pt: 12,
            }}
          >
            <Typography variant={'h2'} fontWeight={BOLD_FONT_WEIGHT}>
              {encounter.title}
            </Typography>
            <EncounterTokenField encounter={encounter} />

          </Box>
        </Container>
      </Box>
      <Box sx={{
        width: '25%',
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        p: 3,
        backgroundColor: 'background.paper',
        overflow: 'auto',
        height: '100vh',
      }}>
        <EncounterAside
          articleIds={encounter?.tokens
            .map((token) => token.articleId ?? null)
            .filter((id): id is string => id !== null)}
        />
      </Box>
    </Box>
  );
}
