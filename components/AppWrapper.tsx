'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import { UnitEnum } from '@/types/Unit';

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { campaign, setCampaignId, currentUnit, setCurrentUnitId } =
    useCampaign();
  const url = pathname.split('/').slice(1);

  useEffect(() => {
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
      setCurrentUnitId(urlUnitId);
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
