'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import { Unit, UnitEnum } from '@/types/Unit';
import db from '@/utils/firebase';
import { doc, getDoc } from '@firebase/firestore';

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { campaign, setCampaignId, currentUnit, setCurrentUnit } =
    useCampaign();
  const url = pathname.split('/').slice(1);

  useEffect(() => {
    const fetchUnit = async (id: string) => {
      const unitDocSnap = await getDoc(doc(db, 'units', id));
      if (unitDocSnap.exists()) {
        setCurrentUnit(unitDocSnap.data() as Unit);
      }
    };

    // Set current campaign
    const urlCampaignId = getCampaignIdFromUrl();
    if (!urlCampaignId) {
      setCampaignId(null);
    } else if (urlCampaignId && urlCampaignId !== campaign?.id) {
      setCampaignId(urlCampaignId);
    }

    // Set current viewed unit
    const urlUnitId = getCurrentUnitIdFromUrl();
    if (urlUnitId && urlUnitId !== currentUnit?.id) {
      fetchUnit(urlUnitId);
    }
  }, [pathname]);

  const getCampaignIdFromUrl = () => {
    const baseIndex = url.lastIndexOf('campaigns');
    if (baseIndex !== -1 && url.length > baseIndex) {
      return url[baseIndex + 1];
    } else {
      return null;
    }
  };

  const getCurrentUnitIdFromUrl = () => {
    let baseIndex = -1;
    UnitEnum.forEach((term) => {
      const index = url.lastIndexOf(`${term}s`);
      if (index > baseIndex) {
        baseIndex = index;
      }
    });

    if (baseIndex !== -1 && url.length > baseIndex) {
      return url[baseIndex + 1];
    } else {
      return null;
    }
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
export default AppWrapper;
