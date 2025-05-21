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
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import EncounterTokenField from '@/components/data-list/EncounterTokenField';
import EncounterAside from '@/components/content/EncounterAside';
import { NAVBAR_HEIGHT_PIXELS } from '@/utils/globals';

export default function EncounterPage() {
  const { user } = useUser();
  const { campaign, setBreadcrumbs } = useCampaign();
  const router = useRouter();
  const pathname = usePathname();

  const theme = useTheme();
  const isCondensed = !useMediaQuery(theme.breakpoints.up('md'));

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [asideOpen, setAsideOpen] = useState(false);

  const masonryBreakpoints = asideOpen ? { 350: 1, 1100: 2, 1500: 3 } : { 350: 1, 800: 2, 1200: 3 };

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
    <Box display="flex" height={`calc(100vh - ${NAVBAR_HEIGHT_PIXELS})`}>
      <Box width={asideOpen ? '75%' : '100%'}>
        <Container>
          <EncounterTokenField encounter={encounter} masonryBreakpoints={masonryBreakpoints} />
        </Container>
      </Box>

      {!isCondensed && (
        <>
          <Box
            onClick={() => setAsideOpen((prev) => !prev)}
            sx={{
              cursor: 'pointer',
              height: '100px',
              width: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: NAVBAR_HEIGHT_PIXELS,
              marginRight: '-1px',
              borderTopLeftRadius: 5,
              borderBottomLeftRadius: 5,
              backgroundColor: '#1E1E1E',
            }}
          >
            {asideOpen ? <ChevronRight /> : <ChevronLeft />}
          </Box>

          <Box
            sx={{
              width: asideOpen ? '25%' : 0,
              flexShrink: 0,
              p: asideOpen ? 3 : 0,
              overflow: 'auto',
              height: '100%',
              visibility: asideOpen ? 'visible' : 'hidden',
              backgroundColor: '#1E1E1E',
            }}
          >
            <EncounterAside
              articleIds={
                [...new Set(encounter.tokens
                  .map((token) => token.articleId ?? null)
                  .filter((id): id is string => id !== null))]}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
