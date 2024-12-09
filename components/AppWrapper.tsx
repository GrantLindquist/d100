'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import { getCampaignIdFromUrl } from '@/utils/url';
import { Outfit } from 'next/font/google';

export const outfit = Outfit({ subsets: ['latin'] });

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { campaign, setCampaignId } = useCampaign();
  const url = pathname.split('/').slice(1);

  useEffect(() => {
    // Set current campaign
    const urlCampaignId = getCampaignIdFromUrl(url);
    if (!urlCampaignId) {
      setCampaignId(null);
    } else if (urlCampaignId && urlCampaignId !== campaign?.id) {
      setCampaignId(urlCampaignId);
    }
  }, [pathname]);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#FF9C6D',
      },
      secondary: {
        main: '#FF956F',
      },
      background: {
        default: '#010101',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // Scrollbar styles
            scrollbarColor: '#666666 rgba(0, 0, 0, 0)', // thumb and track colors

            '&::-webkit-scrollbar': {
              width: '8px', // Width of the scrollbar
              height: '8px', // Height of the scrollbar (for horizontal scroll)
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#666666', // Thumb color
              borderRadius: '8px', // Round the thumb edges
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0)', // Track color
            },
          },
        },
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
