'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { campaign, setCampaignId } = useCampaign();

  useEffect(() => {
    const getCampaignIdFromUrl = () => {
      const url = pathname.split('/').slice(1);
      const baseIndex = url.lastIndexOf('campaigns');
      if (baseIndex !== -1 && url.length > baseIndex) {
        return url[baseIndex + 1];
      } else {
        return null;
      }
    };

    const urlCampaignId = getCampaignIdFromUrl();
    if (!urlCampaignId) {
      setCampaignId(null);
    } else if (urlCampaignId && urlCampaignId !== campaign?.id) {
      setCampaignId(urlCampaignId);
    }
  }, [pathname]);

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
