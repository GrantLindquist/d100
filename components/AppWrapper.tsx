'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import { getCampaignIdFromUrl, getCurrentUnitIdFromUrl } from '@/utils/url';

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { campaign, setCampaignId, currentUnit, setCurrentUnitId } =
    useCampaign();
  const url = pathname.split('/').slice(1);

  useEffect(() => {
    // Set current campaign
    const urlCampaignId = getCampaignIdFromUrl(url);
    if (!urlCampaignId) {
      setCampaignId(null);
    } else if (urlCampaignId && urlCampaignId !== campaign?.id) {
      setCampaignId(urlCampaignId);
    }

    // Set current viewed unit
    const urlUnitId = getCurrentUnitIdFromUrl(url);
    if (urlUnitId && urlUnitId !== currentUnit?.id) {
      setCurrentUnitId(urlUnitId);
    }
  }, [pathname]);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#8970FF',
      },
      secondary: {
        main: '#FF956F',
      },
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
